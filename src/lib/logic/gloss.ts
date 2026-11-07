import { content as allContent } from '../../content';
import type { Content, Sentence, SentenceContext, SentenceId, Word, WordId } from '../../content/types';
import { glyphs, tonesOf, type Tone } from './tones';

/**
 * Satzlupe: zerlegt einen Satz in seine Wörter und erklärt jedes einzeln – nur aus vorhandenen Inhalten
 * (Wortschatz, Satz-Kontext). Silben ohne Wort im Wortschatz bleiben als Teil ohne Erklärung stehen.
 */

/** Ein Teil des Satzes: ein Wort (auch mehrsilbig) oder eine unbekannte Silbe. */
export interface GlossPart {
  /** Text wie im Satz (Groß-/Kleinschreibung erhalten), ohne Satzzeichen. */
  text: string;
  word?: Word;
  /** Im Kontext des Satzes ist dieses Wort „ich“ (self) bzw. „du“ (addr). */
  role?: 'self' | 'addr';
}

/** Vergleichsform einer Silbe: klein, NFC, Tonzeichen bleiben (sie unterscheiden Wörter). */
const key = (s: string) => s.normalize('NFC').toLowerCase();
const PUNCT = /^[\s.,!?;:"“”„‚‘’'…()«»–-]+|[\s.,!?;:"“”„‚‘’'…()«»–-]+$/g;
const tokens = (vn: string) =>
  vn
    .split(/\s+/)
    .map((t) => t.replace(PUNCT, ''))
    .filter(Boolean);

interface Index {
  /** Silbenfolge → Wort (bei Gleichstand das früher eingeführte). */
  byKey: Map<string, Word>;
  longest: number;
}

const indexes = new WeakMap<Content, Index>();
function indexOf(c: Content): Index {
  let ix = indexes.get(c);
  if (!ix) {
    const byKey = new Map<string, Word>();
    let longest = 1;
    for (const w of c.words) {
      const k = tokens(w.vn).map(key).join(' ');
      if (!k) continue;
      const prev = byKey.get(k);
      if (!prev || w.stage < prev.stage) byKey.set(k, w);
      longest = Math.max(longest, k.split(' ').length);
    }
    indexes.set(c, (ix = { byKey, longest }));
  }
  return ix;
}

const contextOf = (s: Sentence, c: Content): SentenceContext | undefined => (s.ctx ? c.contexts.find((x) => x.id === s.ctx) : undefined);

/**
 * Teile eines Satzes in Lesereihenfolge. Zuerst werden die Vokabeln des Satzes (`words`) an ihren Stellen gesucht,
 * dann füllt der übrige Wortschatz die Lücken (längstes Wort zuerst).
 */
export function glossSentence(s: Sentence, c: Content = allContent): GlossPart[] {
  const ix = indexOf(c);
  const toks = tokens(s.vn);
  const keys = toks.map(key);
  const taken: (Word | null)[] = keys.map(() => null);
  const span: number[] = keys.map(() => 0);
  const place = (w: Word, at: number, n: number) => {
    taken[at] = w;
    span[at] = n;
    for (let k = 1; k < n; k++) span[at + k] = -1;
  };
  const free = (at: number, n: number) => at + n <= keys.length && span.slice(at, at + n).every((v) => v === 0);

  const words = new Map(c.words.map((w) => [w.id, w]));
  for (const id of s.words) {
    const w = words.get(id);
    if (!w) continue;
    const parts = tokens(w.vn).map(key);
    for (let at = 0; at + parts.length <= keys.length; at++) {
      if (free(at, parts.length) && parts.every((p, k) => keys[at + k] === p)) {
        place(w, at, parts.length);
        break;
      }
    }
  }
  for (let at = 0; at < keys.length; at++) {
    if (span[at] !== 0) continue;
    for (let n = Math.min(ix.longest, keys.length - at); n >= 1; n--) {
      const w = free(at, n) ? ix.byKey.get(keys.slice(at, at + n).join(' ')) : undefined;
      if (w) {
        place(w, at, n);
        break;
      }
    }
  }

  const ctx = contextOf(s, c);
  const out: GlossPart[] = [];
  for (let at = 0; at < keys.length; at++) {
    if (span[at] === -1) continue;
    const w = taken[at];
    if (!w) {
      out.push({ text: toks[at]! });
      continue;
    }
    const part: GlossPart = { text: toks.slice(at, at + span[at]!).join(' '), word: w };
    if (ctx?.self === w.id) part.role = 'self';
    else if (ctx?.addr.includes(w.id)) part.role = 'addr';
    out.push(part);
  }
  return out;
}

/** Kurze Erklärung unter dem Wort: im Satz-Kontext „ich“/„du“, sonst die Übersetzung. */
export const glossText = (p: GlossPart): string => (p.role === 'self' ? 'ich' : p.role === 'addr' ? 'du' : (p.word?.de ?? ''));

/** Wer spricht mit wem (Kontext-Label), wenn das Wort im Satz „ich“ oder „du“ ist. */
export function roleNote(s: Sentence, p: GlossPart, c: Content = allContent): string | null {
  const ctx = contextOf(s, c);
  if (!ctx || !p.role) return null;
  return `${p.role === 'self' ? '„ich“' : '„du“'} – du sprichst ${ctx.label}`;
}

const glossCache = new WeakMap<Content, Map<SentenceId, GlossPart[]>>();
function glossed(s: Sentence, c: Content): GlossPart[] {
  let m = glossCache.get(c);
  if (!m) glossCache.set(c, (m = new Map()));
  let g = m.get(s.id);
  if (!g) m.set(s.id, (g = glossSentence(s, c)));
  return g;
}

/** Sätze, in denen das Wort vorkommt (früh eingeführte zuerst), ohne `except`. */
export function sentencesWith(id: WordId, c: Content = allContent, except?: SentenceId, limit = 3): Sentence[] {
  return c.sentences
    .filter((s) => s.id !== except && glossed(s, c).some((p) => p.word?.id === id))
    .sort((a, b) => (a.stage < b.stage ? -1 : a.stage > b.stage ? 1 : 0))
    .slice(0, limit);
}

/** Ton jeder Silbe (aus der Schreibung abgeleitet) und der Vokal, der ihn trägt – ohne Tonzeichen, das zeichnet die Ansicht. */
export interface SyllableTone {
  text: string;
  tone: Tone;
  /** Tonträger ohne Tonzeichen (Vokalzeichen bleiben); nacktes i als punktloses ı, wenn ein Ton darauf sitzt. */
  vowel: string;
  /** Vokal mit Zirkumflex oder Breve: das Tonzeichen sitzt höher. */
  lift: boolean;
}
export const syllableTones = (vn: string): SyllableTone[] => {
  const syl = tokens(vn);
  const tones = tonesOf(syl.join(' '));
  return syl.map((text, i) => {
    const tone = tones[i] ?? 'ngang';
    const g = glyphs(text);
    const carrier = (tone === 'ngang' ? undefined : g.find((x) => x.tone !== 'ngang')) ?? g.find((x) => /[aăâeêioôơuưy]/i.test(x.bare)) ?? g[0];
    const bare = carrier?.bare ?? text;
    return { text, tone, vowel: tone !== 'ngang' && bare === 'i' ? 'ı' : bare, lift: /[âêôă]/i.test(bare) };
  });
};

/** Vietnamesischer Name des Tons und sein Zeichen in der Schrift. */
export const TONE_LABEL: Record<Tone, { name: string; mark: string }> = {
  ngang: { name: 'ngang', mark: 'ohne Zeichen' },
  huyen: { name: 'huyền', mark: 'Strich fällt nach links' },
  sac: { name: 'sắc', mark: 'Strich steigt nach rechts' },
  hoi: { name: 'hỏi', mark: 'Häkchen darüber' },
  nga: { name: 'ngã', mark: 'Welle darüber' },
  nang: { name: 'nặng', mark: 'Punkt darunter' },
};
