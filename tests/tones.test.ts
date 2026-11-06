import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { glyphs } from '../src/lib/logic/tones';

/** Lebendige Wörter: Buchstaben erst ohne Ton, danach fällt das Tonzeichen auf seinen Vokal. */
describe('Buchstaben mit Ton (Lebendige Wörter)', () => {
  const view = (text: string) => glyphs(text).map((g) => `${g.bare}${g.tone === 'ngang' ? '' : `:${g.tone}`}`);

  it('trennt alle fünf Töne ab und lässt Vokalzeichen und đ am Buchstaben', () => {
    expect(view('một')).toEqual(['m', 'ô:nang', 't']);
    expect(view('cảm ơn')).toEqual(['c', 'a:hoi', 'm', ' ', 'ơ', 'n']);
    expect(view('người')).toEqual(['n', 'g', 'ư', 'ơ:huyen', 'i']);
    expect(view('đẹp')).toEqual(['đ', 'e:nang', 'p']);
    expect(view('ngã')).toEqual(['n', 'g', 'a:nga']);
    expect(view('bán')).toEqual(['b', 'a:sac', 'n']);
    expect(view('Ừ')).toEqual(['Ư:huyen']);
    expect(view('ăn')).toEqual(['ă', 'n']);
  });

  it('setzt jedes Wort und jeden Satz wieder genau zusammen, ohne Tonzeichen im Grundbuchstaben', () => {
    for (const item of [...content.words, ...content.sentences]) {
      const parts = glyphs(item.vn);
      expect(parts.map((g) => g.full).join(''), item.id).toBe(item.vn.normalize('NFC'));
      for (const g of parts) expect(g.bare.normalize('NFD'), item.id).not.toMatch(/[̣̀́̃̉]/);
    }
  });
});
