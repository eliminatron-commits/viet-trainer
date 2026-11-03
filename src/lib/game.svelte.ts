import type { UseStore } from 'idb-keyval';
import type { StageId } from '../content/types';
import { completeStage } from './logic/path';
import { addXp, XP_PER_CORRECT, type XpResult } from './logic/rewards';
import { answerItem, markSeen } from './logic/srs';
import { loadSave, openSaveStore, writeSave } from './storage/persist';
import { dateKey, newSave, type ProgressKey, type SaveState, type Settings } from './storage/state';

/** Globaler Spielstand. Jede Aktion schreibt sofort den kompletten Stand nach IndexedDB. */
export const game = $state<{ save: SaveState; ready: boolean; error: string }>({
  save: newSave(),
  ready: false,
  error: '',
});

let store: UseStore | null = null;
let writing: Promise<void> = Promise.resolve();

export const today = () => dateKey(new Date());

export async function initGame(): Promise<void> {
  store = openSaveStore();
  try {
    game.save = await loadSave(store);
  } catch (e) {
    game.error = e instanceof Error ? e.message : String(e);
  }
  game.ready = true;
}

/** Schreibvorgänge nacheinander, damit ein älterer Stand nie einen neueren überholt. */
function persist(): void {
  if (!store) return;
  const s = store;
  writing = writing
    .then(() => writeSave(game.save, s))
    .catch((e: unknown) => {
      game.error = `Speichern fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`;
    });
}

/** Wartet, bis alle Schreibvorgänge durch sind (z. B. vor Export). */
export const flushed = () => writing;

export function recordSeen(key: ProgressKey): void {
  game.save.items[key] = markSeen(game.save.items[key], today());
  persist();
}

export function recordAnswer(key: ProgressKey, correct: boolean): XpResult {
  const t = today();
  game.save.items[key] = answerItem(game.save.items[key], correct, t);
  const result = correct ? addXp(game.save, XP_PER_CORRECT, t) : { levelUp: null, goalJustReached: false };
  persist();
  return result;
}

export function recordBossWin(stage: StageId, lives: number): void {
  completeStage(game.save, stage, lives);
  persist();
}

export function updateSettings(patch: Partial<Settings>): void {
  game.save.settings = { ...game.save.settings, ...patch };
  persist();
}

/** Import: ersetzt den kompletten Spielstand. */
export function replaceSave(next: SaveState): void {
  game.save = next;
  persist();
}
