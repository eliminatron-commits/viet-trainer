import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { SITUATION_TAGS } from '../src/content/types';
import { buildEntries, filterEntries, groupBySituation, normalize, searchTerms } from '../src/lib/logic/phrasebook';

const entries = buildEntries(content);
const find = (vn: string) => entries.find((e) => e.vn === vn);

describe('normalize', () => {
  it('entfernt Diakritika und Großschreibung', () => {
    expect(normalize('Cảm ơn')).toBe('cam on');
    expect(normalize('Việt Nam')).toBe('viet nam');
  });

  it('setzt đ gleich d und ß gleich ss', () => {
    expect(normalize('Đà Nẵng')).toBe('da nang');
    expect(normalize('đi')).toBe('di');
    expect(normalize('Straße')).toBe('strasse');
  });

  it('lässt reines ASCII unverändert (klein)', () => {
    expect(normalize('abc def')).toBe('abc def');
    expect(normalize('ABC')).toBe('abc');
  });

  it('liefert für zusammengesetzte und zerlegte Eingabe dasselbe', () => {
    expect(normalize('ơ'.normalize('NFC'))).toBe(normalize('ơ'.normalize('NFD')));
    expect(normalize('ế'.normalize('NFC'))).toBe(normalize('ế'.normalize('NFD')));
  });
});

describe('buildEntries', () => {
  it('enthält jedes Wort und jeden Satz genau einmal, Sätze zuerst', () => {
    expect(entries).toHaveLength(content.words.length + content.sentences.length);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
    const firstWord = entries.findIndex((e) => e.kind === 'word');
    expect(entries.slice(0, firstWord).every((e) => e.kind === 'sentence')).toBe(true);
    expect(entries.slice(firstWord).every((e) => e.kind === 'word')).toBe(true);
  });

  it('übernimmt pron nur bei Wörtern', () => {
    expect(entries.filter((e) => e.kind === 'sentence').every((e) => e.pron === undefined)).toBe(true);
    expect(entries.some((e) => e.kind === 'word' && e.pron)).toBe(true);
  });
});

describe('filterEntries: Suche', () => {
  it('findet „cảm ơn“ über „cam on“ und „CAM ON“', () => {
    const target = find('cảm ơn');
    expect(target).toBeTruthy();
    for (const q of ['cam on', 'CAM ON', 'cảm ơn', '  cam   on ']) {
      expect(filterEntries(entries, { query: q }).map((e) => e.id)).toContain(target!.id);
    }
  });

  it('stellt den genauen Treffer vor die übrigen', () => {
    expect(filterEntries(entries, { query: 'cam on' })[0]?.vnKey).toBe('cam on');
  });

  it('findet jeden Eintrag über seinen eigenen vn-Text, auch ohne Diakritika', () => {
    for (const e of entries) {
      expect(filterEntries(entries, { query: e.vn }).some((x) => x.id === e.id), e.id).toBe(true);
      expect(filterEntries(entries, { query: normalize(e.vn) }).some((x) => x.id === e.id), e.id).toBe(true);
    }
  });

  it('findet über die deutsche Übersetzung und über die Aussprache', () => {
    const word = entries.find((e) => e.kind === 'word' && e.pron && e.pron.length > 2)!;
    expect(filterEntries(entries, { query: word.pron }).some((e) => e.id === word.id)).toBe(true);
    const de = entries.find((e) => e.kind === 'sentence')!;
    expect(filterEntries(entries, { query: de.de }).some((e) => e.id === de.id)).toBe(true);
  });

  it('verlangt, dass alle Suchwörter vorkommen', () => {
    const e = entries.find((x) => searchTerms(x.vn).length >= 2)!;
    const [first, second] = searchTerms(e.vn);
    const both = filterEntries(entries, { query: `${first} ${second}` });
    const one = filterEntries(entries, { query: first });
    expect(both.some((x) => x.id === e.id)).toBe(true);
    expect(both.length).toBeLessThanOrEqual(one.length);
    expect(filterEntries(entries, { query: `${first} qqqxyz` })).toEqual([]);
  });

  it('liefert bei leerer Suche alles in Inhaltsreihenfolge', () => {
    expect(filterEntries(entries, { query: '   ' })).toEqual(entries);
    expect(filterEntries(entries, {})).toEqual(entries);
  });
});

describe('filterEntries: Situation und Favoriten', () => {
  it('behält nur Einträge der Situation', () => {
    for (const tag of Object.keys(SITUATION_TAGS) as (keyof typeof SITUATION_TAGS)[]) {
      const hits = filterEntries(entries, { situation: tag });
      expect(hits.length, tag).toBeGreaterThan(0);
      expect(hits.every((e) => e.tags.includes(tag)), tag).toBe(true);
    }
  });

  it('behält nur Favoriten und kombiniert mit Suche und Situation', () => {
    const favs = new Set([entries[0]!.id, entries[5]!.id, entries.at(-1)!.id]);
    expect(
      filterEntries(entries, { only: favs })
        .map((e) => e.id)
        .sort(),
    ).toEqual([...favs].sort());
    expect(filterEntries(entries, { only: new Set() })).toEqual([]);
    const e = entries[0]!;
    const hit = filterEntries(entries, { only: favs, query: e.vn, situation: e.tags[0] });
    expect(hit.map((x) => x.id)).toContain(e.id);
    expect(hit.every((x) => favs.has(x.id))).toBe(true);
  });
});

describe('groupBySituation', () => {
  it('folgt der Reihenfolge von SITUATION_TAGS und nennt die Anzeigenamen', () => {
    const groups = groupBySituation(entries);
    const order = Object.keys(SITUATION_TAGS);
    expect(groups.map((g) => g.tag)).toEqual(order.filter((t) => groups.some((g) => g.tag === t)));
    for (const g of groups) expect(g.label).toBe(SITUATION_TAGS[g.tag]);
  });

  it('deckt jeden Eintrag mindestens einmal ab und stellt Sätze vor Wörter', () => {
    const groups = groupBySituation(entries);
    const covered = new Set(groups.flatMap((g) => g.entries.map((e) => e.id)));
    expect(covered.size).toBe(entries.length);
    for (const g of groups) {
      const firstWord = g.entries.findIndex((e) => e.kind === 'word');
      if (firstWord >= 0) expect(g.entries.slice(firstWord).every((e) => e.kind === 'word'), g.tag).toBe(true);
    }
  });

  it('lässt leere Gruppen weg', () => {
    const one = groupBySituation(filterEntries(entries, { situation: 'restaurant' }));
    expect(one.every((g) => g.entries.length > 0)).toBe(true);
    expect(one.some((g) => g.tag === 'restaurant')).toBe(true);
    expect(groupBySituation([])).toEqual([]);
  });
});
