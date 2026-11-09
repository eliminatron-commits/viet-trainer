import { content } from '../../content';
import type { ItemId, Role, Sentence, Stage, Word, WordId } from '../../content/types';
import type { DateKey, ProgressKey, RoleKey, SaveState } from '../storage/state';
import { coreKeys, isSentenceFree, roleKeys, stageRoles, stageSentences, stageWords } from './path';
import { isDue } from './srs';
import { baseForm, toneVariants, tonesAllowed, tonesOf } from './tones';

/** Zusammenstellung von Etappen-Sessions, Bosskämpfen und Training aus Inhalt + Spielstand. */

export type Rng = () => number;
export type ChoiceMode = 'vn2de' | 'de2vn' | 'listen';
/** Alle Quiz-Arten, die quizTask erzeugen kann. */
export type QuizMode = ChoiceMode | 'tone' | 'twins' | 'build' | 'dictation' | 'gap';
/** Training: gemischt oder nur ein Spielmodus. */
export type TrainingFocus = 'mixed' | 'pairs' | 'gap' | 'build' | 'dictation' | 'tone' | 'twins';
export type Item = Word | Sentence;

/** Kachel im Satzbau; `id` ist je Aufgabe eindeutig (Zielkacheln t0…, Ablenker x0…). */
export interface Tile {
  id: string;
  text: string;
}
/** Option im Ton-Ninja: die richtige hat die Wort-ID, Ablenker die ihres echten Worts bzw. `<wort>~<n>`. */
export interface ToneOption {
  id: string;
  vn: string;
}

export type Task =
  | { kind: 'intro'; key: WordId; word: Word }
  | { kind: 'choice'; key: ItemId; mode: ChoiceMode; item: Item; options: Item[] }
  | { kind: 'role'; key: RoleKey; mode: 'self' | 'addr'; role: Role; answer: Word; options: Word[] }
  | { kind: 'pairs'; key: WordId; words: Word[]; seconds: number }
  | {
      kind: 'build';
      key: Sentence['id'];
      mode: 'build' | 'dictation';
      item: Sentence;
      /** Zielkacheln und Ablenker, gemischt. */
      tiles: Tile[];
      /** IDs der Zielkacheln in der richtigen Reihenfolge. */
      target: string[];
      /** Satzzeichen am Ende des Satzes (nicht auf Kacheln). */
      closing: string;
    }
  | { kind: 'tone'; key: WordId; word: Word; options: ToneOption[] }
  /** Ton-Zwillinge: das Wort hören, seine Bedeutung unter den Wörtern wählen, die bis auf den Ton gleich klingen. */
  | { kind: 'twins'; key: WordId; word: Word; options: Word[] }
  | {
      kind: 'gap';
      key: Sentence['id'];
      item: Sentence;
      /** das fehlende Wort (richtige Option) */
      answer: Word;
      /** Antwort und Ablenker, gemischt */
      options: Word[];
      /** Satz vor der Lücke, die Lücke (Schreibung wie im Satz) und danach – zusammen genau der Satz. */
      before: string;
      fill: string;
      after: string;
    };

/** Quiz-Aufgaben je Session; Vorstellkarten neuer Wörter kommen hinzu. */
export const SESSION_SIZE = 12;
export const NEW_PER_SESSION = 4;
export const REVIEWS_PER_SESSION = 3;
export const BOSS_SIZE = 10;
export const BOSS_LIVES = 3;
export const TRAINING_BATCH = 12;
export const PAIR_COUNT = 5;
export const PAIRS_SECONDS = 40;
/** Aufgaben je Trainingsblock, wenn nur ein Modus gespielt wird. */
export const FOCUS_BATCH: Record<Exclude<TrainingFocus, 'mixed'>, number> = { pairs: 4, gap: 10, build: 8, dictation: 8, tone: 12, twins: 8 };
const DISTRACTOR_TILES = 2;
const MAX_TONE_DISTRACTORS = 3;
const BUILD_TILES = { min: 2, max: 10 };
const MAX_PAIR_DE = 28;
const GAP_DISTRACTORS = 3;
const TWIN_DISTRACTORS = 3;

/**
 * Gewichte der zufälligen Modi (Wörter ca. 3:3:2:2, bei gelerntem Ton-Zwilling dazu 2 Ton-Zwillinge; Sätze ca. 2:2:2:3:2,
 * bei gelernten Sätzen dazu 2 Lückensatz).
 */
const WORD_MODES: [QuizMode, number][] = [['vn2de', 3], ['de2vn', 3], ['listen', 2], ['tone', 2], ['twins', 2]];
const SENTENCE_MODES: [QuizMode, number][] = [['vn2de', 2], ['de2vn', 2], ['listen', 2], ['build', 3], ['dictation', 2], ['gap', 2]];
const wordById = new Map(content.words.map((w) => [w.id, w]));
const sentenceById = new Map(content.sentences.map((s) => [s.id, s]));
const roleById = new Map(content.roles.map((r) => [r.id, r]));
const stagePos = new Map(content.stages.map((s, i) => [s.id, i]));

export function shuffle<T>(list: readonly T[], rng: Rng): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const pick = <T>(list: readonly T[], rng: Rng): T => list[Math.floor(rng() * list.length)]!;

/**
 * Lösung einer Aufgabe (null bei Vorstellkarten): Options-ID bei Auswahl, Rolle, Ton-Ninja, Ton-Zwillingen und Lückensatz;
 * Satzbau/Diktat = Kachel-IDs der Zielfolge, Paare = Wort-IDs, jeweils durch Leerzeichen getrennt.
 */
export function answerOf(task: Task): string | null {
  if (task.kind === 'choice') return task.item.id;
  if (task.kind === 'role') return task.answer.id;
  if (task.kind === 'tone' || task.kind === 'twins') return task.word.id;
  if (task.kind === 'gap') return task.answer.id;
  if (task.kind === 'build') return task.target.join(' ');
  if (task.kind === 'pairs') return task.words.map((w) => w.id).join(' ');
  return null;
}

