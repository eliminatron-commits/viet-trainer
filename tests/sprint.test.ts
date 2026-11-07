import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { content } from '../src/content';
import { answerOf } from '../src/lib/logic/session';
import {
  formatTime,
  raceTime,
  recordRun,
  SPRINT_MIN_WORDS,
  SPRINT_PENALTY,
  sprintReady,
  sprintTasks,
  sprintWords,
  weekBest,
} from '../src/lib/logic/sprint';
import { newSave, normalizeSave, type ItemProgress, type SaveState } from '../src/lib/storage/state';

/** Deterministischer Zufall (Mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Spielstand mit `n` gelernten echten Wörtern, dazu ein gelernter Partikel und ein gelernter Satz. */
function learned(n: number): SaveState {
  const save = newSave(new Date('2026-11-07T10:00:00'));
  const p: ItemProgress = { box: 2, due: '2026-11-20', seen: 2, right: 1, wrong: 0 };
  for (const w of content.words.filter((x) => x.kind === 'word').slice(0, n)) save.items[w.id] = { ...p };
  save.items[content.words.find((x) => x.kind === 'particle')!.id] = { ...p };
  save.items[content.sentences[0]!.id] = { ...p };
  return save;
}

describe('Roller-Sprint: Zeiten', () => {
  it('Anzeige in Sekunden mit Zehnteln (abgerundet), ab einer Minute mit Minuten', () => {
    expect(formatTime(0)).toBe('0,0 s');
    expect(formatTime(42_399)).toBe('42,3 s');
    expect(formatTime(59_999)).toBe('59,9 s');
    expect(formatTime(62_400)).toBe('1:02,4');
    expect(formatTime(-5)).toBe('0,0 s');
  });

  it('Fahrzeit = Antwortzeit + Strafzeit je Fehler', () => {
    expect(raceTime(40_000.4, 0)).toBe(40_000);
    expect(raceTime(40_000, 2)).toBe(40_000 + 2 * SPRINT_PENALTY);
  });

  it('Bestzeit gesamt und je Woche (ab Montag)', () => {
    const rec = newSave().sprint;
    expect(recordRun(rec, 50_000, '2026-11-04')).toEqual({ first: true, best: true, week: true });
    expect(recordRun(rec, 55_000, '2026-11-06')).toEqual({ first: false, best: false, week: false });
    expect(recordRun(rec, 45_000, '2026-11-08')).toEqual({ first: false, best: true, week: true });
    expect(rec).toEqual({ best: 45_000, week: '2026-11-02', weekBest: 45_000, runs: 3 });
    // neue Woche (Montag, 9.): langsamer als die Bestzeit, aber die erste der Woche
    expect(weekBest(rec, '2026-11-09')).toBeNull();
    expect(recordRun(rec, 48_000, '2026-11-09')).toEqual({ first: false, best: false, week: true });
    expect(rec).toMatchObject({ best: 45_000, week: '2026-11-09', weekBest: 48_000, runs: 4 });
    expect(weekBest(rec, '2026-11-15')).toBe(48_000);
  });
});

describe('Roller-Sprint: Aufgaben', () => {
  it('erst ab SPRINT_MIN_WORDS gelernten echten Wörtern; Partikel und Sätze zählen nicht', () => {
    expect(sprintReady(learned(SPRINT_MIN_WORDS - 1))).toBe(false);
    expect(sprintReady(learned(SPRINT_MIN_WORDS))).toBe(true);
    expect(sprintWords(learned(5)).every((w) => w.kind === 'word')).toBe(true);
    expect(sprintTasks(newSave(), 10)).toEqual([]);
  });

  it('nur schnelle Wort-Aufgaben aus Gelerntem, nie dasselbe Wort direkt hintereinander – auch über Durchgänge hinweg', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const save = learned(SPRINT_MIN_WORDS);
      const ids = new Set(sprintWords(save).map((w) => w.id));
      const tasks = sprintTasks(save, 40, rng(seed));
      expect(tasks).toHaveLength(40);
      const modes = new Set<string>();
      tasks.forEach((t, i) => {
        expect(t.kind, `seed ${seed} #${i}`).toBe('choice');
        if (t.kind !== 'choice') return;
        modes.add(t.mode);
        expect(['vn2de', 'de2vn']).toContain(t.mode);
        expect(ids.has(t.key as never), t.key).toBe(true);
        expect(t.options).toHaveLength(4);
        expect(t.options.filter((o) => o.id === answerOf(t))).toHaveLength(1);
        if (i > 0) expect(t.key, `seed ${seed} #${i}`).not.toBe(tasks[i - 1]!.key);
      });
      expect(modes).toEqual(new Set(['vn2de', 'de2vn']));
      // Nachschub: beginnt nicht mit dem zuletzt gefahrenen Wort
      const last = tasks.at(-1)!.key;
      for (const s of [6, 7, 8, 9]) expect(sprintTasks(save, 5, rng(s), last as never)[0]!.key).not.toBe(last);
    }
  });
});

describe('Roller-Sprint im Spielstand', () => {
  it('alte Stände bekommen einen leeren Rekord; unbrauchbare Werte fallen weg', () => {
    const old = JSON.parse(JSON.stringify(newSave())) as Record<string, unknown>;
    delete old.sprint;
    expect(normalizeSave(old).sprint).toEqual({ best: null, week: null, weekBest: null, runs: 0 });
    const bad = { ...old, sprint: { best: -3, week: 'kaputt', weekBest: 40_000, runs: 2.7 } };
    expect(normalizeSave(bad).sprint).toEqual({ best: null, week: null, weekBest: null, runs: 2 });
    const good = { ...old, sprint: { best: 41_200, week: '2026-11-02', weekBest: 43_000, runs: 5 } };
    expect(normalizeSave(good).sprint).toEqual({ best: 41_200, week: '2026-11-02', weekBest: 43_000, runs: 5 });
  });
});

/** Mit den echten Spielaktionen und der Speicherschicht (fake-indexeddb). */
async function freshGame(now: string) {
  vi.setSystemTime(new Date(now));
  vi.resetModules();
  const g = await import('../src/lib/game.svelte');
  await g.initGame();
  return g;
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  globalThis.indexedDB = new IDBFactory();
});
afterEach(() => vi.useRealTimers());

describe('Roller-Sprint im Spiel', () => {
  it('Zeit eintragen zählt als Runde (auch im Tagebuch) und übersteht einen Neustart', async () => {
    const g = await freshGame('2026-11-07T10:00:00');
    g.recordTask({ mode: 'vn2de', correct: true, units: [{ key: 'w001', correct: true }] });
    expect(g.recordSprint(52_300)).toMatchObject({ first: true, best: true, week: true });
    expect(g.recordSprint(49_900)).toMatchObject({ first: false, best: true, week: true });
    expect(g.recordSprint(60_000)).toMatchObject({ first: false, best: false, week: false });
    expect(g.game.save.stats.rounds).toBe(3);
    expect(g.game.save.days['2026-11-07']).toMatchObject({ rounds: 3 });
    await g.flushed();
    const next = await freshGame('2026-11-10T09:00:00');
    expect(next.game.save.sprint).toMatchObject({ best: 49_900, week: '2026-11-02', weekBest: 49_900, runs: 3 });
    // neue Woche: erste Fahrt der Woche ist Wochenbestzeit, auch wenn sie langsamer ist
    expect(next.recordSprint(55_000)).toMatchObject({ best: false, week: true });
  });
});
