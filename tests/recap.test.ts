import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { challengesFor, rollWeek } from '../src/lib/logic/challenges';
import { recapDue, weekActive, weekRecap, weekTitle } from '../src/lib/logic/recap';
import { XP_PER_CORRECT } from '../src/lib/logic/rewards';
import { emptyDay, newSave, normalizeSave, type DayLog } from '../src/lib/storage/state';

const MON = '2026-11-02';
const NEXT = '2026-11-09';
const log = (patch: Partial<DayLog>): DayLog => ({ ...emptyDay(), ...patch });

describe('Wochentitel', () => {
  it('im Monat, über den Monatswechsel und über den Jahreswechsel', () => {
    expect(weekTitle('2026-11-02')).toBe('2.–8. November');
    expect(weekTitle('2026-10-26')).toBe('26. Oktober – 1. November');
    expect(weekTitle('2026-12-28')).toBe('28. Dezember 2026 – 3. Januar 2027');
  });
});

describe('Rückblick einer Woche', () => {
  it('Laternen, Lerntage und Summen aus dem Tagebuch; Tage außerhalb der Woche zählen nicht', () => {
    const save = newSave(new Date('2026-10-20T10:00:00Z'));
    save.days = {
      '2026-11-01': log({ xp: 500, tasks: 99, right: 99 }), // Sonntag davor
      '2026-11-07': log({ xp: 90, tasks: 22, right: 19, newWords: 8, rounds: 3, goal: true }),
      '2026-11-08': log({ xp: 25, tasks: 6, right: 5, newWords: 2, rounds: 1 }),
      '2026-11-05': log({ shield: true }),
      '2026-11-09': log({ xp: 40, tasks: 9, right: 9 }), // Montag danach
    };
    const r = weekRecap(save, MON, NEXT);
    expect(r.title).toBe('2.–8. November');
    expect(r.current).toBe(false);
    expect(r.days.map((d) => d.weekday)).toEqual(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
    expect(r.days.map((d) => d.day)).toEqual([2, 3, 4, 5, 6, 7, 8]);
    // Spielstand vom Oktober: vor dem 7. November zählt das Tagebuch noch nicht
    expect(r.days.map((d) => d.lantern)).toEqual(['before', 'before', 'before', 'shield', 'before', 'goal', 'learned']);
    expect(r).toMatchObject({ learned: 2, goals: 1, shields: 1, xp: 115, newWords: 10, tasks: 28, right: 24, rounds: 4, share: 86 });
  });

  it('laufende Woche: nur bis heute, Zukunft als Laterne „noch nicht da“', () => {
    const save = newSave(new Date('2026-11-01T10:00:00Z'));
    // Der Eintrag vom 6. stammt von einer vorgestellten Uhr: liegt in der Zukunft und zählt nicht.
    save.days = { '2026-11-03': log({ xp: 20, tasks: 4, right: 2 }), '2026-11-06': log({ xp: 70, tasks: 9, right: 9 }) };
    const r = weekRecap(save, MON, '2026-11-04');
    expect(r.current).toBe(true);
    expect(r.days.map((d) => d.lantern)).toEqual(['before', 'learned', 'before', 'future', 'future', 'future', 'future']);
    expect(r.days.find((d) => d.today)?.date).toBe('2026-11-04');
    expect(r).toMatchObject({ learned: 1, xp: 20, tasks: 4, share: 50 });
    expect(weekRecap(newSave(), MON, '2026-11-04').share).toBeNull();
  });

  it('Challenges: laufende Woche mit aktuellem Stand, vergangene aus dem Archiv, ohne Archiv nicht festgehalten', () => {
    const save = newSave();
    rollWeek(save, '2026-11-04');
    const picked = challengesFor(MON, save);
    save.stats[picked[0]!.metric] += 3;
    save.challenges.list[1]!.done = true;
    const now = weekRecap(save, MON, '2026-11-04').challenges!;
    expect(now.map((c) => c.id)).toEqual(picked.map((c) => c.id));
    expect(now[0]).toMatchObject({ title: picked[0]!.title, goal: picked[0]!.goal, progress: 3, done: false });
    expect(now[1]!.done).toBe(true);

    expect(weekRecap(save, '2026-10-26', '2026-11-04').challenges).toBeNull();
    save.weeks['2026-10-26'] = { challenges: [{ id: 'runden', progress: 99, done: true }, { id: 'gibtsnicht', progress: 1, done: false }] };
    expect(weekRecap(save, '2026-10-26', '2026-11-04').challenges).toEqual([
      { id: 'runden', title: '8 Runden spielen', goal: 8, progress: 8, done: true },
    ]);
  });
});

describe('Wochenarchiv', () => {
  it('der Wochenwechsel hält Fortschritt und „geschafft“ der alten Woche fest', () => {
    const save = newSave();
    rollWeek(save, '2026-11-04');
    const [a, b, c] = challengesFor(MON, save);
    save.stats[a!.metric] += 2;
    save.stats[b!.metric] += b!.goal + 5;
    save.challenges.list[1]!.done = true;
    rollWeek(save, '2026-11-06'); // gleiche Woche: nichts
    expect(save.weeks).toEqual({});
    rollWeek(save, NEXT);
    expect(save.weeks[MON]).toEqual({
      challenges: [
        { id: a!.id, progress: 2, done: false },
        { id: b!.id, progress: b!.goal, done: true },
        { id: c!.id, progress: 0, done: false },
      ],
    });
    expect(save.challenges.week).toBe(NEXT);
    // Nach einer Pause von Wochen: die zuletzt gespielte Woche unter ihrem eigenen Montag
    rollWeek(save, '2026-12-01');
    expect(Object.keys(save.weeks)).toEqual([MON, NEXT]);
  });

  it('alte Stände bekommen ein leeres Archiv; Unbrauchbares fällt weg', () => {
    const old = JSON.parse(JSON.stringify(newSave())) as Record<string, unknown>;
    delete old.weeks;
    delete old.recap;
    expect(normalizeSave(old)).toMatchObject({ weeks: {}, recap: { seen: null } });
    const messy = {
      ...old,
      weeks: { [MON]: { challenges: [{ id: 'runden', progress: 3.7, done: true }, { progress: 1 }, 'x'] }, kaputt: { challenges: [] }, '2026-11-09': { x: 1 } },
      recap: { seen: 'gestern' },
    };
    expect(normalizeSave(messy)).toMatchObject({
      weeks: { [MON]: { challenges: [{ id: 'runden', progress: 3, done: true }] } },
      recap: { seen: null },
    });
    expect(Object.keys(normalizeSave(messy).weeks)).toEqual([MON]);
  });
});

describe('fällig', () => {
  const active = () => {
    const save = newSave(new Date('2026-11-01T10:00:00Z'));
    save.days = { '2026-11-07': log({ tasks: 3, right: 3, xp: 15 }) };
    return save;
  };
  it('am ersten Tag einer neuen Woche (und an jedem weiteren, bis gezeigt) für die Woche davor', () => {
    const save = active();
    expect(recapDue(save, '2026-11-08')).toBeNull(); // dieselbe Woche
    expect(recapDue(save, NEXT)).toBe(MON);
    expect(recapDue(save, '2026-11-12')).toBe(MON);
    save.recap.seen = MON;
    expect(recapDue(save, NEXT)).toBeNull();
    // Woche darauf: in der Woche vom 9. wurde nicht gelernt – kein Rückblick
    expect(recapDue(save, '2026-11-16')).toBeNull();
  });
  it('nicht für Wochen ohne Lernen (nur Streak-Schutz) und nicht rückwärts', () => {
    const save = newSave();
    save.days = { '2026-11-04': log({ shield: true }) };
    expect(weekActive(save, MON)).toBe(false);
    expect(recapDue(save, NEXT)).toBeNull();
    const later = active();
    later.recap.seen = '2026-11-16'; // Uhr stand einmal vor
    expect(recapDue(later, NEXT)).toBeNull();
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

describe('im Spiel', () => {
  it('Sonntag gelernt, Montag geöffnet: Archiv steht, Rückblick ist fällig, gezeigt kommt er nicht wieder', async () => {
    const g = await freshGame('2026-11-08T18:00:00');
    const goal = g.game.save.dailyGoal / XP_PER_CORRECT;
    for (let i = 0; i < goal; i++) g.recordTask({ mode: 'vn2de', correct: true, units: [{ key: 'w001', correct: true }] });
    g.recordRoundEnd();
    const ids = g.game.save.challenges.list.map((c) => c.id);
    await g.flushed();

    const mon = await freshGame('2026-11-09T08:00:00');
    expect(mon.game.save.weeks[MON]!.challenges.map((c) => c.id)).toEqual(ids);
    expect(mon.game.save.challenges.week).toBe(NEXT);
    expect(recapDue(mon.game.save, NEXT)).toBe(MON);
    const r = weekRecap(mon.game.save, MON, NEXT);
    expect(r).toMatchObject({ learned: 1, goals: 1, tasks: goal, right: goal, rounds: 1 });
    expect(r.challenges).toHaveLength(3);
    mon.markRecapSeen(MON);
    await mon.flushed();

    const again = await freshGame('2026-11-10T08:00:00');
    expect(again.game.save.recap.seen).toBe(MON);
    expect(recapDue(again.game.save, '2026-11-10')).toBeNull();
  });
});
