import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import type { Sentence } from '../src/content/types';
import { glossSentence, glossText, roleNote, sentencesWith, syllableTones } from '../src/lib/logic/gloss';

const sentence = (id: string) => content.sentences.find((s) => s.id === id) as Sentence;

describe('Satzlupe: Satz in Wörter zerlegen', () => {
  it('zerlegt „Anh là bạn của em.“ in seine fünf Wörter, Satzzeichen fallen weg', () => {
    const parts = glossSentence(sentence('s002'));
    expect(parts.map((p) => p.text)).toEqual(['Anh', 'là', 'bạn', 'của', 'em']);
    expect(parts.map((p) => p.word?.id)).toEqual(['w003', 'w011', 'w002', 'w376', 'w005']);
  });

  it('Anreden folgen dem Kontext des Satzes: em = „ich“, anh = „du“ (zu älterem Mann)', () => {
    const s = sentence('s002');
    const parts = glossSentence(s);
    expect(parts[0]).toMatchObject({ role: 'addr' });
    expect(parts[4]).toMatchObject({ role: 'self' });
    expect(glossText(parts[0]!)).toBe('du');
    expect(glossText(parts[4]!)).toBe('ich');
    expect(glossText(parts[2]!)).toBe('du / Freund');
    expect(roleNote(s, parts[4]!)).toBe('„ich“ – du sprichst zu älterem Mann');
    expect(roleNote(s, parts[2]!)).toBeNull();
  });

  it('mehrsilbige Wörter bleiben ein Teil („cảm ơn“)', () => {
    const parts = glossSentence(sentence('s024'));
    expect(parts.map((p) => p.text)).toEqual(['Không', 'cảm ơn']);
    expect(parts[1]!.word?.id).toBe('w062');
  });

  it('auch ohne Vokabelliste findet der Wortschatz mehrsilbige Wörter (längstes zuerst)', () => {
    const s = { ...sentence('s024'), id: 's999', vn: 'Cảm ơn bạn nhiều!', words: [], ctx: undefined } as Sentence;
    const parts = glossSentence(s);
    expect(parts.map((p) => p.text)).toEqual(['Cảm ơn', 'bạn', 'nhiều']);
    expect(parts[0]!.word?.id).toBe('w062');
  });

  it('jede Vokabel eines Satzes (words) findet sich in seiner Zerlegung', () => {
    const missing = content.sentences.flatMap((s) => {
      const ids = new Set(glossSentence(s).map((p) => p.word?.id));
      return s.words.filter((id) => !ids.has(id)).map((id) => `${s.id}:${id}`);
    });
    expect(missing).toEqual([]);
  });

  it('deckt fast alle Silben aller Sätze mit dem Wortschatz ab; der Rest bleibt als Teil ohne Wort stehen', () => {
    let all = 0;
    let known = 0;
    for (const s of content.sentences) {
      const parts = glossSentence(s);
      // Nichts geht verloren: die Teile ergeben wieder alle Silben des Satzes.
      expect(parts.flatMap((p) => p.text.split(' ')).length).toBe(s.vn.split(/\s+/).filter((t) => /\p{L}/u.test(t)).length);
      for (const p of parts) {
        const n = p.text.split(' ').length;
        all += n;
        if (p.word) known += n;
      }
    }
    expect(known / all).toBeGreaterThan(0.94);
  });
});

describe('Wortkarte', () => {
  it('nennt Sätze mit dem Wort, früh eingeführte zuerst, ohne den aktuellen', () => {
    const list = sentencesWith('w002', content, 's002');
    expect(list.length).toBeGreaterThan(0);
    expect(list.length).toBeLessThanOrEqual(3);
    expect(list.map((s) => s.id)).not.toContain('s002');
    for (const s of list) expect(glossSentence(s).some((p) => p.word?.id === 'w002')).toBe(true);
    const stages = list.map((s) => s.stage);
    expect([...stages].sort()).toEqual(stages);
  });

  it('Ton je Silbe aus der Schreibung, mit dem Vokal, der ihn trägt', () => {
    expect(syllableTones('cảm ơn')).toEqual([
      { text: 'cảm', tone: 'hoi', vowel: 'a', lift: false },
      { text: 'ơn', tone: 'ngang', vowel: 'ơ', lift: false },
    ]);
    expect(syllableTones('bạn')).toEqual([{ text: 'bạn', tone: 'nang', vowel: 'a', lift: false }]);
    expect(syllableTones('là').map((t) => t.tone)).toEqual(['huyen']);
    // Zirkumflex hebt das Tonzeichen an; nacktes i mit Ton wird punktlos
    expect(syllableTones('thấy')[0]).toMatchObject({ tone: 'sac', vowel: 'â', lift: true });
    expect(syllableTones('chị')[0]).toMatchObject({ tone: 'nang', vowel: 'ı' });
    expect(syllableTones('em')[0]).toMatchObject({ tone: 'ngang', vowel: 'e' });
  });
});
