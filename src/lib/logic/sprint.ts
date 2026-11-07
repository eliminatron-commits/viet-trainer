import { content } from '../../content';
import type { Word, WordId } from '../../content/types';
import type { DateKey, SaveState, SprintRecord } from '../storage/state';
import { weekOf } from './challenges';
import { learnedKeys, quizTask, shuffle, type Rng, type Task } from './session';

/**
 * Roller-Sprint: Zeitrennen durch Hà Nội. Ziel nach SPRINT_GOAL richtigen Antworten; gemessen wird nur die Zeit beim
 * Antworten (nicht die Rückmeldung danach), jeder Fehler kostet SPRINT_PENALTY. Schnelle Ein-Tipp-Aufgaben aus
 * gelernten Wörtern (Vietnamesisch → Deutsch und umgekehrt). Bestzeit gesamt und je Woche (ab Montag).
 */

export const SPRINT_GOAL = 12;
export const SPRINT_PENALTY = 3000;
/** So viele gelernte Wörter braucht der Sprint – sonst kämen dieselben Wörter zu schnell wieder. */
export const SPRINT_MIN_WORDS = 8;

const wordById = new Map(content.words.map((w) => [w.id, w]));

/** Gelernte echte Wörter (Partikel nicht: ihr „de“ ist eine Erklärung, zu lang für schnelles Lesen). */
export const sprintWords = (save: SaveState): Word[] =>
  learnedKeys(save).flatMap((k) => {
    const w = wordById.get(k as WordId);
    return w && w.kind === 'word' ? [w] : [];
  });

export const sprintReady = (save: SaveState) => sprintWords(save).length >= SPRINT_MIN_WORDS;

/**
 * Aufgaben für den Sprint: jedes gelernte Wort einmal je Durchgang (gemischt), abwechselnd zufällig Vietnamesisch →
 * Deutsch oder umgekehrt; nie dasselbe Wort direkt hintereinander, auch nicht über die Grenze zweier Durchgänge.
 */
export function sprintTasks(save: SaveState, count: number, rng: Rng = Math.random, after?: WordId): Task[] {
  const words = sprintWords(save);
  if (words.length === 0) return [];
  const tasks: Task[] = [];
  let last = after;
  while (tasks.length < count) {
    const round = shuffle(words, rng);
    if (round.length > 1 && round[0]!.id === last) round.push(round.shift()!);
    for (const w of round) {
      if (tasks.length === count) break;
      tasks.push(quizTask(w.id, rng, rng() < 0.5 ? 'vn2de' : 'de2vn'));
      last = w.id;
    }
  }
  return tasks;
}

/** Zeit einer Fahrt: Antwortzeit plus Strafzeit für Fehler (ms). */
export const raceTime = (answerMs: number, mistakes: number) => Math.round(answerMs) + mistakes * SPRINT_PENALTY;

/** Bestzeit dieser Woche (null, wenn diese Woche noch nicht gefahren). */
export const weekBest = (rec: SprintRecord, today: DateKey) => (rec.week === weekOf(today) ? rec.weekBest : null);

/** Fahrt eintragen: Bestzeit gesamt und je Woche. Gibt zurück, was neu ist. */
export function recordRun(rec: SprintRecord, ms: number, today: DateKey): { first: boolean; best: boolean; week: boolean } {
  const wk = weekOf(today);
  if (rec.week !== wk) {
    rec.week = wk;
    rec.weekBest = null;
  }
  const first = rec.runs === 0;
  const best = rec.best === null || ms < rec.best;
  const week = rec.weekBest === null || ms < rec.weekBest;
  if (best) rec.best = ms;
  if (week) rec.weekBest = ms;
  rec.runs++;
  return { first, best, week };
}

/** Zeit für die Anzeige: „42,3 s“ bzw. „1:02,4“ (Zehntel abgerundet, damit die laufende Uhr nie vorgreift). */
export function formatTime(ms: number): string {
  const tenths = Math.floor(Math.max(0, ms) / 100);
  const s = Math.floor(tenths / 10);
  const t = tenths % 10;
  if (s < 60) return `${s},${t} s`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')},${t}`;
}
