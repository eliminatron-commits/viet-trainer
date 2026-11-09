import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import type { Word } from '../src/content/types';
import { motifTwins } from '../src/lib/logic/carousel';
import {
  answerOf,
  buildTrainingBatch,
  FOCUS_BATCH,
  focusInfo,
  meanings,
  quizTask,
  twinsOf,
  twinsTask,
  type Rng,
} from '../src/lib/logic/session';
import { countTask } from '../src/lib/logic/stats';
import { baseForm, tonesOf } from '../src/lib/logic/tones';
import { newSave, type ItemProgress, type SaveState } from '../src/lib/storage/state';

const learned: ItemProgress = { box: 2, due: '2099-01-01', seen: 2, right: 1, wrong: 0 };
const seenOnly: ItemProgress = { box: 1, due: '2099-01-01', seen: 1, right: 0, wrong: 0 };
const word = (vn: string): Word => content.words.find((w) => w.vn.trim() === vn)!;

function seeded(seed: number): Rng {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
}

/** Spielstand: die genannten Wörter gelernt, die übrigen genannten nur gesehen. */
function saveWith(learnedVn: string[], seenVn: string[] = []): SaveState {
  const save = newSave(new Date('2026-11-09T10:00:00'));
  for (const vn of learnedVn) save.items[word(vn).id] = learned;
  for (const vn of seenVn) save.items[word(vn).id] = seenOnly;
  return save;
}

describe('Ton-Zwillinge im Wortschatz', () => {
  it('bạn hat bán und bàn als Zwillinge; Zwillinge sind gegenseitig', () => {
    expect(twinsOf(word('bạn')).map((w) => w.vn)).toEqual(['bán', 'bàn']);
    expect(twinsOf(word('bàn')).map((w) => w.vn)).toEqual(['bạn', 'bán']);
    expect(twinsOf(word('mắt')).map((w) => w.vn)).toEqual(['mặt']);
  });

  it('jeder Zwilling: echtes Wort, gleiche Grundform, andere Tonfolge, keine Bedeutung doppelt', () => {
    let withTwins = 0;
    for (const w of content.words) {
      const twins = twinsOf(w);
      if (w.kind !== 'word') {
        expect(twins).toEqual([]);
        continue;
      }
      if (twins.length > 0) withTwins++;
      const group = [w, ...twins];
      expect(new Set(group.map((x) => tonesOf(x.vn).join())).size).toBe(group.length);
      const said = group.flatMap(meanings);
      expect(new Set(said).size).toBe(said.length);
      for (const t of twins) {
        expect(t.kind).toBe('word');
        expect(baseForm(t.vn)).toBe(baseForm(w.vn));
        expect(t.id).not.toBe(w.id);
      }
    }
    // 63 Gruppen aus echten Wörtern (66 mit Partikeln), meist Paare
    expect(withTwins).toBeGreaterThanOrEqual(120);
  });

  it('gleiche Schreibung ist kein Zwilling (man hörte keinen Unterschied), gleiche Bedeutung auch nicht', () => {
    // nachgebaute Einträge – im Wortschatz gibt es beide Fälle (noch) nicht
    const sameSpelling: Word = { ...word('bạn'), id: 'w990' as Word['id'], de: 'Fremd' };
    expect(twinsOf(sameSpelling).map((w) => w.vn)).toEqual(['bán', 'bàn']);
    const sameMeaning: Word = { ...word('bàn'), id: 'w991' as Word['id'], de: 'verkaufen' };
    expect(twinsOf(sameMeaning).map((w) => w.vn)).toEqual(['bạn']);
  });

  it('Partikel sind keine Zwillinge', () => {
    for (const w of content.words) for (const t of twinsOf(w)) expect(t.kind).toBe('word');
  });
});

