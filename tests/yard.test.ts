import { describe, expect, it } from 'vitest';
import { canFeed, feed, fedToday } from '../src/lib/logic/yard';
import { newSave, normalizeSave } from '../src/lib/storage/state';

/** Trâus Hof: Gras einmal am Tag, sobald das Tagesziel erreicht ist. */
describe('Trâus Hof: füttern', () => {
  const DAY = '2026-11-06';
  const withXp = (xp: number) => {
    const save = newSave(new Date('2026-11-06T10:00:00'));
    save.today = { date: DAY, xp };
    return save;
  };

  it('gibt erst nach erreichtem Tagesziel Gras', () => {
    const save = withXp(save0Goal() - 1);
    expect(canFeed(save, DAY)).toBe(false);
    expect(feed(save, DAY)).toBe(false);
    expect(save.yard).toEqual({ fedOn: null, fed: 0 });
  });

  it('füttert einmal am Tag und zählt mit', () => {
    const save = withXp(save0Goal());
    expect(canFeed(save, DAY)).toBe(true);
    expect(feed(save, DAY)).toBe(true);
    expect(fedToday(save, DAY)).toBe(true);
    expect(save.yard).toEqual({ fedOn: DAY, fed: 1 });
    // Ein zweites Mal am selben Tag nicht
    expect(canFeed(save, DAY)).toBe(false);
    expect(feed(save, DAY)).toBe(false);
    expect(save.yard.fed).toBe(1);
  });

  it('gibt am nächsten Tag wieder Gras, sobald das neue Tagesziel erreicht ist', () => {
    const save = withXp(save0Goal());
    feed(save, DAY);
    const next = '2026-11-07';
    save.today = { date: next, xp: 0 };
    expect(canFeed(save, next)).toBe(false);
    save.today = { date: next, xp: save.dailyGoal };
    expect(canFeed(save, next)).toBe(true);
    expect(feed(save, next)).toBe(true);
    expect(save.yard).toEqual({ fedOn: next, fed: 2 });
  });

  it('ergänzt den Hof in alten Spielständen', () => {
    const old = JSON.parse(JSON.stringify(newSave())) as Record<string, unknown>;
    delete old.yard;
    expect(normalizeSave(old).yard).toEqual({ fedOn: null, fed: 0 });
  });
});

function save0Goal(): number {
  return newSave().dailyGoal;
}
