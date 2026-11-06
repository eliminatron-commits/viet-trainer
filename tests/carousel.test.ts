import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { centeredIndex, motifPairs, motifSentences } from '../src/lib/logic/carousel';
import { isBuildable, sentenceTiles } from '../src/lib/logic/session';
import { newSave, type ItemProgress, type SaveState } from '../src/lib/storage/state';

const learned: ItemProgress = { box: 2, due: '2026-11-09', seen: 2, right: 1, wrong: 0 };
const seenOnly: ItemProgress = { box: 1, due: '2026-11-09', seen: 1, right: 0, wrong: 0 };

/** Alle Wörter gesehen (Sätze frei), die ersten `words` gelernt, dazu die genannten Sätze. */
function saveWith(words: number, sentences: string[] = []): SaveState {
  const save = newSave(new Date('2026-11-06T10:00:00'));
  content.words.forEach((w, i) => (save.items[w.id] = i < words ? learned : seenOnly));
  for (const id of sentences) save.items[id as keyof typeof save.items] = learned;
  return save;
}

describe('Motive im Modus-Karussell', () => {
  it('Paare zeigen nur gelernte, kurze Wörter – ohne Gelerntes bleibt das Motiv leer', () => {
    expect(motifPairs(saveWith(0))).toEqual([]);
    const save = saveWith(40);
    const pairs = motifPairs(save);
    expect(pairs).toHaveLength(3);
    for (const p of pairs) {
      const w = content.words.find((x) => x.vn.trim() === p.vn)!;
      expect(save.items[w.id]!.right).toBeGreaterThan(0);
      expect(w.kind).toBe('word');
      expect(p.de).toBe(w.de.trim());
      expect(p.vn.length).toBeLessThanOrEqual(7);
      expect(p.de.length).toBeLessThanOrEqual(9);
    }
  });

  it('Satzbau und Diktat zeigen zwei verschiedene gelernte Sätze, sonst keinen', () => {
    expect(motifSentences(saveWith(538))).toEqual({ build: null, dictation: null });
    const fits = content.sentences.filter((s) => isBuildable(s) && sentenceTiles(s).tiles.length <= 5 && sentenceTiles(s).tiles.join(' ').length <= 26).slice(0, 2);
    expect(fits).toHaveLength(2);
    const one = motifSentences(saveWith(538, [fits[0]!.id]));
    expect(one.build).toEqual(sentenceTiles(fits[0]!).tiles);
    expect(one.dictation).toEqual(one.build);
    const two = motifSentences(saveWith(538, fits.map((s) => s.id)));
    expect(two.build).not.toEqual(two.dictation);
    for (const t of [two.build!, two.dictation!]) {
      expect(t.length).toBeLessThanOrEqual(5);
      expect(t.join(' ').length).toBeLessThanOrEqual(26);
    }
    // ein langer Satz passt nicht in die Satzleiste → kein Motiv
    const long = content.sentences.find((s) => isBuildable(s) && (sentenceTiles(s).tiles.length > 5 || sentenceTiles(s).tiles.join(' ').length > 26))!;
    expect(motifSentences(saveWith(538, [long.id])).build).toBeNull();
    // gelernt, aber nicht frei (Wörter noch nie gesehen) → kein Motiv
    const unseen = newSave(new Date('2026-11-06T10:00:00'));
    unseen.items[fits[0]!.id] = learned;
    expect(motifSentences(unseen).build).toBeNull();
  });

  it('die mittlere Karte ist die, deren Mitte der Mitte am nächsten liegt', () => {
    const centers = [180, 552, 924, 1296];
    expect(centeredIndex(centers, 220)).toBe(0);
    expect(centeredIndex(centers, 380)).toBe(1);
    expect(centeredIndex(centers, 1250)).toBe(3);
    expect(centeredIndex(centers, 5000)).toBe(3);
  });
});
