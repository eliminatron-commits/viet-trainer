import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import type { ItemId } from '../src/content/types';
import {
  buildReviewExport,
  reviewEntries,
  reviewFileName,
  reviewProgress,
  visibleEntries,
  type ReviewMap,
} from '../src/lib/logic/review';
import type { ReviewVerdict } from '../src/lib/storage/state';

const entries = reviewEntries(content);
/** Urteilskarte aus Paaren (berechnete Schlüssel würden sonst zu string verbreitert). */
const map = (...pairs: [ItemId, ReviewVerdict][]): ReviewMap => Object.fromEntries(pairs) as ReviewMap;
const NOW = new Date(2026, 10, 4, 21, 30);

describe('reviewEntries', () => {
  it('enthält genau die ungeprüften Wörter und Sätze', () => {
    const open = content.words.filter((w) => !w.checked).length + content.sentences.filter((s) => !s.checked).length;
    expect(open).toBeGreaterThan(0);
    expect(entries).toHaveLength(open);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
    const byId = new Map([...content.words, ...content.sentences].map((x) => [x.id, x]));
    for (const e of entries) expect(byId.get(e.id)?.checked, e.id).toBe(false);
  });

  it('übernimmt vn, de und bei Wörtern pron', () => {
    for (const e of entries) {
      const src = [...content.words, ...content.sentences].find((x) => x.id === e.id)!;
      expect(e.vn).toBe(src.vn);
      expect(e.de).toBe(src.de);
      if (e.kind === 'sentence') expect(e.pron).toBeUndefined();
    }
  });
});

describe('reviewProgress', () => {
  it('zählt beurteilte Einträge und ignoriert fremde IDs', () => {
    const review = map(
      [entries[0]!.id, { verdict: 'ok', note: '' }],
      [entries[1]!.id, { verdict: 'unnatural', note: 'klingt steif' }],
      ['w001', { verdict: 'ok', note: '' }], // geprüfter Eintrag zählt nicht
    );
    expect(reviewProgress(entries, review)).toEqual({ done: 2, total: entries.length });
    expect(reviewProgress(entries, {})).toEqual({ done: 0, total: entries.length });
  });
});

describe('visibleEntries', () => {
  const review = map([entries[0]!.id, { verdict: 'ok', note: '' }]);

  it('zeigt bei „alle“ alles und bei „offen“ nur Unbeurteilte', () => {
    expect(visibleEntries(entries, review, 'all')).toEqual(entries);
    const open = visibleEntries(entries, review, 'open');
    expect(open).toHaveLength(entries.length - 1);
    expect(open.some((e) => e.id === entries[0]!.id)).toBe(false);
  });

  it('hält gerade beurteilte Einträge sichtbar, wenn sie in keep stehen', () => {
    const open = visibleEntries(entries, review, 'open', new Set([entries[0]!.id]));
    expect(open).toEqual(entries);
  });
});

describe('buildReviewExport', () => {
  const review = map(
    [entries[2]!.id, { verdict: 'unnatural', note: 'sagt man so nicht' }],
    [entries[0]!.id, { verdict: 'ok', note: '' }],
  );

  it('hat das vereinbarte Format und nur beurteilte Einträge in Inhaltsreihenfolge', () => {
    const out = buildReviewExport(entries, review, NOW);
    expect(out.app).toBe('viet-trainer');
    expect(out.exportedAt).toBe(NOW.toISOString());
    expect(out.items.map((i) => i.id)).toEqual([entries[0]!.id, entries[2]!.id]);
    expect(out.items[0]).toMatchObject({ id: entries[0]!.id, vn: entries[0]!.vn, de: entries[0]!.de, verdict: 'ok', note: '' });
    expect(out.items[1]).toMatchObject({ verdict: 'unnatural', note: 'sagt man so nicht' });
  });

  it('nimmt pron nur bei Einträgen mit Aussprache auf', () => {
    const withPron = entries.find((e) => e.pron)!;
    const without = entries.find((e) => !e.pron)!;
    const out = buildReviewExport(
      entries,
      map([withPron.id, { verdict: 'ok', note: '' }], [without.id, { verdict: 'ok', note: '' }]),
      NOW,
    );
    expect(out.items.find((i) => i.id === withPron.id)?.pron).toBe(withPron.pron);
    expect('pron' in out.items.find((i) => i.id === without.id)!).toBe(false);
  });

  it('ist ohne Urteile leer und übersteht JSON', () => {
    expect(buildReviewExport(entries, {}, NOW).items).toEqual([]);
    const out = buildReviewExport(entries, review, NOW);
    expect(JSON.parse(JSON.stringify(out))).toEqual(out);
  });
});

describe('reviewFileName', () => {
  it('trägt das lokale Datum', () => {
    expect(reviewFileName(NOW)).toBe('viet-trainer-pruefung-2026-11-04.json');
    expect(reviewFileName(new Date(2027, 0, 9))).toBe('viet-trainer-pruefung-2027-01-09.json');
  });
});
