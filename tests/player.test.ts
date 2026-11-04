import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AudioStatus } from '../src/lib/audio/player';

/**
 * Nachbau eines iOS-AudioContexts mit den Störungen, die auf Alex' iPhone den Ton gekostet haben:
 * „interrupted“ nach Sperre/Anruf, resume() hängt, „running“ mit stehender Uhr, ausbleibendes onended.
 */
class FakeContext {
  static all: FakeContext[] = [];
  state = 'suspended';
  onstatechange: (() => void) | null = null;
  destination = {};
  /** Hörbar gestartete Lerninhalte (nicht der stille Weck-Puffer). */
  heard = 0;
  /** Uhr steht, obwohl der Kontext „running“ meldet. */
  frozen = false;
  /** resume() kommt nie zurück. */
  resumeHangs = false;
  /** Quellen melden nie onended. */
  silentEnd = false;
  private base = 0;
  private since: number | null = null;

  constructor() {
    FakeContext.all.push(this);
  }
  get currentTime() {
    return this.base + (this.since === null ? 0 : (performance.now() - this.since) / 1000);
  }
  get ticking() {
    return this.state === 'running' && !this.frozen;
  }
  setState(state: string) {
    this.base = this.currentTime;
    this.state = state;
    this.since = this.ticking ? performance.now() : null;
    this.onstatechange?.();
  }
  freeze() {
    this.base = this.currentTime;
    this.since = null;
    this.frozen = true;
  }
  resume() {
    if (this.resumeHangs) return new Promise<void>(() => {});
    return Promise.resolve().then(() => {
      if (this.state !== 'closed' && this.state !== 'running') this.setState('running');
    });
  }
  close() {
    this.setState('closed');
    return Promise.resolve();
  }
  createAnalyser() {
    return { fftSize: 512, smoothingTimeConstant: 0, connect() {}, getByteTimeDomainData() {} };
  }
  createBuffer() {
    return { duration: 0 };
  }
  createBufferSource() {
    return new FakeSource(this);
  }
  decodeAudioData() {
    return Promise.resolve({ duration: 1 });
  }
}

