import { describe, expect, it } from 'vitest';
import { addXp, currentStreak, goalReached, levelInfo, levelStart, rollDay } from '../src/lib/logic/rewards';
import { newSave } from '../src/lib/storage/state';

/** Lokales Datum (Konstruktor ohne Zeitzone), damit newSave() das Tagesdatum sicher trifft. */
const newSaveOn = (day: string) => newSave(new Date(`${day}T08:00:00`));

describe('levelInfo', () => {
  it('nutzt die Schwellen 0/100/250/…/2700 für Level 1–10', () => {
    const thresholds = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
    thresholds.forEach((xp, i) => {
      expect(levelInfo(xp).level).toBe(i + 1);
      expect(levelStart(i + 1)).toBe(xp);
    });
  });

  it('liegt kurz vor einer Schwelle noch im alten Level', () => {
    expect(levelInfo(99)).toMatchObject({ level: 1, into: 99, span: 100 });
    expect(levelInfo(249)).toMatchObject({ level: 2, into: 149, span: 150 });
    expect(levelInfo(2699)).toMatchObject({ level: 9, into: 499, span: 500 });
  });

  it('ab Level 10 gilt +600 je Level', () => {
    expect(levelInfo(2700)).toMatchObject({ level: 10, into: 0, span: 600 });
    expect(levelInfo(3299)).toMatchObject({ level: 10, into: 599, span: 600 });
    expect(levelInfo(3300)).toMatchObject({ level: 11, into: 0, span: 600 });
    expect(levelInfo(3900)).toMatchObject({ level: 12, into: 0, span: 600 });
  });

  it('progress liegt immer zwischen 0 und 1', () => {
    for (let xp = 0; xp <= 6000; xp += 7) {
      const { progress } = levelInfo(xp);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThan(1);
    }
    expect(levelInfo(175).progress).toBeCloseTo(0.5);
  });
});

describe('addXp', () => {
  it('bucht Gesamt- und Tages-XP', () => {
    const save = newSaveOn('2026-11-03');
    const res = addXp(save, 10, '2026-11-03');
    expect(save.xp).toBe(10);
    expect(save.today).toEqual({ date: '2026-11-03', xp: 10 });
    expect(res).toEqual({ levelUp: null, goalJustReached: false });
  });

  it('meldet Level-Aufstieg nur beim Überschreiten der Schwelle', () => {
    const save = newSaveOn('2026-11-03');
    save.xp = 95;
    expect(addXp(save, 4, '2026-11-03').levelUp).toBeNull();
    expect(addXp(save, 1, '2026-11-03').levelUp).toBe(2);
    expect(addXp(save, 10, '2026-11-03').levelUp).toBeNull();
  });

  it('setzt die Tages-XP am Tageswechsel auf 0, bevor gebucht wird', () => {
    const save = newSaveOn('2026-11-03');
    save.xp = 40;
    save.today = { date: '2026-11-02', xp: 40 };
    addXp(save, 10, '2026-11-03');
    expect(save.xp).toBe(50);
    expect(save.today).toEqual({ date: '2026-11-03', xp: 10 });
  });

  it('rollDay lässt den Tag stehen, wenn das Datum gleich ist', () => {
    const save = newSaveOn('2026-11-03');
    save.today = { date: '2026-11-03', xp: 30 };
    rollDay(save, '2026-11-03');
    expect(save.today).toEqual({ date: '2026-11-03', xp: 30 });
    rollDay(save, '2026-11-04');
    expect(save.today).toEqual({ date: '2026-11-04', xp: 0 });
  });

  it('meldet goalJustReached genau einmal beim Überschreiten des Tagesziels (50)', () => {
    const save = newSaveOn('2026-11-03');
    save.today = { date: '2026-11-03', xp: 40 };
    expect(addXp(save, 5, '2026-11-03').goalJustReached).toBe(false);
    expect(addXp(save, 5, '2026-11-03').goalJustReached).toBe(true);
    expect(addXp(save, 10, '2026-11-03').goalJustReached).toBe(false);
  });

  it('setzt die Serie auf 1 beim ersten Erreichen ohne Vortag', () => {
    const save = newSaveOn('2026-11-03');
    save.today = { date: '2026-11-03', xp: 45 };
    addXp(save, 5, '2026-11-03');
    expect(save.streak.count).toBe(1);
    expect(save.streak.lastDate).toBe('2026-11-03');
  });

  it('erhöht die Serie um 1, wenn gestern das Tagesziel erreicht wurde', () => {
    const save = newSaveOn('2026-11-03');
    save.streak = { count: 4, lastDate: '2026-11-02', shields: 0 };
    save.today = { date: '2026-11-03', xp: 45 };
    addXp(save, 5, '2026-11-03');
    expect(save.streak.count).toBe(5);
    expect(save.streak.lastDate).toBe('2026-11-03');
  });

  it('startet die Serie neu nach einem verpassten Tag', () => {
    const save = newSaveOn('2026-11-03');
    save.streak = { count: 4, lastDate: '2026-11-01', shields: 0 };
    save.today = { date: '2026-11-03', xp: 45 };
    addXp(save, 5, '2026-11-03');
    expect(save.streak.count).toBe(1);
  });

  it('zählt die Serie an einem Tag nur einmal', () => {
    const save = newSaveOn('2026-11-03');
    save.streak = { count: 4, lastDate: '2026-11-02', shields: 0 };
    save.today = { date: '2026-11-03', xp: 45 };
    addXp(save, 5, '2026-11-03');
    addXp(save, 30, '2026-11-03');
    expect(save.streak.count).toBe(5);
  });
});

describe('currentStreak und goalReached', () => {
  it('gilt, wenn zuletzt heute oder gestern erreicht wurde', () => {
    const save = newSaveOn('2026-11-03');
    save.streak = { count: 7, lastDate: '2026-11-03', shields: 0 };
    expect(currentStreak(save, '2026-11-03')).toBe(7);
    save.streak.lastDate = '2026-11-02';
    expect(currentStreak(save, '2026-11-03')).toBe(7);
  });

  it('gibt 0, wenn lastDate älter als gestern ist', () => {
    const save = newSaveOn('2026-11-03');
    save.streak = { count: 7, lastDate: '2026-11-01', shields: 0 };
    expect(currentStreak(save, '2026-11-03')).toBe(0);
    save.streak.lastDate = null;
    expect(currentStreak(save, '2026-11-03')).toBe(0);
  });

  it('rechnet „gestern“ über Monatsgrenze und Sommerzeit-Umstellung', () => {
    const save = newSaveOn('2026-12-01');
    save.streak = { count: 3, lastDate: '2026-11-30', shields: 0 };
    expect(currentStreak(save, '2026-12-01')).toBe(3);
    save.streak = { count: 3, lastDate: '2026-03-28', shields: 0 };
    expect(currentStreak(save, '2026-03-29')).toBe(3);
  });

  it('goalReached: nur am heutigen Tag mit erreichter Tages-XP', () => {
    const save = newSaveOn('2026-11-03');
    save.today = { date: '2026-11-03', xp: 50 };
    expect(goalReached(save, '2026-11-03')).toBe(true);
    save.today = { date: '2026-11-03', xp: 49 };
    expect(goalReached(save, '2026-11-03')).toBe(false);
    save.today = { date: '2026-11-02', xp: 60 };
    expect(goalReached(save, '2026-11-03')).toBe(false);
  });
});