/** Satzbau/Diktat: ergeben die gelegten Kacheln (IDs, in Reihenfolge) die Zielfolge? Vergleich der Texte ohne Groß/Klein. */
export function buildCorrect(task: Extract<Task, { kind: 'build' }>, placed: readonly string[]): boolean {
  const text = (id: string) => task.tiles.find((t) => t.id === id)?.text.toLowerCase();
  const want = task.target.map(text);
  return placed.length === want.length && placed.every((id, i) => text(id) === want[i]);
}

/** Text, den eine Option im jeweiligen Modus zeigt. */
export const optionText = (item: Item, mode: ChoiceMode) => (mode === 'de2vn' ? item.vn : item.de);

function roleOf(key: RoleKey): { role: Role; mode: 'self' | 'addr' } | undefined {
  const [id, mode] = key.split(':') as [string, 'self' | 'addr'];
  const role = roleById.get(id);
  return role && (mode === 'self' || role.addr) ? { role, mode } : undefined;
}

/** Existiert die Einheit (noch) im Inhalt? Schützt vor veralteten Schlüsseln im Spielstand. */
export function isKnownKey(key: string): key is ProgressKey {
  if (key.includes(':')) return roleOf(key as RoleKey) !== undefined;
  return wordById.has(key as WordId) || sentenceById.has(key as Sentence['id']);
}

const roleAnswer = (role: Role, mode: 'self' | 'addr') => wordById.get(mode === 'self' ? role.self : role.addr!)!;

/**
 * 3 Ablenker: bevorzugt aus derselben Etappe, dann aus den nächstgelegenen (frühere vor späteren).
 * Ausgeschlossen ist alles, was ebenfalls richtig wäre (gleiche Übersetzung oder gleiches Wort)
 * oder doppelt angezeigt würde.
 */
function choiceOptions(item: Item, mode: ChoiceMode, rng: Rng): Item[] {
  const isWord = item.id.startsWith('w');
  const pool: Item[] = isWord ? content.words : content.sentences;
  const home = stagePos.get(item.stage)!;
  const distance = (c: Item) => {
    const pos = stagePos.get(c.stage)!;
    const kindPenalty = isWord && (c as Word).kind !== (item as Word).kind ? 100 : 0;
    return Math.abs(pos - home) * 2 + (pos > home ? 1 : 0) + kindPenalty;
  };
  const candidates = shuffle(
    pool.filter((c) => c.id !== item.id && c.de !== item.de && c.vn !== item.vn),
    rng,
  ).sort((a, b) => distance(a) - distance(b));
  const shown = new Set([optionText(item, mode)]);
  const picked: Item[] = [];
  for (const c of candidates) {
    if (picked.length === 3) break;
    const text = optionText(c, mode);
    if (shown.has(text)) continue;
    shown.add(text);
    picked.push(c);
  }
  return shuffle([item, ...picked], rng);
}

/** Ablenker für Rollen: Pronomen derselben Art (self/addr), bekannte Rollen zuerst, auf 4 aufgefüllt. */
function roleOptions(role: Role, mode: 'self' | 'addr', answer: Word, rng: Rng): Word[] {
  const home = stagePos.get(role.stage)!;
  const later = new Map<WordId, boolean>();
  for (const r of content.roles) {
    const id = mode === 'self' ? r.self : r.addr;
    if (!id || id === answer.id) continue;
    const isLater = stagePos.get(r.stage)! > home;
    later.set(id, (later.get(id) ?? true) && isLater);
  }
  const candidates = shuffle([...later.keys()], rng).sort((a, b) => Number(later.get(a)) - Number(later.get(b)));
  return shuffle([answer, ...candidates.slice(0, 3).map((id) => wordById.get(id)!)], rng);
}

function pickWeighted<T>(entries: readonly [T, number][], rng: Rng): T {
  let r = rng() * entries.reduce((sum, [, w]) => sum + w, 0);
  for (const [value, w] of entries) {
    r -= w;
    if (r < 0) return value;
  }
  return entries[entries.length - 1]![0];
}

// --- Ton-Ninja -------------------------------------------------------------------------------------------------

/** Echte Wörter nach Grundform (ohne Töne) – Ablenker mit gleicher Grundform und anderer Tonfolge. */
const wordsByBase = new Map<string, Word[]>();
for (const w of content.words) {
  const b = baseForm(w.vn);
  wordsByBase.set(b, [...(wordsByBase.get(b) ?? []), w]);
}

/**
 * Ton-Ninja: Schreibweisen, die sich nur im Ton unterscheiden. Zuerst echte Wörter mit gleicher Grundform,
 * dann erzeugte Varianten (je Variante eine Silbe mit anderem Ton). Null, wenn es keinen Ablenker gibt.
 */
export function toneTask(word: Word, rng: Rng): Task | null {
  const taken = new Set([tonesOf(word.vn).join()]);
  const options: ToneOption[] = [];
  for (const w of shuffle(wordsByBase.get(baseForm(word.vn)) ?? [], rng)) {
    const tones = tonesOf(w.vn).join();
    if (options.length === MAX_TONE_DISTRACTORS) break;
    if (w.id === word.id || taken.has(tones) || !tonesAllowed(w.vn)) continue;
    taken.add(tones);
    options.push({ id: w.id, vn: w.vn.trim() });
  }
  let n = 1;
  for (const v of shuffle(toneVariants(word.vn), rng)) {
    if (options.length === MAX_TONE_DISTRACTORS) break;
    const tones = v.tones.join();
    if (taken.has(tones)) continue;
    taken.add(tones);
    options.push({ id: `${word.id}~${n++}`, vn: v.text });
  }
  if (options.length === 0) return null;
  return { kind: 'tone', key: word.id, word, options: shuffle([{ id: word.id, vn: word.vn.trim() }, ...options], rng) };
}

// --- Satzbau und Diktat ----------------------------------------------------------------------------------------

const EDGE_PUNCT = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;
const syllablesOf = (vn: string) => vn.trim().split(/\s+/).filter(Boolean);

