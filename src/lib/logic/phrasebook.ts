import { SITUATION_TAGS, type Content, type ItemId, type SituationTag } from '../../content/types';

/** Ein Eintrag im Sprachführer: Wort oder Satz in einheitlicher Form. */
export interface Entry {
  id: ItemId;
  kind: 'word' | 'sentence';
  vn: string;
  de: string;
  /** Nur Wörter. */
  pron?: string;
  tags: SituationTag[];
  /** Normalisierter Suchtext aus vn, de und pron. */
  search: string;
  /** Normalisierter vn-Text für die Rangfolge der Treffer. */
  vnKey: string;
}

/**
 * Suchform: klein, ohne Diakritika, „đ“ = „d“, „ß“ = „ss“.
 * Zerlegt Zeichen (NFD) und entfernt die kombinierenden Zeichen, damit „cảm ơn“ zu „cam on“ wird.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/ß/g, 'ss');
}

/** Alle Wörter und Sätze; Sätze zuerst, jeweils in Inhaltsreihenfolge. */
export function buildEntries(c: Pick<Content, 'words' | 'sentences'>): Entry[] {
  const sentences: Entry[] = c.sentences.map((s) => ({
    id: s.id,
    kind: 'sentence',
    vn: s.vn,
    de: s.de,
    tags: s.tags,
    search: normalize(`${s.vn} ${s.de}`),
    vnKey: normalize(s.vn),
  }));
  const words: Entry[] = c.words.map((w) => ({
    id: w.id,
    kind: 'word',
    vn: w.vn,
    de: w.de,
    pron: w.pron,
    tags: w.tags,
    search: normalize(`${w.vn} ${w.de} ${w.pron ?? ''}`),
    vnKey: normalize(w.vn),
  }));
  return [...sentences, ...words];
}

/** Suchwörter: normalisiert, an Leerraum getrennt. */
export const searchTerms = (query: string): string[] => normalize(query).split(/\s+/).filter(Boolean);

export interface Filter {
  /** Freitext; alle Suchwörter müssen vorkommen. Leer = alles. */
  query?: string;
  /** Nur diese Situation. */
  situation?: SituationTag | null;
  /** Nur diese Einträge (Favoriten); undefiniert = alle. */
  only?: ReadonlySet<ItemId> | null;
}

/**
 * Filtert Einträge. Bei einer Suche stehen Treffer mit dem ganzen Suchtext im vn-Text vorn
 * (genau gleich vor „enthält“), sonst bleibt die Reihenfolge erhalten.
 */
export function filterEntries(entries: readonly Entry[], f: Filter): Entry[] {
  const terms = searchTerms(f.query ?? '');
  const phrase = terms.join(' ');
  const hits = entries.filter(
    (e) =>
      (!f.situation || e.tags.includes(f.situation)) &&
      (!f.only || f.only.has(e.id)) &&
      terms.every((t) => e.search.includes(t)),
  );
  if (!phrase) return hits;
  const rank = (e: Entry) => (e.vnKey === phrase ? 0 : e.vnKey.includes(phrase) ? 1 : 2);
  // Array.prototype.sort ist stabil: gleicher Rang behält die Inhaltsreihenfolge.
  return hits.sort((a, b) => rank(a) - rank(b));
}

export interface Group {
  tag: SituationTag;
  label: string;
  entries: Entry[];
}

/** Gruppiert nach Situation in der Reihenfolge von SITUATION_TAGS; ein Eintrag mit mehreren Tags steht in jeder Gruppe. Leere Gruppen entfallen. */
export function groupBySituation(entries: readonly Entry[]): Group[] {
  return (Object.keys(SITUATION_TAGS) as SituationTag[])
    .map((tag) => ({ tag, label: SITUATION_TAGS[tag], entries: entries.filter((e) => e.tags.includes(tag)) }))
    .filter((g) => g.entries.length > 0);
}
