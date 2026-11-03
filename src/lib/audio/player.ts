import { audioUrl } from '../../content';

/**
 * Audio-Wiedergabe komplett über WebAudio: fetch → decodeAudioData → BufferSource.
 * Gründe: iOS-Unlock über AudioContext.resume() beim ersten Tippen, AnalyserNode
 * für die Glüh-Kugel und keine Range-Requests (Safari-<audio> aus dem SW-Cache ist heikel).
 */
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let current: AudioBufferSourceNode | null = null;
const buffers = new Map<string, Promise<AudioBuffer>>();

/** null, wenn der Browser kein WebAudio kann (dann bleibt die App stumm, aber bedienbar). */
function context(): AudioContext | null {
  if (!ctx) {
    if (typeof AudioContext === 'undefined') return null;
    ctx = new AudioContext();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;
    analyser.connect(ctx.destination);
  }
  return ctx;
}

/** Einmal bei der ersten Nutzergeste aufrufen; spielt einen stillen Puffer, damit iOS den Kontext freigibt. */
export function installAudioUnlock(): void {
  const unlock = () => {
    removeEventListener('pointerdown', unlock, true);
    const c = context();
    if (!c) return;
    void c.resume();
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, 22050);
    src.connect(c.destination);
    src.start(0);
  };
  addEventListener('pointerdown', unlock, true);
}

function load(id: string): Promise<AudioBuffer> {
  let p = buffers.get(id);
  if (!p) {
    p = fetch(audioUrl(id))
      .then((r) => {
        if (!r.ok) throw new Error(`Audio ${id}: HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then((data) => context()!.decodeAudioData(data));
    p.catch(() => buffers.delete(id));
    buffers.set(id, p);
  }
  return p;
}

/** Spielt die MP3 zu einer Wort-/Satz-ID; ein laufendes Audio wird abgebrochen. Resolved am Ende. */
export async function play(id: string): Promise<void> {
  const c = context();
  if (!c) throw new Error('Kein WebAudio verfügbar');
  if (c.state === 'suspended') await c.resume();
  const buffer = await load(id);
  stop();
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.connect(analyser!);
  current = src;
  await new Promise<void>((resolve) => {
    src.onended = () => {
      if (current === src) current = null;
      resolve();
    };
    src.start();
  });
}

export function stop(): void {
  const src = current;
  current = null;
  try {
    src?.stop(); // löst onended aus → das zugehörige play() resolved
  } catch {
    /* schon beendet */
  }
}

/** Aktueller Pegel 0..1 (RMS) für die Glüh-Kugel; 0, solange nichts spielt. */
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
