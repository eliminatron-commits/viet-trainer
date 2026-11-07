import { content } from '../../content';
import type { ProgressKey, SaveState } from '../storage/state';
import { isSentenceFree } from './path';
import { gapTask, isBuildable, isGappable, learnedKeys, sentenceTiles } from './session';

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

/** Satz mit Lücke fürs Motiv: Text vor und nach der Lücke, drei Kacheln (darunter die richtige an Stelle `answer`). */
export interface MotifGap {
  before: string;
  after: string;
  options: string[];
  answer: number;
}
/** Gemessen (Be Vietnam Pro 700, 5,6 cqw): der breiteste Satz bis 24 Zeichen braucht samt Kachelrand 83 von 86 cqw;
 *  drei Kacheln zu je 6 Zeichen passen in die Reihe (90 cqw). */
const MOTIF_GAP = 24;
const MOTIF_GAP_TILE = 6;

/**
 * Ein gelernter, freier Satz mit Lücke fürs Motiv: kurz genug für die Satzleiste, Kacheln kurz genug für eine kleine
 * Kachel; die richtige Kachel liegt rechts, damit sie schräg nach oben in die Lücke springt. `null`, wenn keiner passt.
 */
export function motifGap(save: SaveState): MotifGap | null {
  const learned = new Set<ProgressKey>(learnedKeys(save));
  for (const s of content.sentences) {
    if (!learned.has(s.id) || s.vn.length > MOTIF_GAP || !isSentenceFree(save, s) || !isGappable(s)) continue;
    const t = gapTask(s, () => 0, save);
    if (!t || t.kind !== 'gap') continue;
    const answer = t.answer.vn.trim();
    const others = t.options.filter((o) => o.id !== t.answer.id).map((o) => o.vn.trim());
    const options = [...others.slice(0, 2), answer];
    if (options.some((o) => o.length > MOTIF_GAP_TILE)) continue;
    return { before: t.before, after: t.after, options, answer: 2 };
  }
  return null;
}

/** Index der Karte, deren Mitte der Mitte des Karussells am nächsten liegt. */
export function centeredIndex(centers: readonly number[], middle: number): number {
  let best = 0;
  centers.forEach((c, i) => {
    if (Math.abs(c - middle) < Math.abs(centers[best]! - middle)) best = i;
  });
  return best;
}