/**
 * Zielkacheln eines Satzes: mehrsilbige Wörter aus `sentence.words` (Silbenfolge ohne Groß/Klein im Satz gefunden)
 * bilden eine Kachel, sonst je Silbe eine; Schreibweise wie im Satz, ohne Satzzeichen.
 */
export function sentenceTiles(sentence: Sentence): { tiles: string[]; closing: string } {
  const tokens = syllablesOf(sentence.vn);
  return {
    tiles: tileSpans(sentence).map((t) => t.text),
    closing: (tokens[tokens.length - 1] ?? '').match(/[^\p{L}\p{N}]+$/u)?.[0] ?? '',
  };
}

/** Kacheln eines Satzes samt Lage: erstes und letztes Token (Index in den durch Leerzeichen getrennten Tokens). */
function tileSpans(sentence: Sentence): { text: string; from: number; to: number }[] {
  const tokens = syllablesOf(sentence.vn);
  // Token, die nur aus Satzzeichen bestehen (z. B. ein Gedankenstrich), sind keine Silben.
  const at = tokens.flatMap((t, i) => (t.replace(EDGE_PUNCT, '') ? [i] : []));
  const text = at.map((i) => tokens[i]!.replace(EDGE_PUNCT, ''));
  const lower = text.map((t) => t.toLowerCase());
  const multi = sentence.words
    .map((id) => wordById.get(id))
    .filter((w): w is Word => !!w)
    .map((w) => syllablesOf(w.vn.toLowerCase()))
    .filter((syl) => syl.length > 1)
    .sort((a, b) => b.length - a.length);
  const spans: { text: string; from: number; to: number }[] = [];
  for (let i = 0; i < text.length; ) {
    const hit = multi.find((syl) => syl.every((s, k) => lower[i + k] === s));
    const n = hit ? hit.length : 1;
    spans.push({ text: text.slice(i, i + n).join(' '), from: at[i]!, to: at[i + n - 1]! });
    i += n;
  }
  return spans;
}

/** Baubar: 2–10 Zielkacheln. (Ob der Satz frei ist, prüft der Aufrufer mit isSentenceFree.) */
export function isBuildable(sentence: Sentence): boolean {
  const n = sentenceTiles(sentence).tiles.length;
  return n >= BUILD_TILES.min && n <= BUILD_TILES.max;
}

/**
 * Anrede- und Pronomenwörter (aus Rollen und Satzkontexten). Als Ablenker im Satzbau verboten: Die deutsche Übersetzung
 * verliert, wen man anspricht („Chào bà.“ und „Chào ông.“ heißen beide „Hallo.“) – mit „ông“ als Ablenker wäre die
 * Aufgabe nicht eindeutig lösbar.
 */
export const ADDRESS_WORDS: ReadonlySet<WordId> = new Set([
  ...content.roles.flatMap((r) => (r.addr ? [r.self, r.addr] : [r.self])),
  ...content.contexts.flatMap((c) => [c.self, ...c.addr]),
]);

/** Bedeutungen eines Wortes: deutsche Übersetzung ohne Klammerzusatz, an „/“, „;“ und „,“ getrennt. */
export const meanings = (w: Word): string[] =>
  w.de
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .split(/[/;,]/)
    .map((m) => m.trim())
    .filter(Boolean);

/** Satzbau (mode 'build') bzw. Hör-Diktat (mode 'dictation') zu einem Satz; null, wenn er nicht baubar ist. */
export function buildTask(sentence: Sentence, mode: 'build' | 'dictation', rng: Rng, save?: SaveState): Task | null {
  if (!isBuildable(sentence)) return null;
  const { tiles: texts, closing } = sentenceTiles(sentence);
  const target: Tile[] = texts.map((text, i) => ({ id: `t${i}`, text }));
  // Ablenker: Wörter, die im Satz nicht vorkommen; gesehene und etappennahe zuerst.
  const inSentence = ` ${syllablesOf(sentence.vn)
    .map((t) => t.replace(EDGE_PUNCT, '').toLowerCase())
    .join(' ')} `;
  const home = stagePos.get(sentence.stage)!;
  const rank = (w: Word) => (save && !save.items[w.id] ? 1000 : 0) + Math.abs(stagePos.get(w.stage)! - home) * 2 + (stagePos.get(w.stage)! > home ? 1 : 0);
  const taken = new Set(texts.map((t) => t.toLowerCase()));
  // Synonyme der Satzwörter (chờ/đợi „warten“, bố/cha „Vater“) wären ebenso richtig – nie als Ablenker.
  const targetWords = content.words.filter((w) => sentence.words.includes(w.id) || taken.has(syllablesOf(w.vn).join(' ').toLowerCase()));
  const said = new Set(targetWords.flatMap(meanings));
  const distractors: Tile[] = [];
  for (const w of shuffle(content.words, rng).sort((a, b) => rank(a) - rank(b))) {
    if (distractors.length === DISTRACTOR_TILES) break;
    const text = syllablesOf(w.vn).join(' ');
    const lower = text.toLowerCase();
    if (w.kind !== 'word' || ADDRESS_WORDS.has(w.id) || taken.has(lower) || inSentence.includes(` ${lower} `)) continue;
    if (meanings(w).some((m) => said.has(m))) continue;
    taken.add(lower);
    distractors.push({ id: `x${distractors.length}`, text });
  }
  return {
    kind: 'build',
    key: sentence.id,
    mode,
    item: sentence,
    tiles: shuffle([...target, ...distractors], rng),
    target: target.map((t) => t.id),
    closing,
  };
}

// --- Lückensatz -----------------------------------------------------------------------------------------------

