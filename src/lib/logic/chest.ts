import type { SaveState } from '../storage/state';
import { missingAccessories, type AccessoryId } from './accessories';
import { MAX_SHIELDS } from './rewards';

/** Truhen: gibt es für jeden ersten Sieg über einen Boss; beim Öffnen wird der Inhalt gezogen. */

export type Rng = () => number;
export type ChestPrize = { kind: 'boost' } | { kind: 'shield' } | { kind: 'accessory'; id: AccessoryId };

/** Chance auf ein Accessoire, solange noch welche fehlen. Ein makelloser Boss garantiert eines. */
export const ACCESSORY_CHANCE = 0.5;

/** Ein erster Sieg legt eine Truhe in den Vorrat (makellos: mit garantiertem Accessoire). Gibt zurück, ob es eine gab. */
export function awardChest(save: SaveState, firstWin: boolean, perfect = false): boolean {
  if (!firstWin) return false;
  save.inventory.chests++;
  if (perfect) save.inventory.perfectChests++;
  return true;
}

export function rollChest(save: SaveState, rng: Rng, perfect = false): ChestPrize {
  const missing = missingAccessories(save);
  if (missing.length > 0 && (perfect || rng() < ACCESSORY_CHANCE)) {
    return { kind: 'accessory', id: missing[Math.floor(rng() * missing.length)]!.id };
  }
  if (save.streak.shields < MAX_SHIELDS && rng() < 0.5) return { kind: 'shield' };
  return { kind: 'boost' };
}

/**
 * Öffnet eine Truhe aus dem Vorrat und bucht den Inhalt; null, wenn keine da ist.
 * Makellose Truhen werden zuerst geöffnet – die Garantie gilt auch, wenn man sie erst später im Profil öffnet.
 */
export function openChest(save: SaveState, rng: Rng): ChestPrize | null {
  if (save.inventory.chests < 1) return null;
  const perfect = save.inventory.perfectChests > 0;
  const prize = rollChest(save, rng, perfect);
  save.inventory.chests--;
  if (perfect) save.inventory.perfectChests--;
  save.stats.chests++;
  if (prize.kind === 'accessory') save.inventory.accessories.push(prize.id);
  else if (prize.kind === 'shield') save.streak.shields++;
  else save.inventory.xpBoosts++;
  return prize;
}
