import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logNewWord, logRound, logShields, logTask, syncDay } from '../src/lib/logic/diary';
import { addXp, XP_PER_CORRECT } from '../src/lib/logic/rewards';
import { emptyDay, newSave, normalizeSave } from '../src/lib/storage/state';

const DAY = '2026-11-07';

describe('Tagebuch (reine Logik)', () => {
  it('zählt Aufgaben, richtige, neue Wörter und Runden je Tag; XP und Tagesziel kommen aus „today“', () => {
    const save = newSave(new Date(`${DAY}T09:00:00`));
    logNewWord(save, DAY);
    logTask(save, DAY, true);
    logTask(save, DAY, false);
    expect(save.days[DAY]).toEqual({ ...emptyDay(), tasks: 2, right: 1, newWords: 1 });
    addXp(save, save.dailyGoal, DAY);
    logRound(save, DAY);
    expect(save.days[DAY]).toMatchObject({ rounds: 1, xp: save.dailyGoal, goal: true });
    // Ein späterer Tag bekommt seinen eigenen Eintrag; der alte bleibt.
    logTask(save, '2026-11-08', true);
    expect(save.days['2026-11-08']).toMatchObject({ tasks: 1, right: 1, xp: 0, goal: false });
    expect(save.days[DAY]!.tasks).toBe(2);
  });

  it('markiert die vom Streak-Schutz überbrückten Tage', () => {
    const save = newSave();
    logShields(save, '2026-11-04', 2);
    expect(Object.keys(save.days)).toEqual(['2026-11-05', '2026-11-06']);
    expect(save.days['2026-11-05']).toEqual({ ...emptyDay(), shield: true });
  });

  it('syncDay legt nur für den Tag selbst an und übernimmt XP nur vom gleichen Tag', () => {
    const save = newSave(new Date(`${DAY}T09:00:00`));
    addXp(save, 30, DAY);
    syncDay(save, '2026-11-06');
    expect(save.days['2026-11-06']).toEqual(emptyDay());
    syncDay(save, DAY);
    expect(save.days[DAY]!.xp).toBe(30);
  });

  it('alte Spielstände ohne Tagebuch bleiben gültig; Einträge werden ergänzt, Unbrauchbares fällt weg', () => {
    const old = JSON.parse(JSON.stringify(newSave())) as Record<string, unknown>;
    delete old.days;
    expect(normalizeSave(old).days).toEqual({});
    const later = { ...old, days: { [DAY]: { xp: 40, tasks: 4 }, kaputt: { xp: 1 }, '2026-11-08': 5 } };
    expect(normalizeSave(later).days).toEqual({ [DAY]: { ...emptyDay(), xp: 40, tasks: 4 } });
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

describe('Tagebuch im Spiel', () => {
  it('bucht eine Runde mit neuem Wort, richtigen und falschen Aufgaben; bloßes Öffnen legt keinen Tag an', async () => {
    const g = await freshGame(`${DAY}T10:00:00`);
    expect(g.game.save.days).toEqual({});
    g.recordSeen('w001');
    g.recordSeen('w001');
    const goal = g.game.save.dailyGoal / XP_PER_CORRECT;
    for (let i = 0; i < goal; i++) g.recordTask({ mode: 'vn2de', correct: true, units: [{ key: 'w001', correct: true }] });
    g.recordTask({ mode: 'listen', correct: false, units: [{ key: 'w001', correct: false }] });
    g.recordRoundEnd();
    const day = g.game.save.days[DAY]!;
    expect(day).toMatchObject({ newWords: 1, tasks: goal + 1, right: goal, rounds: 1, goal: true, shield: false });
    expect(day.xp).toBe(g.game.save.today.xp);
    expect(day.xp).toBeGreaterThanOrEqual(g.game.save.dailyGoal);
    await g.flushed();

    // Neustart am nächsten Tag: der alte Tag ist gespeichert, der neue entsteht erst mit Aktivität.
    const next = await freshGame('2026-11-08T09:00:00');
    expect(Object.keys(next.game.save.days)).toEqual([DAY]);
    expect(next.game.save.days[DAY]).toEqual(day);
    next.recordBossWin('e01', 3, 3);
    expect(next.game.save.days['2026-11-08']).toMatchObject({ rounds: 1, tasks: 0 });
  });

  it('verbrauchter Streak-Schutz steht im Tagebuch', async () => {
    const g = await freshGame(`${DAY}T10:00:00`);
    const goal = g.game.save.dailyGoal / XP_PER_CORRECT;
    for (let i = 0; i < goal; i++) g.recordTask({ mode: 'vn2de', correct: true, units: [{ key: 'w001', correct: true }] });
    g.game.save.streak.shields = 2;
    // Direkt gesetzte Werte speichert erst die nächste Aktion; ein Favorit genügt.
    g.toggleFavorite('w001');
    await g.flushed();
    // Zwei Tage verpasst (8. und 9.), am 10. wieder da.
    const later = await freshGame('2026-11-10T08:00:00');
    expect(later.takeNews()).toContainEqual({ kind: 'shield', days: 2 });
    expect(later.game.save.days['2026-11-08']).toMatchObject({ shield: true, tasks: 0 });
    expect(later.game.save.days['2026-11-09']).toMatchObject({ shield: true });
    expect(later.game.save.days['2026-11-10']).toBeUndefined();
  });
});
