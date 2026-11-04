import { audioUrl } from '../../content';

/**
 * Audio-Wiedergabe komplett über WebAudio: fetch → decodeAudioData → BufferSource.
 * Gründe: iOS-Unlock über AudioContext.resume() bei einer Nutzergeste, AnalyserNode
 * für die Klangscheibe und keine Range-Requests (Safari-<audio> aus dem SW-Cache ist heikel).
 *
 * Selbstheilung – auf Alex' iPhone war der Ton zweimal plötzlich weg. iOS gibt einen Kontext nach
 * Sperrbildschirm, App-Wechsel, Anruf oder Siri gern „interrupted“ oder scheinbar „running“, aber
 * mit stehender Uhr zurück, und resume() hängt dann. Deshalb:
 * 1. Geht die App in den Hintergrund, wird der Kontext geschlossen. Die erste Geste danach baut
 *    einen frischen – derselbe Weg wie beim App-Start, der nachweislich funktioniert.
 * 2. Einem Kontext, der von selbst unterbrochen wurde oder dessen Audio-Uhr steht, wird nicht
 *    mehr getraut: die nächste Geste ersetzt ihn.
 * 3. Auf resume() und das Abspielen wird nie ohne Zeitlimit gewartet.
 * 4. Bleibt der Ton trotzdem blockiert, meldet `onAudioStatus` das (Hinweis in der App), und
 *    `retry()` spielt das verpasste Audio aus der nächsten Geste nach.
 * Alle Fälle sichert tests/player.test.ts mit einem nachgebauten iOS-Kontext ab.
 */

/** Audio Session API (Safari ≥ 16.4), noch nicht in lib.dom. */
type AudioSession = EventTarget & { type: string; state?: string };
type AudioSessionNavigator = Navigator & { audioSession?: AudioSession };

export type AudioStatus = {
  /** Ton ist blockiert – die App zeigt einen Hinweis, dessen Tippen ihn repariert. */
  blocked: boolean;
  /** Zustand des Kontexts (Diagnose in den Einstellungen); „none“ = noch keiner. */
  state: string;
  /** Wie oft ein gestörter Kontext ersetzt wurde. */
  rebuilds: number;
  /** Letzte erkannte Störung mit Uhrzeit, leer = keine. */
  issue: string;
};

/** iOS blockiert den Ton gerade; die nächste Geste repariert ihn. */
export class AudioBlockedError extends Error {}

/** So lange darf resume() dauern, bevor der Kontext als blockiert gilt. */
const RESUME_LIMIT_MS = 600;
/** Nach dieser Zeit muss die Audio-Uhr beim Abspielen sichtbar weitergelaufen sein. */
const CLOCK_PROBE_MS = 300;

let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let current: AudioBufferSourceNode | null = null;
/** Grund, dem Kontext nicht mehr zu trauen – die nächste Geste ersetzt ihn. Leer = vertrauenswürdig. */
let distrust = '';
/** Letzte Stichprobe der Audio-Uhr (s) gegen die Wanduhr (ms), genommen bei Gesten. */
let clock: { audio: number; wall: number } | null = null;
/** Audio, das wegen einer Blockade nicht lief – `retry()` spielt es nach. */
let pending: string | null = null;
const buffers = new Map<string, Promise<AudioBuffer>>();

const status: AudioStatus = { blocked: false, state: 'none', rebuilds: 0, issue: '' };
const listeners = new Set<(s: AudioStatus) => void>();

/** Meldet jede Änderung des Audio-Zustands (sofort einmal mit dem aktuellen). Gibt die Abmeldung zurück. */
export function onAudioStatus(fn: (s: AudioStatus) => void): () => void {
  listeners.add(fn);
  fn({ ...status });
  return () => listeners.delete(fn);
}

function report(patch: Partial<AudioStatus>): void {
  Object.assign(status, patch);
  const snapshot = { ...status };
  for (const fn of listeners) fn(snapshot);
}

const stamp = (issue: string) => `${issue} (${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })})`;

/** Als Funktion, damit TypeScript den Zustand nach einem await nicht falsch eingrenzt. */
const isRunning = (c: AudioContext) => c.state === 'running';

/** Baut einen frischen Kontext samt Analyser für die Klangscheibe. */
function build(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  // iOS behandelt WebAudio sonst als „ambient“: der Stummschalter schaltet die Lerninhalte ab.
  const session = (navigator as AudioSessionNavigator).audioSession;
  if (session) session.type = 'playback';
  const c = new AudioContext();
  let ran = false;
  c.onstatechange = () => {
    if (c !== ctx) return;
    const state: string = c.state;
    if (state === 'running') ran = true;
    // Von selbst unterbrochen (Anruf, Siri, Sperre): diesem Kontext nicht mehr trauen.
    else if (state === 'interrupted' || ran) distrust ||= `Kontext ${state}`;
    report({ state });
  };
  analyser = c.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.6;
  analyser.connect(c.destination);
  ctx = c;
  distrust = '';
  clock = null;
  report({ state: c.state });
  return c;
}

/** Stoppt die Wiedergabe und schließt den Kontext. */
function retire(): void {
  const c = ctx;
  if (!c) return;
  halt();
  ctx = null;
  analyser = null;
  clock = null;
  report({ state: 'none' });
  c.close().catch(() => {});
}

/** Läuft die Audio-Uhr nicht mit der Wanduhr mit, ist der Kontext stumm, obwohl er „running“ meldet. */
function clockStalled(c: AudioContext): boolean {
  if (!isRunning(c) || !clock) return false;
  const wall = (performance.now() - clock.wall) / 1000;
  return wall > 1 && c.currentTime - clock.audio < wall / 4;
}

