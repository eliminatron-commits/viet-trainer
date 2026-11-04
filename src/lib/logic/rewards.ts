import type { DateKey, SaveState } from '../storage/state';
import { addDays } from './srs';

/** XP, Level, Tagesziel, Serie (Streak) mit Streak-Schutz, XP-Boost und das Wachstum des Büffels. */

export const XP_PER_CORRECT = 10;
/** Ein XP-Boost verdoppelt die XP für diese Zeit. */
export const BOOST_MINUTES = 15;
export const BOOST_FACTOR = 2;
/** Mehr Streak-Schutz kann man nicht ansammeln. */
export const MAX_SHIELDS = 3;

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
    save.streak.best = Math.max(save.streak.best, save.streak.count);
  }
  return { levelUp: levelAfter > levelBefore ? levelAfter : null, goalJustReached };
}

/** Tage von a bis b (b - a), beides Kalendertage. */
function daysBetween(a: DateKey, b: DateKey): number {
  const utc = (d: DateKey) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

/**
 * Streak-Schutz: Wurden seit dem letzten erreichten Tagesziel Tage verpasst und reicht der Vorrat,
 * überbrückt je ein Schutz einen verpassten Tag – die Serie bleibt, wächst aber nicht.
 * Gibt die Zahl der verbrauchten Schutze zurück (0 = nichts zu tun oder Serie nicht zu retten).
 */
export function applyShields(save: SaveState, today: DateKey): number {
  const last = save.streak.lastDate;
  if (!last || save.streak.count === 0) return 0;
  const missed = daysBetween(last, today) - 1;
  if (missed < 1 || missed > save.streak.shields) return 0;
  save.streak.shields -= missed;
  save.streak.lastDate = addDays(today, -1);
  return missed;
}

export const boostActive = (save: SaveState, now: Date) =>
  save.inventory.boostUntil !== null && now.getTime() < Date.parse(save.inventory.boostUntil);

export const xpMultiplier = (save: SaveState, now: Date) => (boostActive(save, now) ? BOOST_FACTOR : 1);

/** Setzt einen XP-Boost aus dem Vorrat ein (nicht, solange einer läuft). */
export function activateBoost(save: SaveState, now: Date): boolean {
  if (save.inventory.xpBoosts < 1 || boostActive(save, now)) return false;
  save.inventory.xpBoosts--;
  save.inventory.boostUntil = new Date(now.getTime() + BOOST_MINUTES * 60_000).toISOString();
  return true;
}

/** Wachstum des Büffels: Kalb bis Level 4, jung bis Level 9, danach ausgewachsen. */
export type Growth = 0 | 1 | 2;
export const GROWTH_LEVELS = [1, 5, 10] as const;
export const growthOf = (level: number): Growth => (level >= GROWTH_LEVELS[2] ? 2 : level >= GROWTH_LEVELS[1] ? 1 : 0);