describe('Aufgabe Ton-Zwillinge', () => {
  it('das Wort hören, seine Bedeutung unter allen Zwillingen wählen', () => {
    const t = twinsTask(word('bạn'), seeded(3))!;
    expect(t.kind).toBe('twins');
    if (t.kind !== 'twins') return;
    expect(answerOf(t)).toBe(word('bạn').id);
    expect(t.options.map((w) => w.vn).sort()).toEqual(['bàn', 'bán', 'bạn'].sort());
    expect(new Set(t.options.map((w) => w.de)).size).toBe(3);
  });

  it('ohne Zwilling keine Aufgabe', () => {
    expect(twinsTask(word('anh'), seeded(1))).toBeNull();
  });

  it('im gemischten Quiz nur bei gelerntem Wort mit gelerntem Zwilling', () => {
    const kinds = (vn: string, save?: SaveState) =>
      new Set(Array.from({ length: 300 }, (_, i) => quizTask(word(vn).id, seeded(i + 1), undefined, save).kind));
    expect(kinds('bạn', saveWith(['bạn', 'bán'])).has('twins')).toBe(true);
    // Zwilling nur gesehen, Wort selbst nicht gelernt, ganz ohne Spielstand: nie
    expect(kinds('bạn', saveWith(['bạn'], ['bán', 'bàn'])).has('twins')).toBe(false);
    expect(kinds('bạn', saveWith(['bán'], ['bạn'])).has('twins')).toBe(false);
    expect(kinds('bạn').has('twins')).toBe(false);
  });

  it('Training „Ton-Zwillinge“: erst mit zwei gelernten Zwillingen, dann nur diese Wörter', () => {
    expect(focusInfo(saveWith(['bạn', 'anh']), 'twins')).toEqual({ available: false, count: 0 });
    expect(focusInfo(saveWith(['bạn'], ['bán']), 'twins').available).toBe(false);
    const save = saveWith(['bạn', 'bán', 'anh', 'mắt']);
    expect(focusInfo(save, 'twins')).toEqual({ available: true, count: 2 });
    const tasks = buildTrainingBatch(save, '2026-11-09', false, seeded(7), 'twins');
    expect(tasks).toHaveLength(FOCUS_BATCH.twins);
    const ids = new Set([word('bạn').id, word('bán').id]);
    for (const t of tasks) {
      expect(t.kind).toBe('twins');
      expect(ids.has(t.key as Word['id'])).toBe(true);
    }
    for (let i = 1; i < tasks.length; i++) expect(tasks[i]!.key).not.toBe(tasks[i - 1]!.key);
    // in Durchgängen: bei zwei Wörtern jedes gleich oft (vorher kam eins in jedem zweiten Schritt fest dran)
    for (let seed = 1; seed <= 20; seed++) {
      const keys = buildTrainingBatch(save, '2026-11-09', false, seeded(seed), 'twins').map((t) => t.key);
      expect(keys.filter((k) => k === word('bạn').id)).toHaveLength(FOCUS_BATCH.twins / 2);
    }
  });

  it('zählt als richtige Antwort, aber nicht für den Ton-Ninja', () => {
    const stats = newSave().stats;
    countTask(stats, { mode: 'twins', correct: true, units: [] });
    expect(stats.correct).toBe(1);
    expect(stats.tones).toBe(0);
  });
});

describe('Motiv der Ton-Zwillinge', () => {
  it('zeigt das erste gelernte Paar mit kurzer Bedeutung, sonst nichts', () => {
    expect(motifTwins(saveWith([]))).toBeNull();
    expect(motifTwins(saveWith(['bạn'], ['bán', 'bàn']))).toBeNull();
    expect(motifTwins(saveWith(['bạn', 'bán']))).toEqual([
      { vn: 'bạn', de: 'Freund' },
      { vn: 'bán', de: 'verkaufen' },
    ]);
  });

  it('passt immer in die Karten (Schreibung bis 5, Bedeutung bis 9 Zeichen), auch wenn alles gelernt ist', () => {
    const all = saveWith([]);
    for (const w of content.words) all.items[w.id] = learned;
    const shown = motifTwins(all)!;
    expect(shown).toHaveLength(2);
    for (const t of shown) {
      expect(t.vn.length).toBeLessThanOrEqual(5);
      expect(t.de.length).toBeLessThanOrEqual(9);
    }
  });
});