/** Startet den Kontext in einer Geste; der stille Puffer lässt iOS die Ausgabe freigeben. */
function kick(c: AudioContext): void {
  c.resume().catch(() => {});
  const src = c.createBufferSource();
  src.buffer = c.createBuffer(1, 1, 22050);
  src.connect(c.destination);
  src.start(0);
}

/** Bei jeder Geste: gestörten Kontext ersetzen, schlafenden wecken, Audio-Uhr messen. */
function onGesture(): void {
  let c = ctx;
  if (c) {
    const reason = distrust || (c.state === 'closed' ? 'Kontext geschlossen' : clockStalled(c) ? 'Audio-Uhr stand' : '');
    if (reason) {
      retire();
      report({ rebuilds: status.rebuilds + 1, issue: stamp(reason) });
      c = null;
    }
  }
  c ??= build();
  if (!c) return;
  if (!isRunning(c)) kick(c);
  else clock = { audio: c.currentTime, wall: performance.now() };
}

/**
 * Einmal beim Start aufrufen. iOS gibt den Kontext nur bei touchend/click frei (nicht bei
 * pointerdown), deshalb hören alle vier Gesten dauerhaft mit.
 */
export function installAudioUnlock(): void {
  for (const type of ['pointerdown', 'touchend', 'click', 'keydown']) addEventListener(type, onGesture, true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') retire();
  });
  const session = (navigator as AudioSessionNavigator).audioSession;
  if (session)
    session.addEventListener('statechange', () => {
      if (session.state === 'interrupted') distrust ||= 'Audio-Session unterbrochen';
    });
}

function load(id: string): Promise<AudioBuffer> {
  let p = buffers.get(id);
  if (!p) {
    p = fetch(audioUrl(id))
      .then((r) => {
        if (!r.ok) throw new Error(`Audio ${id}: HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then((data) => {
        // AudioBuffer gehören keinem Kontext – sie überleben jeden Neubau.
        const c = ctx ?? build();
        if (!c) throw new Error('Kein WebAudio verfügbar');
        return c.decodeAudioData(data);
      });
    p.catch(() => buffers.delete(id));
    buffers.set(id, p);
  }
  return p;
}

/** Merkt das Audio zum Nachspielen vor und meldet die Blockade. */
function block(id: string, issue: string): AudioBlockedError {
  pending = id;
  distrust ||= issue;
  report({ blocked: true, issue: stamp(issue) });
  return new AudioBlockedError(issue);
}

/** Ton kam nachweislich an: Blockade aufheben. */
function confirm(): void {
  pending = null;
  if (status.blocked) report({ blocked: false });
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Spielt die MP3 zu einer Wort-/Satz-ID; ein laufendes Audio wird abgebrochen. Resolved am Ende.
 * Rejected mit AudioBlockedError, wenn iOS den Ton blockiert – nie hängt es ewig.
 */
export async function play(id: string): Promise<void> {
  let c = ctx ?? build();
  if (!c) throw new Error('Kein WebAudio verfügbar');
  if (!isRunning(c)) {
    await Promise.race([c.resume().catch(() => {}), wait(RESUME_LIMIT_MS)]);
    if (!isRunning(c)) throw block(id, `Kontext ${c.state}`);
  }
  const buffer = await load(id);
  // Während des Ladens kann der Kontext ersetzt worden sein (Hintergrund, Geste).
  c = ctx;
  if (!c || !isRunning(c)) throw block(id, 'Kontext weg');
  halt();
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.connect(analyser!);
  current = src;
  const t0 = c.currentTime;
  const audio = c;
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const end = (err?: AudioBlockedError) => {
      if (settled) return;
      settled = true;
      clearTimeout(probe);
      clearTimeout(guard);
      if (current === src) current = null;
      if (err) reject(err);
      else resolve();
    };
    src.onended = () => {
      if (audio.currentTime - t0 > 0.05) confirm();
      end();
    };
    // Steht die Audio-Uhr, ist der Kontext stumm, obwohl er „running“ meldet.
    const probe = setTimeout(() => {
      if (audio.currentTime - t0 > CLOCK_PROBE_MS / 4000) return confirm();
      try {
        src.stop();
      } catch {
        /* schon beendet */
      }
      end(block(id, 'Audio-Uhr steht'));
    }, CLOCK_PROBE_MS);
    // onended bleibt bei gestörtem Kontext manchmal aus – nie ewig warten.
    const guard = setTimeout(() => end(), buffer.duration * 1000 + 2000);
    src.start();
  });
}

/** Spielt das zuletzt blockierte Audio nach – aus einer Geste aufrufen (Hinweis „Ton hängt“). */
export async function retry(): Promise<void> {
  const id = pending;
  if (id) return play(id).catch(() => {});
  report({ blocked: false });
}

/** Bricht das laufende Audio ab, ohne Vorgemerktes zu verwerfen. */
function halt(): void {
  const src = current;
  current = null;
  try {
    src?.stop(); // löst onended aus → das zugehörige play() resolved
  } catch {
    /* schon beendet */
  }
}

/** Bricht das laufende Audio ab (z. B. beim Aufgabenwechsel); nichts wird nachgespielt. */
export function stop(): void {
  pending = null;
  halt();
}

/** Aktueller Pegel 0..1 (RMS) für die Klangscheibe; 0, solange nichts spielt. */
const samples = new Uint8Array(512);
export function level(): number {
  if (!analyser || !current) return 0;
  analyser.getByteTimeDomainData(samples);
  let sum = 0;
  for (let i = 0; i < analyser.fftSize; i++) {
    const v = (samples[i]! - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / analyser.fftSize) * 3);
}
