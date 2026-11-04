import { describe, expect, it } from 'vitest';
import { ACCESSORIES } from '../src/lib/logic/accessories';
import { awardChest, openChest, rollChest } from '../src/lib/logic/chest';
import { MAX_SHIELDS } from '../src/lib/logic/rewards';
import { newSave } from '../src/lib/storage/state';

/** Liefert die Zahlen der Reihe nach (für gezielte Ziehungen). */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

describe('Truhen', () => {
  it('gibt es nur für den ersten Sieg über einen Boss', () => {
    const save = newSave();
    expect(awardChest(save, true)).toBe(true);
    expect(awardChest(save, false)).toBe(false);
    expect(save.inventory.chests).toBe(1);
  });

  it('öffnet nur, was im Vorrat ist, und zählt geöffnete Truhen', () => {
    const save = newSave();
    expect(openChest(save, Math.random)).toBeNull();
    save.inventory.chests = 2;
    openChest(save, Math.random);
    expect(save.inventory.chests).toBe(1);
    expect(save.stats.chests).toBe(1);
  });

  it('bucht jede Art von Inhalt in den Spielstand', () => {
    const save = newSave();
    save.inventory.chests = 3;
    expect(openChest(save, seq(0.1, 0))).toEqual({ kind: 'accessory', id: ACCESSORIES[0]!.id });
    expect(save.inventory.accessories).toEqual([ACCESSORIES[0]!.id]);
    expect(openChest(save, seq(0.9, 0.1))).toEqual({ kind: 'shield' });
    expect(save.streak.shields).toBe(1);
    expect(openChest(save, seq(0.9, 0.9))).toEqual({ kind: 'boost' });
    expect(save.inventory.xpBoosts).toBe(1);
  });

  it('zieht nie ein Accessoire doppelt und gibt nach dem letzten nur noch Boost oder Schutz', () => {
    const save = newSave();
    save.inventory.chests = 200;
    for (let i = 0; i < 200; i++) openChest(save, Math.random);
    expect(new Set(save.inventory.accessories).size).toBe(save.inventory.accessories.length);
    expect([...save.inventory.accessories].sort()).toEqual(ACCESSORIES.map((a) => a.id).sort());
    expect(rollChest(save, () => 0).kind).not.toBe('accessory');
  });

  it('garantiert nach einem makellosen Boss ein fehlendes Accessoire', () => {
    const save = newSave();
    save.inventory.accessories = ACCESSORIES.slice(1).map((a) => a.id);
    expect(rollChest(save, () => 0.99, true)).toEqual({ kind: 'accessory', id: ACCESSORIES[0]!.id });
  });

  it('merkt sich makellose Truhen: die Garantie gilt auch beim späteren Öffnen, makellose zuerst', () => {
    const save = newSave();
    awardChest(save, true, false);
    awardChest(save, true, true);
    expect(save.inventory).toMatchObject({ chests: 2, perfectChests: 1 });
    // Zufall, der sonst nie ein Accessoire gäbe
    expect(openChest(save, () => 0.99)?.kind).toBe('accessory');
    expect(save.inventory).toMatchObject({ chests: 1, perfectChests: 0 });
    expect(openChest(save, () => 0.99)?.kind).not.toBe('accessory');
  });

  it('gibt beim vollen Streak-Schutz-Vorrat einen Boost statt eines weiteren Schutzes', () => {
    const save = newSave();
    save.inventory.accessories = ACCESSORIES.map((a) => a.id);
    save.streak.shields = MAX_SHIELDS;
    for (let i = 0; i < 20; i++) expect(rollChest(save, Math.random)).toEqual({ kind: 'boost' });
  });
});
