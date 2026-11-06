/**
 * Töne des Vietnamesischen für den Ton-Ninja: Silben zerlegen, Ton erkennen, Ton setzen.
 * Reine Funktionen auf Zeichenketten (Unicode NFD: Grundbuchstabe + Vokalzeichen + Tonzeichen).
 */

export type Tone = 'ngang' | 'huyen' | 'sac' | 'nga' | 'hoi' | 'nang';

/** Kombinierende Tonzeichen (ngang hat keins). */
const TONE_MARK: Record<Tone, string> = {
  ngang: '',
  huyen: '̀',
  sac: '́',
  nga: '̃',
  hoi: '̉',
  nang: '̣',
};
export const TONES = Object.keys(TONE_MARK) as Tone[];
const TONE_BY_MARK = new Map<string, Tone>(TONES.filter((t) => TONE_MARK[t]).map((t) => [TONE_MARK[t], t]));
/** Vokalzeichen (Zirkumflex â ê ô, Breve ă, Horn ơ ư) – bleiben beim Tonwechsel erhalten. */
const VOWEL_MARK = /[̛̂̆]/;
const isCombining = (ch: string) => ch >= '̀' && ch <= 'ͯ';

/** Ein Buchstabe mit seinen Vokalzeichen (NFC) und seinem Ton. */
interface Letter {
  text: string;
  tone: Tone;
}

function parse(syllable: string): Letter[] {
  const out: Letter[] = [];
  for (const ch of syllable.normalize('NFD')) {
    const last = out[out.length - 1];
    if (isCombining(ch) && last) {
      const tone = TONE_BY_MARK.get(ch);
      if (tone) last.tone = tone;
      else last.text += ch;
    } else {
      out.push({ text: ch, tone: 'ngang' });
    }
  }
  return out.map((l) => ({ text: l.text.normalize('NFC'), tone: l.tone }));
}

const build = (letters: Letter[]) => letters.map((l) => (l.text.normalize('NFD') + TONE_MARK[l.tone]).normalize('NFC')).join('');
/** Kleingeschriebener Grundbuchstabe ohne Zeichen (đ bleibt đ). */
const base = (l: Letter) => l.text.normalize('NFD')[0]!.toLowerCase();
const isVowelLetter = (l: Letter) => 'aeiouy'.includes(base(l));

/** Vokalkern [von, bis): „u“ nach q und „i“ nach g vor einem Vokal sind Teil des Anlauts. */
function nucleus(letters: Letter[]): [number, number] | null {
  const vowel = letters.map((l, i) => {
    if (!isVowelLetter(l)) return false;
    const prev = letters[i - 1] && base(letters[i - 1]!);
    const next = letters[i + 1];
    if (base(l) === 'u' && prev === 'q') return false;
    if (base(l) === 'i' && prev === 'g' && next && isVowelLetter(next)) return false;
    return true;
  });
  const from = vowel.indexOf(true);
  if (from < 0) return null;
  let to = from;
  while (vowel[to]) to++;
  return [from, to];
}

const syllables = (vn: string) => vn.trim().split(/\s+/).filter(Boolean);

/** Auslaut p, t, c, ch (Stoppsilbe): nur sắc und nặng. */
function isStop(letters: Letter[]): boolean {
  const core = nucleus(letters);
  if (!core) return false;
  return ['p', 't', 'c', 'ch'].includes(letters.slice(core[1]).map(base).join(''));
}

const allowedTones = (letters: Letter[]): Tone[] => (isStop(letters) ? ['sac', 'nang'] : TONES);

const toneOf = (letters: Letter[]): Tone => letters.find((l) => l.tone !== 'ngang')?.tone ?? 'ngang';

/** Ton je Silbe. */
export const tonesOf = (vn: string): Tone[] => syllables(vn).map((s) => toneOf(parse(s)));

/** Grundform: ohne Tonzeichen, klein, Silben durch ein Leerzeichen getrennt. */
export const baseForm = (vn: string): string =>
  syllables(vn)
    .map((s) => build(parse(s).map((l) => ({ ...l, tone: 'ngang' as Tone }))).toLowerCase())
    .join(' ');

/** Silbe mit anderem Ton. Hatte sie ein Tonzeichen, bleibt es auf demselben Vokal. Null, wenn sie keinen Vokal hat. */
function withTone(letters: Letter[], tone: Tone): Letter[] | null {
  const core = nucleus(letters);
  if (!core) return null;
  let at = letters.findIndex((l) => l.tone !== 'ngang');
  if (at < 0) {
    const [from, to] = core;
    const marked = letters.map((l, i) => (VOWEL_MARK.test(l.text.normalize('NFD')) && i >= from && i < to ? i : -1)).filter((i) => i >= 0);
    if (marked.length > 0) at = marked[marked.length - 1]!;
    else if (to < letters.length) at = to - 1;
    else if (to - from === 3) at = from + 1;
    else at = from;
  }
  return letters.map((l, i) => ({ text: l.text, tone: i === at ? tone : 'ngang' }));
}

export interface ToneVariant {
  text: string;
  tones: Tone[];
}

/** Alle Schreibweisen, die sich vom Wort in genau einer Silbe im Ton unterscheiden (Stoppsilben nur mit sắc/nặng). */
export function toneVariants(vn: string): ToneVariant[] {
  const parts = syllables(vn).map(parse);
  const tones = parts.map(toneOf);
  const out: ToneVariant[] = [];
  parts.forEach((letters, i) => {
    for (const tone of allowedTones(letters)) {
      if (tone === tones[i]) continue;
      const changed = withTone(letters, tone);
      if (!changed) continue;
      const text = parts.map((p, k) => build(k === i ? changed : p)).join(' ');
      out.push({ text, tones: tones.map((t, k) => (k === i ? tone : t)) });
    }
  });
  return out;
}

/** Erlaubt eine Silbenfolge diese Töne (Stoppsilben nur sắc/nặng)? Für Tests. */
export function tonesAllowed(vn: string): boolean {
  return syllables(vn).every((s) => {
    const letters = parse(s);
    return allowedTones(letters).includes(toneOf(letters));
  });
}

/** Ein Buchstabe für „Lebendige Wörter“: vollständig, ohne Tonzeichen (Vokalzeichen bleiben) und sein Ton. */
export interface Glyph {
  full: string;
  bare: string;
  tone: Tone;
}

/** Jeder Buchstabe einzeln, Leerzeichen und Satzzeichen bleiben erhalten: erst ohne Ton zeigen, dann fällt der Ton. */
export const glyphs = (vn: string): Glyph[] => parse(vn).map((l) => ({ full: build([l]), bare: l.text, tone: l.tone }));
