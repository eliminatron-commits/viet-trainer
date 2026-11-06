import { content } from '../../content';
import type { ProgressKey, SaveState } from '../storage/state';
import { isSentenceFree } from './path';
import { isBuildable, learnedKeys, sentenceTiles } from './session';

/**
 * Motive im Modus-Karussell (Training): Sie zeigen echte, schon gelernte Inhalte – nie etwas Neues.
 * Ist noch nichts passend gelernt, bleibt das Motiv leer (Kacheln ohne Text).
 */

/** Passt in eine kleine Kachel des Motivs. */
const MOTIF_VN = 7;
const MOTIF_DE = 9;
const MOTIF_TILES = 5;
const MOTIF_SENTENCE = 26;

/** Bis zu `n` gelernte Wörter als Paare (Vietnamesisch ↔ Deutsch), kurz genug für eine Kachel; feste Reihenfolge. */
export function motifPairs(save: SaveState, n = 3): { vn: string; de: string }[] {
  const learned = new Set<ProgressKey>(learnedKeys(save));
  return content.words
    .filter((w) => learned.has(w.id) && w.kind === 'word' && w.vn.trim().length <= MOTIF_VN && w.de.trim().length <= MOTIF_DE)
    .slice(0, n)
    .map((w) => ({ vn: w.vn.trim(), de: w.de.trim() }));
}

/**
 * Kacheln zweier gelernter, baubarer Sätze für Satzbau und Diktat (möglichst verschiedene), kurz genug fürs Motiv.
 * `null`, wenn kein passender Satz gelernt ist.
 */
export function motifSentences(save: SaveState): { build: string[] | null; dictation: string[] | null } {
  const learned = new Set<ProgressKey>(learnedKeys(save));
  const fits = content.sentences
    .filter((s) => learned.has(s.id) && isSentenceFree(save, s) && isBuildable(s))
    .map((s) => sentenceTiles(s).tiles)
    .filter((t) => t.length <= MOTIF_TILES && t.join(' ').length <= MOTIF_SENTENCE);
  return { build: fits[0] ?? null, dictation: fits[1] ?? fits[0] ?? null };
}

/** Index der Karte, deren Mitte der Mitte des Karussells am nächsten liegt. */
export function centeredIndex(centers: readonly number[], middle: number): number {
  let best = 0;
  centers.forEach((c, i) => {
    if (Math.abs(c - middle) < Math.abs(centers[best]! - middle)) best = i;
  });
  return best;
}