class FakeSource {
  buffer: { duration: number } | null = null;
  onended: (() => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private started = false;
  constructor(private ctx: FakeContext) {}
  connect() {}
  start() {
    this.started = true;
    const duration = this.buffer?.duration ?? 0;
    if (!this.ctx.ticking) return; // stummer Kontext: nichts zu hören, kein Ende
    if (duration > 0) this.ctx.heard++;
    if (!this.ctx.silentEnd) this.timer = setTimeout(() => this.onended?.(), duration * 1000);
  }
  stop() {
    clearTimeout(this.timer);
    if (this.started) queueMicrotask(() => this.onended?.());
  }
}

type Player = typeof import('../src/lib/audio/player');

let win: EventTarget;
let doc: EventTarget & { visibilityState: string };
let session: EventTarget & { type: string; state: string };

/** Ein Fingertipp auf iOS: pointerdown, touchend, click – synchron hintereinander. */
const tap = () => {
  for (const type of ['pointerdown', 'touchend', 'click']) win.dispatchEvent(new Event(type));
};
const setVisible = (visible: boolean) => {
  doc.visibilityState = visible ? 'visible' : 'hidden';
  doc.dispatchEvent(new Event('visibilitychange'));
};
const flush = () => vi.advanceTimersByTimeAsync(0);
const ctxs = () => FakeContext.all;

async function setup(): Promise<Player> {
  const player = await import('../src/lib/audio/player');
  player.installAudioUnlock();
  return player;
}

function statusOf(player: Player): AudioStatus {
  let s!: AudioStatus;
  player.onAudioStatus((x) => (s = x))();
  return s;
}

/** Spielt ein Wort bis zum Ende ab. */
async function playThrough(player: Player, id = 'w062') {
  const done = player.play(id);
  await vi.advanceTimersByTimeAsync(1100);
  await done;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] });
  FakeContext.all = [];
  win = new EventTarget();
  doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  session = Object.assign(new EventTarget(), { type: 'auto', state: 'active' });
  vi.stubGlobal('AudioContext', FakeContext);
  vi.stubGlobal('addEventListener', win.addEventListener.bind(win));
  vi.stubGlobal('document', doc);
  vi.stubGlobal('navigator', { audioSession: session });
  vi.stubGlobal('fetch', async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
  vi.resetModules();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Audio-Player – iOS-Selbstheilung', () => {
  it('weckt den Kontext beim ersten Tippen, setzt die Audio-Session auf playback und spielt ab', async () => {
    const player = await setup();
    tap();
    expect(ctxs()).toHaveLength(1);
    expect(session.type).toBe('playback'); // sonst schaltet der Stummschalter die Lerninhalte ab
    await playThrough(player);
    expect(ctxs()[0]!.heard).toBe(1);
    expect(statusOf(player)).toMatchObject({ blocked: false, state: 'running', rebuilds: 0 });
  });

  it('baut nach einer Rückkehr aus dem Hintergrund einen frischen Kontext', async () => {
    const player = await setup();
    tap();
    await playThrough(player);
    setVisible(false);
    expect(ctxs()[0]!.state).toBe('closed');
    setVisible(true);
    tap();
    expect(ctxs()).toHaveLength(2);
    await playThrough(player);
    expect(ctxs()[1]!.heard).toBe(1);
  });

  it('ersetzt einen von selbst unterbrochenen Kontext („interrupted“, resume hängt) bei der nächsten Geste', async () => {
    const player = await setup();
    tap();
    await flush();
    const old = ctxs()[0]!;
    old.resumeHangs = true;
    old.setState('interrupted'); // Anruf, Siri, Sperre
    tap();
    expect(old.state).toBe('closed');
    await playThrough(player);
    expect(ctxs()[1]!.heard).toBe(1);
    expect(statusOf(player).rebuilds).toBe(1);
    expect(statusOf(player).issue).toContain('interrupted');
  });

  it('wartet ohne Geste nie ewig auf resume(): meldet die Blockade, ein Tippen spielt nach', async () => {
    const player = await setup();
    tap();
    await flush();
    const old = ctxs()[0]!;
    old.resumeHangs = true;
    old.setState('interrupted');

    // Hör-Aufgabe startet Audio automatisch, ohne Geste
    const failed = player.play('w062').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(700);
    expect(await failed).toBeInstanceOf(player.AudioBlockedError);
    expect(statusOf(player).blocked).toBe(true);

    // Tippen auf den Hinweis: die Geste baut neu, retry() spielt das verpasste Audio
    tap();
    const again = player.retry();
    await vi.advanceTimersByTimeAsync(1100);
    await again;
    expect(ctxs()[1]!.heard).toBe(1);
    expect(statusOf(player).blocked).toBe(false);
  });

  it('erkennt einen stummen Kontext („running“, Uhr steht) beim Abspielen und repariert ihn beim nächsten Tippen', async () => {
    const player = await setup();
    tap();
    await flush();
    ctxs()[0]!.freeze();

    const failed = player.play('w062').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(350);
    expect(await failed).toBeInstanceOf(player.AudioBlockedError);
    expect(statusOf(player)).toMatchObject({ blocked: true });
    expect(statusOf(player).issue).toContain('Audio-Uhr steht');

    tap();
    expect(ctxs()).toHaveLength(2);
    const again = player.retry();
    await vi.advanceTimersByTimeAsync(1100);
    await again;
    expect(ctxs()[1]!.heard).toBe(1);
    expect(statusOf(player).blocked).toBe(false);
  });

  it('erkennt eine stehende Audio-Uhr schon beim Tippen – eine laufende bleibt unangetastet', async () => {
    const player = await setup();
    tap();
    await flush();
    tap(); // Stichprobe der Uhr
    await vi.advanceTimersByTimeAsync(5000);
    tap();
    expect(ctxs()).toHaveLength(1); // Uhr lief mit: kein Neubau

    ctxs()[0]!.freeze();
    await vi.advanceTimersByTimeAsync(5000);
    tap();
    expect(ctxs()).toHaveLength(2);
    expect(statusOf(player).issue).toContain('Audio-Uhr stand');
  });

  it('baut nach einer Unterbrechung der Audio-Session (Anruf) neu', async () => {
    const player = await setup();
    tap();
    await flush();
    session.state = 'interrupted';
    session.dispatchEvent(new Event('statechange'));
    session.state = 'active';
    tap();
    expect(ctxs()).toHaveLength(2);
    await playThrough(player);
    expect(ctxs()[1]!.heard).toBe(1);
  });

  it('hängt nicht, wenn onended ausbleibt', async () => {
    const player = await setup();
    tap();
    await flush();
    ctxs()[0]!.silentEnd = true;
    const done = player.play('w062');
    await vi.advanceTimersByTimeAsync(3100);
    await expect(done).resolves.toBeUndefined();
    expect(statusOf(player).blocked).toBe(false);
  });

  it('stop() verwirft vorgemerktes Audio, damit beim Aufgabenwechsel nichts Altes nachspielt', async () => {
    const player = await setup();
    tap();
    await flush();
    ctxs()[0]!.freeze();
    const failed = player.play('w062').catch(() => {});
    await vi.advanceTimersByTimeAsync(350);
    await failed;
    player.stop();
    tap();
    await player.retry();
    await vi.advanceTimersByTimeAsync(1100);
    expect(ctxs()[1]!.heard).toBe(0);
    expect(statusOf(player).blocked).toBe(false);
  });

  it('bleibt ohne WebAudio bedienbar', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const player = await setup();
    expect(tap).not.toThrow();
    await expect(player.play('w062')).rejects.toThrow('Kein WebAudio');
  });
});
