import type { DateKey, SaveState } from '../storage/state';
import { goalReached } from './rewards';

/** Trâus Hof: Gras gibt es einmal am Tag, sobald das Tagesziel erreicht ist. */
export const fedToday = (save: SaveState, day: DateKey): boolean => save.yard.fedOn === day;

export const canFeed = (save: SaveState, day: DateKey): boolean => goalReached(save, day) && !fedToday(save, day);

/** Trâu füttern: false, wenn es heute (noch) kein Gras gibt. */
export function feed(save: SaveState, day: DateKey): boolean {
  if (!canFeed(save, day)) return false;
  save.yard = { fedOn: day, fed: save.yard.fed + 1 };
  return true;
}
