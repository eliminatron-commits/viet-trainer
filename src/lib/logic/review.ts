import type { Content, ItemId } from '../../content/types';
import { dateKey, type ReviewVerdict } from '../storage/state';

/** Ein noch ungeprüfter Eintrag für die Muttersprachlerin. */
export interface ReviewEntry {
  id: ItemId;
  kind: 'word' | 'sentence';
  vn: string;
  de: string;
  pron?: string;
}

export type ReviewMap = Partial<Record<ItemId, ReviewVerdict>>;
export type ReviewFilter = 'open' | 'all';

/** Alle Einträge mit checked:false – erst Wörter, dann Sätze, jeweils in Inhaltsreihenfolge. */
export function reviewEntries(c: Pick<Content, 'words' | 'sentences'>): ReviewEntry[] {
  return [
    ...c.words.filter((w) => !w.checked).map((w): ReviewEntry => ({ id: w.id, kind: 'word', vn: w.vn, de: w.de, pron: w.pron })),
    ...c.sentences.filter((s) => !s.checked).map((s): ReviewEntry => ({ id: s.id, kind: 'sentence', vn: s.vn, de: s.de })),
  ];
}

/** Beurteilt = hat ein Urteil unter den geprüften Einträgen. */
export function reviewProgress(entries: readonly ReviewEntry[], review: ReviewMap): { done: number; total: number } {
  return { done: entries.filter((e) => review[e.id]).length, total: entries.length };
}

/**
 * Sichtbare Einträge: „alle“ oder nur die offenen. `keep` hält gerade beurteilte Einträge im Filter „offen“ sichtbar,
 * damit eine Karte nicht unter dem Finger verschwindet.
 */
export function visibleEntries(
  entries: readonly ReviewEntry[],
  review: ReviewMap,
  filter: ReviewFilter,
  keep: ReadonlySet<ItemId> = new Set(),
): ReviewEntry[] {
  return filter === 'all' ? [...entries] : entries.filter((e) => !review[e.id] || keep.has(e.id));
}

export interface ReviewExportItem {
  id: ItemId;
  vn: string;
  de: string;
  pron?: string;
  verdict: ReviewVerdict['verdict'];
  note: string;
}

export interface ReviewExport {
  app: 'viet-trainer';
  exportedAt: string;
  items: ReviewExportItem[];
}

/** Export: nur beurteilte Einträge, in Inhaltsreihenfolge. */
export function buildReviewExport(entries: readonly ReviewEntry[], review: ReviewMap, now: Date): ReviewExport {
  const items: ReviewExportItem[] = [];
  for (const e of entries) {
    const r = review[e.id];
    if (!r) continue;
    items.push({ id: e.id, vn: e.vn, de: e.de, ...(e.pron ? { pron: e.pron } : {}), verdict: r.verdict, note: r.note });
  }
  return { app: 'viet-trainer', exportedAt: now.toISOString(), items };
}

export const reviewFileName = (now: Date) => `viet-trainer-pruefung-${dateKey(now)}.json`;
