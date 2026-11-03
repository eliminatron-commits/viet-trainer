import type { DateKey, SaveState } from '../storage/state';
import { addDays } from './srs';

/** XP, Level, Tagesziel und Serie (Streak). */

export const XP_PER_CORRECT = 10;

/** Gesamt-XP, ab denen Level 1–10 beginnen; danach je Level +600. Frühe Level kommen schnell. */
const THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
const STEP = 600;

export function levelStart(level: number): number {
  if (level <= THRESHOLDS.length) return THRESHOLDS[level - 1]!;
  return THRESHOLDS[THRESHOLDS.length - 1]! + (level - THRESHOLDS.length) * STEP;
}

export function levelInfo(xp: number) {
  let level = 1;
  while (levelStart(level + 1) <= xp) level++;
  const start = levelStart(level);
  const span = levelStart(level + 1) - start;
  return { level, into: xp - start, span, progress: (xp - start) / span };
}

/** Neuer Tag ⇒ Tages-XP auf 0. */
export function rollDay(save: SaveState, today: DateKey): void {
  if (save.today.date !== today) save.today = { date: today, xp: 0 };
}

/** Serie, wie sie heute gilt: verfällt, wenn gestern das Tagesziel nicht erreicht wurde. */
export function currentStreak(save: SaveState, today: DateKey): number {
  const last = save.streak.lastDate;
  return last === today || last === addDays(today, -1) ? save.streak.count : 0;
}

export const goalReached = (save: SaveState, today: DateKey) =>
  save.today.date === today && save.today.xp >= save.dailyGoal;

export interface XpResult {
  /** Neues Level, falls aufgestiegen. */
  levelUp: number | null;
  /** Tagesziel gerade eben erreicht ⇒ Serie fortgesetzt. */
  goalJustReached: boolean;
}

/** Bucht XP: Gesamt, Tag, Level-Aufstieg; beim Erreichen des Tagesziels wächst die Serie. */
export function addXp(save: SaveState, amount: number, today: DateKey): XpResult {
  rollDay(save, today);
  const levelBefore = levelInfo(save.xp).level;
  const wasReached = save.today.xp >= save.dailyGoal;
  save.xp += amount;
  save.today.xp += amount;
  const levelAfter = levelInfo(save.xp).level;
  const goalJustReached = !wasReached && save.today.xp >= save.dailyGoal;
  if (goalJustReached) {
    save.streak.count = currentStreak(save, today) + 1;
    save.streak.lastDate = today;
  }
  return { levelUp: levelAfter > levelBefore ? levelAfter : null, goalJustReached };
}