/** Kleinbuchstaben, Satzzeichen zu Leerzeichen, mit Rand-Leerzeichen – für Wortvergleiche in Übersetzungen. */
const plain = (text: string) => ` ${text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
const senseCache = new Map<WordId, string[]>();
/** Bedeutungen in Vergleichsform (ohne Satzzeichen). */
const senses = (w: Word): string[] => {
  let m = senseCache.get(w.id);
  if (!m) senseCache.set(w.id, (m = meanings(w).map((x) => plain(x).trim()).filter(Boolean)));
  return m;
};
/** Zwei Bedeutungen kollidieren: gleich, oder die eine steckt in der anderen („warten“ / „auf jdn. warten“). */
const clash = (a: string, b: string) => a === b || (a.length >= 4 && b.includes(a)) || (b.length >= 4 && a.includes(b));
/**
 * Steckt die Bedeutung (auch gebeugt) in der Übersetzung? Wörter ab 5 Buchstaben zählen schon mit ihrem Stamm
 * („warten“ → „wart…“ in „Ich warte auf dich.“).
 */
const saidIn = (de: string, sense: string) =>
  de.includes(` ${sense} `) || sense.split(' ').some((w) => w.length >= 5 && de.includes(` ${w.slice(0, -2)}`));

/**
 * Wortfelder: Wörter, die sich im Alltag oft vertreten, obwohl ihre Übersetzungen verschieden klingen („Em cần đi bệnh
 * viện“ – mit „phải“ hieße es genauso „Ich muss ins Krankenhaus“). Sie sind nie Ablenker füreinander – ein
 * Sicherheitsnetz zur Bedeutungsprüfung, kein Lerninhalt (wird nirgends angezeigt).
 */
const NEAR: readonly (readonly string[])[] = [
  ['thấy', 'xem', 'nhìn', 'trông'],
  ['nói', 'bảo', 'kể', 'khuyên'],
  ['đi', 'đến', 'tới', 'về', 'ra', 'vào', 'lên', 'xuống', 'qua', 'rời', 'chạy', 'trở'],
  ['lấy', 'mang', 'đưa', 'cầm', 'nhận', 'đón', 'chở', 'giữ', 'cho', 'gửi', 'mặc'],
  ['yêu', 'thương', 'thích'],
  ['biết', 'hiểu', 'quen', 'nhớ'],
  ['muốn', 'định', 'thích', 'mong', 'ước', 'thèm'],
  ['phải', 'cần', 'nên', 'được'],
  ['làm', 'nấu'],
  ['mở', 'bật'],
  ['đóng', 'tắt', 'khóa'],
  ['sống', 'ở'],
  ['gặp', 'thăm', 'đón'],
  ['hết', 'xong', 'thôi'],
  ['mua', 'đặt', 'thuê'],
  ['gọi', 'kêu', 'nhắn'],
  ['nghỉ', 'ngủ', 'nằm'],
  ['thử', 'cố'],
  ['rửa', 'tắm', 'dọn'],
  ['nghĩ', 'tin', 'đoán', 'chắc'],
  ['trộm', 'cướp'],
  ['sợ', 'lo'],
  ['rất', 'lắm', 'quá', 'nhiều', 'khá', 'hơi', 'thật'],
  ['đây', 'này', 'đó', 'kia'],
  ['và', 'với', 'cùng'],
  ['cơm', 'bữa', 'món'],
  ['không', 'đừng'],
  ['bây giờ', 'giờ', 'lúc', 'ngay', 'luôn'],
  ['nhưng', 'hay', 'hoặc'],
  ['vì', 'bởi', 'nên', 'để'],
  ['cũng', 'nữa', 'vẫn', 'còn', 'thêm', 'lại'],
  ['gì', 'sao', 'đâu', 'nào', 'bao nhiêu', 'ai'],
];
/** Gehören zwei Schreibungen (klein, Silben mit einem Leerzeichen) zu einem Wortfeld? */
export const nearWords = (a: string, b: string) => NEAR.some((g) => g.includes(a) && g.includes(b));

/**
 * Mögliche Lücken eines Satzes: Kacheln (wie im Satzbau), die genau ein Wort aus `sentence.words` sind und im Satz nur
 * einmal vorkommen. Keine Partikel (ihr „de“ ist eine Erklärung) und keine Anreden – wen man anspricht, verliert die
 * Übersetzung, die Lücke wäre nicht eindeutig. Je Lücke: Text davor, die Lücke (Schreibung wie im Satz), danach.
 */
export function gapSpots(sentence: Sentence): { word: Word; before: string; fill: string; after: string }[] {
  const tokens = syllablesOf(sentence.vn);
  const spans = tileSpans(sentence);
  if (spans.length < 2) return [];
  const count = new Map<string, number>();
  for (const t of spans) count.set(t.text.toLowerCase(), (count.get(t.text.toLowerCase()) ?? 0) + 1);
  const own = sentence.words.map((id) => wordById.get(id)).filter((w): w is Word => !!w);
  return spans.flatMap((t) => {
    const lower = t.text.toLowerCase();
    const word = own.find((w) => syllablesOf(w.vn.toLowerCase()).join(' ') === lower);
    if (!word || word.kind !== 'word' || ADDRESS_WORDS.has(word.id) || count.get(lower) !== 1) return [];
    const lead = tokens[t.from]!.match(/^[^\p{L}\p{N}]+/u)?.[0] ?? '';
    const trail = tokens[t.to]!.match(/[^\p{L}\p{N}]+$/u)?.[0] ?? '';
    // Satzzeichen mitten in einer mehrsilbigen Kachel gingen verloren – solche Stellen nicht als Lücke.
    if (lead + t.text + trail !== tokens.slice(t.from, t.to + 1).join(' ')) return [];
    const before = tokens.slice(0, t.from).join(' ') + (t.from > 0 ? ' ' : '') + lead;
    const after = trail + (t.to < tokens.length - 1 ? ' ' : '') + tokens.slice(t.to + 1).join(' ');
    return [{ word, before, fill: t.text, after }];
  });
}

/** Schreibung in Vergleichsform (klein, Silben mit einem Leerzeichen) – einmal vorab berechnet. */
const vnLower = new Map(content.words.map((w) => [w.id, syllablesOf(w.vn).join(' ').toLowerCase()]));
const lowerVn = (w: Word) => vnLower.get(w.id) ?? syllablesOf(w.vn).join(' ').toLowerCase();

/**
 * Darf ein Wort Ablenker für diese Lücke sein? Echte Wörter (keine Partikel, keine Anreden), die im Satz nicht
 * vorkommen und nie ebenso passen – keine Bedeutung gleich der des fehlenden Worts oder eines Satzworts, keine steckt
 * in der Übersetzung, kein Wort aus dem Wortfeld des fehlenden.
 */
function distractorTest(sentence: Sentence, answer: Word): (w: Word) => boolean {
  const tiles = sentenceTiles(sentence).tiles.map((t) => t.toLowerCase());
  const inSentence = ` ${tiles.join(' ')} `;
  const known = new Set(tiles);
  const said = content.words
    .filter((w) => w.id === answer.id || sentence.words.includes(w.id) || known.has(lowerVn(w)))
    .flatMap(senses);
  const de = plain(sentence.de);
  const gap = lowerVn(answer);
  return (w) => {
    const lower = lowerVn(w);
    if (w.kind !== 'word' || ADDRESS_WORDS.has(w.id) || lower === gap || inSentence.includes(` ${lower} `)) return false;
    if (nearWords(gap, lower)) return false;
    const own = senses(w);
    return own.length > 0 && !own.some((m) => said.some((x) => clash(m, x)) || saidIn(de, m));
  };
}

/** Ablenker für eine Lücke (siehe distractorTest), je Schreibung einer: gesehene Wörter, dann gleiche Wortart (Verb/kein Verb), dann etappennahe zuerst. */
function gapDistractors(sentence: Sentence, answer: Word, rng: Rng, save?: SaveState): Word[] {
  const fits = distractorTest(sentence, answer);
  const home = stagePos.get(sentence.stage)!;
  const rank = (w: Word) =>
    (save && !save.items[w.id] ? 1000 : 0) +
    (w.verb !== answer.verb ? 100 : 0) +
    Math.abs(stagePos.get(w.stage)! - home) * 2 +
    (stagePos.get(w.stage)! > home ? 1 : 0);
  const taken = new Set<string>();
  const picked: Word[] = [];
  for (const w of shuffle(content.words, rng).sort((a, b) => rank(a) - rank(b))) {
    if (picked.length === GAP_DISTRACTORS) break;
    const lower = lowerVn(w);
    if (taken.has(lower) || !fits(w)) continue;
    taken.add(lower);
    picked.push(w);
  }
  return picked;
}

/**
 * Lückensatz: ein Satz mit einer Lücke, das fehlende Wort aus vier Kacheln wählen. Die Lücke trifft das schwächste
 * Wort des Satzes (Gleichstand zufällig). Null, wenn der Satz keine eindeutige Lücke hat.
 */
export function gapTask(sentence: Sentence, rng: Rng, save?: SaveState): Task | null {
  const spots = shuffle(gapSpots(sentence), rng).sort((a, b) => (save ? weakness(save, a.word.id) - weakness(save, b.word.id) : 0));
  for (const spot of spots) {
    const distractors = gapDistractors(sentence, spot.word, rng, save);
    if (distractors.length < GAP_DISTRACTORS) continue;
    return {
      kind: 'gap',
      key: sentence.id,
      item: sentence,
      answer: spot.word,
      options: shuffle([spot.word, ...distractors], rng),
      before: spot.before,
      fill: spot.fill,
      after: spot.after,
    };
  }
  return null;
}

const gapCache = new Map<Sentence['id'], boolean>();
/** Hat der Satz eine eindeutige Lücke? (hängt nur vom Inhalt ab, darum zwischengespeichert) */
export function isGappable(sentence: Sentence): boolean {
  let ok = gapCache.get(sentence.id);
  if (ok === undefined) {
    // wie gapTask, aber ohne Mischen und Sortieren: es reicht, drei verschiedene passende Ablenker zu finden
    ok = gapSpots(sentence).some((spot) => {
      const fits = distractorTest(sentence, spot.word);
      const found = new Set<string>();
      for (const w of content.words) if (fits(w) && found.add(lowerVn(w)).size === GAP_DISTRACTORS) return true;
      return false;
    });
    gapCache.set(sentence.id, ok);
  }
  return ok;
}

// --- Ton-Zwillinge -------------------------------------------------------------------------------------------

const twinCache = new Map<WordId, Word[]>();
/**
 * Echte Ton-Zwillinge eines Worts: andere echte Wörter (keine Partikel) mit gleicher Grundform und anderer Tonfolge,
 * je Tonfolge eines, deren Bedeutung weder mit dem Wort noch mit einem anderen Zwilling kollidiert – sonst wäre die
 * Bedeutung nicht eindeutig zu wählen. Reihenfolge wie im Inhalt.
 */
export function twinsOf(word: Word): Word[] {
  let twins = twinCache.get(word.id);
  if (twins) return twins;
  twins = [];
  if (word.kind === 'word') {
    const tones = new Set([tonesOf(word.vn).join()]);
    const said = [...senses(word)];
    for (const w of wordsByBase.get(baseForm(word.vn)) ?? []) {
      const t = tonesOf(w.vn).join();
      if (w.kind !== 'word' || tones.has(t) || !tonesAllowed(w.vn)) continue;
      const own = senses(w);
      if (own.length === 0 || own.some((m) => said.some((x) => clash(m, x)))) continue;
      tones.add(t);
      said.push(...own);
      twins.push(w);
    }
  }
  twinCache.set(word.id, twins);
  return twins;
}

const isLearnedKey = (save: SaveState, key: ProgressKey) => (save.items[key]?.right ?? 0) > 0;

/** Hat das Wort einen gelernten Ton-Zwilling? Erst dann ist das Hören die Hürde, nicht nur die Bedeutung. */
export const hasLearnedTwin = (save: SaveState, word: Word) => twinsOf(word).some((w) => isLearnedKey(save, w.id));

/**
 * Ton-Zwillinge: das Wort hören und seine Bedeutung unter seinen Ton-Zwillingen wählen (bạn „Freund“, bán „verkaufen“,
 * bàn „Tisch“) – höchstens drei Zwillinge. Null, wenn das Wort keinen hat.
 */
export function twinsTask(word: Word, rng: Rng): Task | null {
  const twins = twinsOf(word);
  if (twins.length === 0) return null;
  return { kind: 'twins', key: word.id, word, options: shuffle([word, ...shuffle(twins, rng).slice(0, TWIN_DISTRACTORS)], rng) };
}

// --- Paare unter Zeitdruck -------------------------------------------------------------------------------------

/** Kachel-tauglich: kein Partikel (dessen „de“ ist eine Erklärung) und eine kurze Übersetzung. */
const pairable = (w: Word) => w.kind === 'word' && w.de.trim().length <= MAX_PAIR_DE;

/**
 * Paare-Aufgabe aus den ersten PAIR_COUNT Kandidaten mit paarweise verschiedenem vn und de
 * (getrimmt, ohne Groß/Klein). Null, wenn es nicht genug passende gibt.
 */
export function pairsTask(candidates: readonly Word[]): Task | null {
  const vn = new Set<string>();
  const de = new Set<string>();
  const words: Word[] = [];
  for (const w of candidates) {
    if (words.length === PAIR_COUNT) break;
    const v = w.vn.trim().toLowerCase();
    const d = w.de.trim().toLowerCase();
    if (!pairable(w) || vn.has(v) || de.has(d)) continue;
    vn.add(v);
    de.add(d);
    words.push(w);
  }
  return words.length === PAIR_COUNT ? { kind: 'pairs', key: words[0]!.id, words, seconds: PAIRS_SECONDS } : null;
}

const hasProgress = (save: SaveState, key: ProgressKey) => {
  const p = save.items[key];
  return !!p && (p.seen > 0 || p.right > 0);
};

/** Gesehene Wörter, schwächste zuerst (Gleichstand zufällig). */
const knownWords = (save: SaveState, rng: Rng): Word[] =>
  shuffle(content.words.filter((w) => hasProgress(save, w.id)), rng).sort((a, b) => weakness(save, a.id) - weakness(save, b.id));

/** Wörter zu Schlüsseln (Sätze und Rollen fallen weg). */
const wordsOfKeys = (keys: readonly string[]): Word[] => keys.flatMap((k) => wordById.get(k as WordId) ?? []);

// --- Quiz ------------------------------------------------------------------------------------------------------

/**
 * Quiz-Aufgabe zu einer Einheit; ohne Modus wird er zufällig gewählt (Wörter vn2de/de2vn/listen/tone/twins – Ton-Zwillinge
 * nur bei gelernten Wörtern mit gelerntem Zwilling; Sätze vn2de/de2vn/listen/build/dictation/gap – Satzbau und Diktat nur bei
 * baubaren, Lückensatz nur bei gelernten Sätzen). Mit `save`
 * stammen Satzbau-Ablenker bevorzugt aus gesehenen Wörtern.
 */
export function quizTask(key: ProgressKey, rng: Rng, mode?: QuizMode, save?: SaveState): Task {
  if (key.includes(':')) {
    const { role, mode: rm } = roleOf(key as RoleKey)!;
    const answer = roleAnswer(role, rm);
    return { kind: 'role', key: key as RoleKey, mode: rm, role, answer, options: roleOptions(role, rm, answer, rng) };
  }
  const item = (wordById.get(key as WordId) ?? sentenceById.get(key as Sentence['id']))!;
  const isWord = item.id.startsWith('w');
  const buildable = !isWord && isBuildable(item as Sentence) && (!save || isSentenceFree(save, item as Sentence));
  // Lückensatz nur bei schon gelernten Sätzen (ohne Spielstand nie).
  const gappable =
    !isWord && !!save && (save.items[item.id]?.right ?? 0) > 0 && isSentenceFree(save, item as Sentence) && isGappable(item as Sentence);
  // Ton-Zwillinge nur bei gelernten Wörtern mit gelerntem Zwilling (ohne Spielstand nie).
  const twinable = isWord && !!save && isLearnedKey(save, item.id) && hasLearnedTwin(save, item as Word);
  const entries = (isWord ? WORD_MODES : SENTENCE_MODES).filter(
    ([m]) => (buildable || (m !== 'build' && m !== 'dictation')) && (gappable || m !== 'gap') && (twinable || m !== 'twins'),
  );
  const m = mode ?? pickWeighted(entries, rng);
  if (m === 'tone' && isWord) {
    const t = toneTask(item as Word, rng);
    if (t) return t;
  } else if (m === 'twins' && isWord) {
    const t = twinsTask(item as Word, rng);
    if (t) return t;
  } else if ((m === 'build' || m === 'dictation') && !isWord) {
    const t = buildTask(item as Sentence, m, rng, save);
    if (t) return t;
  } else if (m === 'gap' && !isWord) {
    const t = gapTask(item as Sentence, rng, save);
    if (t) return t;
  }
  const choice: ChoiceMode = m === 'de2vn' || m === 'listen' ? m : 'vn2de';
  return { kind: 'choice', key: item.id, mode: choice, item, options: choiceOptions(item, choice, rng) };
}

/** 0 = noch nie richtig, sonst die Box – kleiner heißt schwächer. */
const weakness = (save: SaveState, key: ProgressKey) => {
  const p = save.items[key];
  return !p || p.right === 0 ? 0 : p.box;
};

/**
 * Ersetzt eine Aufgabe ab Index `from` (zufälliger Start, dann der Reihe nach) durch `extra`, möglichst dort,
 * wo kein Nachbar zur selben Einheit gehört – so bleibt die Regel von spread() erhalten.
 */
function replaceOne(tasks: Task[], extra: Task, from: number, rng: Rng): void {
  const span = tasks.length - from;
  const start = Math.floor(rng() * span);
  const at = Array.from({ length: span }, (_, i) => from + ((start + i) % span)).find(
    (p) => tasks[p - 1]?.key !== extra.key && tasks[p + 1]?.key !== extra.key,
  );
  tasks[at ?? from + start] = extra;
}

/** Keine zwei Quiz-Aufgaben zur selben Einheit direkt hintereinander (Vorstellkarte + Quiz ist gewollt). */
function spread(tasks: Task[]): Task[] {
  for (let i = 1; i < tasks.length; i++) {
    const prev = tasks[i - 1]!;
    if (tasks[i]!.key !== prev.key || prev.kind === 'intro') continue;
    const j = tasks.findIndex((t, k) => k > i && t.key !== prev.key && t.kind !== 'intro');
    if (j > 0) [tasks[i], tasks[j]] = [tasks[j]!, tasks[i]!];
  }
  return tasks;
}

/**
 * Session einer Etappe (~12 Quiz-Aufgaben):
 * - bis zu NEW_PER_SESSION neue Wörter: Vorstellkarte + Quiz, später ein zweites Quiz in anderem Modus,
 * - bis zu REVIEWS_PER_SESSION fällige Wiederholungen aus anderen Etappen,
 * - Rest: Übung der Etappe (gesehene Wörter, freie Sätze, Rollen), schwächste zuerst; eine Paare-Aufgabe
 *   ersetzt dabei zwei Übungsaufgaben, sobald genug gesehene Wörter da sind.
 */
export function buildStageSession(stage: Stage, save: SaveState, today: DateKey, rng: Rng = Math.random): Task[] {
  const words = stageWords(stage.id);
  const fresh = words.filter((w) => !save.items[w.id]).slice(0, NEW_PER_SESSION);
  const freshIds = new Set<string>(fresh.map((w) => w.id));
  const own = new Set<string>([
    ...words.map((w) => w.id),
    ...stageSentences(stage.id).map((s) => s.id),
    ...stageRoles(stage.id).flatMap(roleKeys),
  ]);

  const reviews = shuffle(
    Object.entries(save.items).filter(([k, p]) => !own.has(k) && isKnownKey(k) && isDue(p!, today)),
    rng,
  )
    .sort(([, a], [, b]) => a!.due.localeCompare(b!.due) || a!.box - b!.box)
    .slice(0, Math.min(REVIEWS_PER_SESSION, Math.max(0, SESSION_SIZE - 2 * fresh.length)))
    .map(([k]) => k as ProgressKey);

  const practicePool: ProgressKey[] = [
    ...words.filter((w) => save.items[w.id] && !freshIds.has(w.id)).map((w) => w.id),
    ...stageSentences(stage.id)
      .filter((s) => isSentenceFree(save, s))
      .map((s) => s.id),
    ...stageRoles(stage.id).flatMap((r) =>
      roleKeys(r).filter((k) => save.items[roleAnswer(r, roleOf(k)!.mode).id]),
    ),
  ];
  const practice = shuffle(practicePool, rng)
    .sort((a, b) => weakness(save, a) - weakness(save, b))
    .slice(0, Math.max(0, SESSION_SIZE - 2 * fresh.length - reviews.length));
  const pairs = practice.length >= 2 ? pairsTask(knownWords(save, rng)) : null;
  if (pairs) practice.splice(-2);

  const mixed = shuffle([...reviews, ...practice], rng).map((k) => quizTask(k, rng, undefined, save));
  if (pairs) mixed.splice(Math.floor(rng() * (mixed.length + 1)), 0, pairs);
  const tasks: Task[] = [];
  fresh.forEach((w, i) => {
    tasks.push({ kind: 'intro', key: w.id, word: w }, quizTask(w.id, rng, 'vn2de'));
    if (mixed[i]) tasks.push(mixed[i]);
  });
  tasks.push(...mixed.slice(fresh.length));
  tasks.push(...shuffle(fresh, rng).map((w) => quizTask(w.id, rng, pick(['de2vn', 'listen'] as const, rng))));
  return spread(tasks);
}

/** Bosskampf: gemischter Test über alles Gelernte der Etappe, BOSS_SIZE Aufgaben (eine davon Paare), BOSS_LIVES Leben. */
export function buildBossSession(stage: Stage, save: SaveState, rng: Rng = Math.random): Task[] {
  const keys = [
    ...coreKeys(stage.id),
    ...stageSentences(stage.id)
      .filter((s) => isSentenceFree(save, s))
      .map((s) => s.id),
  ];
  const chosen: ProgressKey[] = [];
  while (chosen.length < BOSS_SIZE) chosen.push(...shuffle(keys, rng));
  const tasks = spread(chosen.slice(0, BOSS_SIZE).map((k) => quizTask(k, rng, undefined, save)));
  // Eine Paare-Aufgabe: Wörter der Etappe zuerst, damit sie zum Kampf gehört.
  const core = new Set<string>(coreKeys(stage.id));
  const known = knownWords(save, rng).sort((a, b) => Number(core.has(b.id)) - Number(core.has(a.id)));
  const pairs = pairsTask(known);
  if (pairs && core.has(pairs.key)) replaceOne(tasks, pairs, 0, rng);
  return tasks;
}

/** Alles mindestens einmal richtig Beantwortete; optional nur Verben. */
export function learnedKeys(save: SaveState, verbsOnly = false): ProgressKey[] {
  return (Object.keys(save.items) as ProgressKey[]).filter((k) => {
    if (!isKnownKey(k) || (save.items[k]?.right ?? 0) === 0) return false;
    return !verbsOnly || wordById.get(k as WordId)?.verb === true;
  });
}

/** Gelernte, baubare Sätze (Satzbau und Diktat). */
const buildableLearned = (save: SaveState): Sentence[] =>
  learnedKeys(save).flatMap((k) => {
    const s = sentenceById.get(k as Sentence['id']);
    return s && isSentenceFree(save, s) && isBuildable(s) ? [s] : [];
  });

/** Gelernte, freie Sätze mit eindeutiger Lücke. */
const gapLearned = (save: SaveState): Sentence[] =>
  learnedKeys(save).flatMap((k) => {
    const s = sentenceById.get(k as Sentence['id']);
    return s && isSentenceFree(save, s) && isGappable(s) ? [s] : [];
  });

/** Gelernte Wörter, für die ein Ton-Ninja möglich ist. */
const toneLearned = (save: SaveState): Word[] =>
  wordsOfKeys(learnedKeys(save)).filter((w) => toneTask(w, () => 0) !== null);

/** Gelernte Wörter mit gelerntem Ton-Zwilling. */
const twinsLearned = (save: SaveState): Word[] => wordsOfKeys(learnedKeys(save)).filter((w) => hasLearnedTwin(save, w));

/** Einheiten eines Einzelmodus (außer Paaren): gelernt und für den Modus geeignet. */
const FOCUS_POOL: Record<Exclude<TrainingFocus, 'mixed' | 'pairs'>, (save: SaveState) => Item[]> = {
  tone: toneLearned,
  twins: twinsLearned,
  gap: gapLearned,
  build: buildableLearned,
  dictation: buildableLearned,
};

/** Wie viel für einen Trainingsmodus gelernt ist: `available` = der Modus lässt sich spielen, `count` = Einheiten dafür. */
export function focusInfo(save: SaveState, focus: TrainingFocus): { available: boolean; count: number } {
  const learned = learnedKeys(save);
  if (focus === 'mixed') return { available: learned.length > 0, count: learned.length };
  if (focus === 'pairs') {
    const words = wordsOfKeys(learned);
    const ok = pairsTask(words) !== null;
    return { available: ok, count: words.length };
  }
  const count = FOCUS_POOL[focus](save).length;
  return { available: count > 0, count };
}

/** Ein Block eines Einzelmodus-Trainings; leer, solange dafür zu wenig gelernt ist. */
function buildFocusBatch(
  save: SaveState,
  today: DateKey,
  focus: Exclude<TrainingFocus, 'mixed'>,
  rng: Rng,
): Task[] {
  const rank = (k: string) => (isDue(save.items[k as ProgressKey]!, today) ? 0 : 10) + weakness(save, k as ProgressKey);
  const order = <T extends { id: string }>(items: T[]) => shuffle(items, rng).sort((a, b) => rank(a.id) - rank(b.id));
  const size = FOCUS_BATCH[focus];
  const tasks: Task[] = [];

  if (focus === 'pairs') {
    // Jede Aufgabe nimmt die vorderen Wörter; sie rücken ans Ende, damit die nächste andere übt.
    let words = order(wordsOfKeys(learnedKeys(save)));
    while (tasks.length < size) {
      const t = pairsTask(words);
      if (!t || t.kind !== 'pairs') break;
      tasks.push(t);
      const used = new Set(t.words.map((w) => w.id));
      words = [...words.filter((w) => !used.has(w.id)), ...words.filter((w) => used.has(w.id))];
    }
    return tasks;
  }

  // In Durchgängen: jede Einheit einmal, dann neu geordnet (fällige und schwächste zuerst). So kommt bei kleinem Vorrat
  // keine Einheit öfter dran als die anderen, und zwei gleiche direkt hintereinander gibt es nur an der Grenze zweier
  // Durchgänge – die löst spread() auf.
  const pool = FOCUS_POOL[focus](save);
  let cycle: Item[] = [];
  let guard = 0;
  while (pool.length > 0 && tasks.length < size && guard++ < size * 3) {
    if (cycle.length === 0) cycle = order(pool);
    const item = cycle.shift()!;
    const t =
      focus === 'tone'
        ? toneTask(item as Word, rng)
        : focus === 'twins'
          ? twinsTask(item as Word, rng)
          : focus === 'gap'
            ? gapTask(item as Sentence, rng, save)
            : buildTask(item as Sentence, focus, rng, save);
    if (t) tasks.push(t);
  }
  return spread(tasks);
}

/** Gelernte Einheiten, die heute fällig sind („durstige Pflanzen“); optional nur Verben. */
export const thirstyKeys = (save: SaveState, today: DateKey, verbsOnly = false): ProgressKey[] =>
  learnedKeys(save, verbsOnly).filter((k) => isDue(save.items[k]!, today));

/**
 * Ein Block der Gießrunde: nur durstige Einheiten, jede einmal (älteste und schwächste zuerst), höchstens
 * TRAINING_BATCH. Jede Antwort plant die Einheit neu ein (richtig: später, falsch: morgen) – sie ist danach nicht mehr
 * durstig. So wird die Runde kürzer, bis nichts mehr fällig ist: dann ist der Block leer und die Runde zu Ende.
 */
export function buildWateringBatch(save: SaveState, today: DateKey, verbsOnly = false, rng: Rng = Math.random): Task[] {
  const keys = shuffle(thirstyKeys(save, today, verbsOnly), rng)
    .sort((a, b) => save.items[a]!.due.localeCompare(save.items[b]!.due) || weakness(save, a) - weakness(save, b))
    .slice(0, TRAINING_BATCH);
  return spread(keys.map((k) => quizTask(k, rng, undefined, save)));
}

/**
 * Ein Block des endlosen Trainings. Gemischt: fällige zuerst, dann die schwächsten, darunter eine Paare-Aufgabe
 * (nur Verben, wenn `verbsOnly`). Mit Fokus: ein Block nur aus diesem Modus. Leer, solange dafür nichts gelernt ist.
 */
export function buildTrainingBatch(
  save: SaveState,
  today: DateKey,
  verbsOnly = false,
  rng: Rng = Math.random,
  focus: TrainingFocus = 'mixed',
): Task[] {
  if (focus !== 'mixed') return buildFocusBatch(save, today, focus, rng);
  const keys = learnedKeys(save, verbsOnly);
  if (keys.length === 0) return [];
  const rank = (k: ProgressKey) => (isDue(save.items[k]!, today) ? 0 : 10) + weakness(save, k);
  const ordered = shuffle(keys, rng).sort((a, b) => rank(a) - rank(b));
  const chosen: ProgressKey[] = [];
  while (chosen.length < TRAINING_BATCH) chosen.push(...(chosen.length === 0 ? ordered : shuffle(keys, rng)));
  const tasks = spread(chosen.slice(0, TRAINING_BATCH).map((k) => quizTask(k, rng, undefined, save)));
  // Eine Paare-Aufgabe je Block, in der zweiten Hälfte (die fälligen Einheiten stehen vorn).
  const pairs = pairsTask(wordsOfKeys(ordered));
  if (pairs) replaceOne(tasks, pairs, Math.floor(tasks.length / 2), rng);
  return tasks;
}
