import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHALLENGE_XP, CHALLENGES, challengeProgress } from '../src/lib/logic/challenges';
import { BOOST_MINUTES, XP_PER_CORRECT } from '../src/lib/logic/rewards';

/** Spielaktionen gegen echte Speicherschicht (fake-indexeddb): vergeben und gespeichert. */

async function freshGame(now = '2026-11-04T10:00:00') {
  vi.setSystemTime(new Date(now));
  vi.resetModules();
  const g = await import('../src/lib/game.svelte');
  await g.initGame();
  return g;
}

/** Lädt den gespeicherten Stand wie nach einem App-Neustart. */
async function reloadSave() {
  vi.resetModules();
  const p = await import('../src/lib/storage/persist');
  return p.loadSave(p.openSaveStore());
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  // Frische Datenbank je Test (offene Verbindungen würden ein Löschen blockieren).
  globalThis.indexedDB = new IDBFactory();
});
afterEach(() => vi.useRealTimers());

describe('Belohnungen im Spiel', () => {
  it('legt beim ersten Boss-Sieg eine Truhe ab; Öffnen bucht den Inhalt und alles übersteht einen Neustart', async () => {
    const g = await freshGame();
    expect(g.recordBossWin('e01', 3, 3)).toBe(true);
    expect(g.recordBossWin('e01', 2, 3)).toBe(false);
    expect(g.game.save.inventory.chests).toBe(1);

    const prize = g.openChest();
    expect(prize?.kind).toBe('accessory');
    expect(g.openChest()).toBeNull();
    const news = g.takeNews().map((n) => n.kind === 'achievement' && n.id);
    expect(news).toEqual(expect.arrayContaining(['erster-boss', 'makellos']));
    await g.flushed();

    const saved = await reloadSave();
    expect(saved.inventory.chests).toBe(0);
    expect(saved.inventory.accessories).toEqual([prize!.kind === 'accessory' && prize!.id]);
    expect(saved.stats).toMatchObject({ bossWins: 2, perfectBosses: 1, chests: 1 });
    expect(saved.achievements['erster-boss']).toBe('2026-11-04');
    expect(saved.stages.e01).toEqual({ done: true, bossBest: 3 });
  });

  it('verdoppelt XP während eines XP-Boosts und nur so lange', async () => {
    const g = await freshGame();
    g.game.save.inventory.xpBoosts = 1;
    expect(g.useBoost()).toBe(true);
    expect(g.useBoost()).toBe(false);
    const task = { mode: 'vn2de' as const, correct: true, units: [{ key: 'w001' as const, correct: true }] };
    expect(g.recordTask(task).xp).toBe(2 * XP_PER_CORRECT);
    vi.setSystemTime(new Date(Date.now() + BOOST_MINUTES * 60_000));
    expect(g.recordTask(task).xp).toBe(XP_PER_CORRECT);
    expect(g.recordTask({ ...task, correct: false }).xp).toBe(0);
  });

  it('bucht erledigte Wochen-Challenges mit XP und meldet sie', async () => {
    const g = await freshGame();
    const first = g.game.save.challenges.list[0]!;
    const c = CHALLENGES.find((x) => x.id === first.id)!;
    const xp = g.game.save.xp;
    g.game.save.stats[c.metric] += c.goal;
    g.recordRoundEnd();
    expect(g.game.save.challenges.list[0]!.done).toBe(true);
    // recordRoundEnd zählt selbst eine Runde – erfüllt das eine weitere Challenge, gibt es dafür ebenso XP.
    const done = g.game.save.challenges.list.filter((s) => s.done).length;
    expect(g.game.save.xp).toBe(xp + done * CHALLENGE_XP);
    expect(g.takeNews().filter((n) => n.kind === 'challenge')).toHaveLength(done);
  });

  it('Challenge-XP zählen fürs Tagesziel (Zähler und Rückgabe)', async () => {
    const g = await freshGame();
    const s = g.game.save;
    // Diese Woche läuft „80 Aufgaben richtig“, eine fehlt noch; dem Tagesziel fehlen 25 XP.
    const goal = CHALLENGES.find((c) => c.id === 'richtig')!.goal;
    s.challenges.list = [{ id: 'richtig', base: 0, done: false }];
    s.stats.correct = goal - 1;
    s.today = { date: '2026-11-04', xp: s.dailyGoal - 25 };
    // Die Aufgabe selbst bringt 10 XP (Ziel noch offen), erst die Challenge-XP schaffen es.
    const out = g.recordTask({ mode: 'vn2de', correct: true, units: [{ key: 'w001', correct: true }] });
    expect(s.challenges.list[0]!.done).toBe(true);
    expect(s.today.xp).toBe(s.dailyGoal - 25 + XP_PER_CORRECT + CHALLENGE_XP);
    expect(out.goalJustReached).toBe(true);
    expect(s.stats.goals).toBe(1);
  });

  it('zählt die erste Aufgabe einer neuen Woche schon für deren Challenges', async () => {
    // Eine Woche, in der „Runden spielen“ dran ist (die Rotation legt fest, welche).
    const { challengesFor, weekOf } = await import('../src/lib/logic/challenges');
    const { addDays } = await import('../src/lib/logic/srs');
    const { newSave } = await import('../src/lib/storage/state');
    let monday = '2026-11-09';
    while (!challengesFor(monday, newSave()).some((c) => c.id === 'runden')) monday = addDays(monday, 7);
    const sunday = addDays(monday, -1);
    const g = await freshGame(`${sunday}T23:59:00`);
    expect(g.game.save.challenges.week).toBe(weekOf(sunday));
    vi.setSystemTime(new Date(`${monday}T00:01:00`));
    g.recordRoundEnd();
    const s = g.game.save;
    expect(s.challenges.week).toBe(monday);
    expect(s.stats.rounds).toBe(1);
    const runden = s.challenges.list.find((x) => x.id === 'runden')!;
    expect(runden.base).toBe(0);
    expect(challengeProgress(s, 'runden')).toBe(1);
  });

  it('rettet die Serie beim Start mit Streak-Schutz', async () => {
    const g = await freshGame('2026-11-01T10:00:00');
    g.game.save.streak = { count: 5, lastDate: '2026-11-01', shields: 2, best: 5 };
    g.recordRoundEnd();
    await g.flushed();

    const later = await freshGame('2026-11-04T09:00:00');
    expect(later.game.save.streak).toMatchObject({ count: 5, lastDate: '2026-11-03', shields: 0 });
    expect(later.takeNews()).toContainEqual({ kind: 'shield', days: 2 });
  });

  it('merkt Favoriten und Prüfurteile dauerhaft', async () => {
    const g = await freshGame();
    g.toggleFavorite('s010');
    g.toggleFavorite('w300');
    g.toggleFavorite('s010');
    g.setReview('w300', { verdict: 'unnatural', note: 'eher anders' });
    g.setReview('w301', { verdict: 'ok', note: '' });
    g.setReview('w301', null);
    await g.flushed();
    const saved = await reloadSave();
    expect(saved.favorites).toEqual(['w300']);
    expect(saved.review).toEqual({ w300: { verdict: 'unnatural', note: 'eher anders' } });
  });
});
