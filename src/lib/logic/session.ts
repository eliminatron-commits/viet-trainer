import { content } from '../../content';
import type { ItemId, Role, Sentence, Stage, Word, WordId } from '../../content/types';
import type { DateKey, ProgressKey, RoleKey, SaveState } from '../storage/state';
import { coreKeys, isSentenceFree, roleKeys, stageRoles, stageSentences, stageWords } from './path';
import { isDue } from './srs';

/** Zusammenstellung von Etappen-Sessions, Bosskämpfen und Training aus Inhalt + Spielstand. */

export type Rng = () => number;
export type ChoiceMode = 'vn2de' | 'de2vn' | 'listen';
export type Item = Word | Sentence;

export type Task =
  | { kind: 'intro'; key: WordId; word: Word }
  | { kind: 'choice'; key: ItemId; mode: ChoiceMode; item: Item; options: Item[] }
  | { kind: 'role'; key: RoleKey; mode: 'self' | 'addr'; role: Role; answer: Word; options: Word[] };

/** Quiz-Aufgaben je Session; Vorstellkarten neuer Wörter kommen hinzu. */
export const SESSION_SIZE = 12;
export const NEW_PER_SESSION = 4;
export const REVIEWS_PER_SESSION = 3;
export const BOSS_SIZE = 10;
export const BOSS_LIVES = 3;
export const TRAINING_BATCH = 12;

const MODES: ChoiceMode[] = ['vn2de', 'de2vn', 'listen'];
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

/** Richtige Options-ID einer Aufgabe (null bei Vorstellkarten). */
export function answerOf(task: Task): string | null {
  if (task.kind === 'choice') return task.item.id;
  if (task.kind === 'role') return task.answer.id;
  return null;
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

/** Quiz-Aufgabe zu einer Einheit; ohne Modus wird er zufällig gewählt. */
export function quizTask(key: ProgressKey, rng: Rng, mode?: ChoiceMode): Task {
  if (key.includes(':')) {
    const { role, mode: rm } = roleOf(key as RoleKey)!;
    const answer = roleAnswer(role, rm);
    return { kind: 'role', key: key as RoleKey, mode: rm, role, answer, options: roleOptions(role, rm, answer, rng) };
  }
  const item = (wordById.get(key as WordId) ?? sentenceById.get(key as Sentence['id']))!;
  const m = mode ?? pick(MODES, rng);
  return { kind: 'choice', key: item.id, mode: m, item, options: choiceOptions(item, m, rng) };
}

/** 0 = noch nie richtig, sonst die Box – kleiner heißt schwächer. */
const weakness = (save: SaveState, key: ProgressKey) => {
  const p = save.items[key];
  return !p || p.right === 0 ? 0 : p.box;
};

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
 * - Rest: Übung der Etappe (gesehene Wörter, freie Sätze, Rollen), schwächste zuerst.
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

  const mixed = shuffle([...reviews, ...practice], rng).map((k) => quizTask(k, rng));
  const tasks: Task[] = [];
  fresh.forEach((w, i) => {
    tasks.push({ kind: 'intro', key: w.id, word: w }, quizTask(w.id, rng, 'vn2de'));
    if (mixed[i]) tasks.push(mixed[i]);
  });
  tasks.push(...mixed.slice(fresh.length));
  tasks.push(...shuffle(fresh, rng).map((w) => quizTask(w.id, rng, pick(['de2vn', 'listen'] as const, rng))));
  return spread(tasks);
}

/** Bosskampf: gemischter Test über alles Gelernte der Etappe, BOSS_SIZE Aufgaben, BOSS_LIVES Leben. */
export function buildBossSession(stage: Stage, save: SaveState, rng: Rng = Math.random): Task[] {
  const keys = [
    ...coreKeys(stage.id),
    ...stageSentences(stage.id)
      .filter((s) => isSentenceFree(save, s))
      .map((s) => s.id),
  ];
  const chosen: ProgressKey[] = [];
  while (chosen.length < BOSS_SIZE) chosen.push(...shuffle(keys, rng));
  return spread(chosen.slice(0, BOSS_SIZE).map((k) => quizTask(k, rng)));
}

/** Alles mindestens einmal richtig Beantwortete; optional nur Verben. */
export function learnedKeys(save: SaveState, verbsOnly = false): ProgressKey[] {
  return (Object.keys(save.items) as ProgressKey[]).filter((k) => {
    if (!isKnownKey(k) || (save.items[k]?.right ?? 0) === 0) return false;
    return !verbsOnly || wordById.get(k as WordId)?.verb === true;
  });
}

/** Ein Block des endlosen Trainings: fällige zuerst, dann die schwächsten. Leer, solange nichts gelernt ist. */
export function buildTrainingBatch(
  save: SaveState,
  today: DateKey,
  verbsOnly = false,
  rng: Rng = Math.random,
): Task[] {
  const keys = learnedKeys(save, verbsOnly);
  if (keys.length === 0) return [];
  const rank = (k: ProgressKey) => (isDue(save.items[k]!, today) ? 0 : 10) + weakness(save, k);
  const ordered = shuffle(keys, rng).sort((a, b) => rank(a) - rank(b));
  const chosen: ProgressKey[] = [];
  while (chosen.length < TRAINING_BATCH) chosen.push(...(chosen.length === 0 ? ordered : shuffle(keys, rng)));
  return spread(chosen.slice(0, TRAINING_BATCH).map((k) => quizTask(k, rng)));
}
