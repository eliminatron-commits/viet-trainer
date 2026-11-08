import type { DateKey, SaveState } from '../storage/state';
import { activeDay, diaryStart, lanternOf, MONTHS, WEEKDAYS_SHORT, type Lantern } from './calendar';
import { challenge, challengeProgress, weekOf } from './challenges';
import { addDays } from './srs';

/**
 * Wochenrückblick „Deine Woche“: bei der ersten Öffnung einer neuen Woche einmal von selbst (für die Woche davor,
 * wenn in ihr gelernt wurde), sonst über den Laternen-Kalender für jede Woche mit Lerntagen. Zahlen aus dem Tagebuch,
 * Challenges aus dem Wochenarchiv (laufende Woche: aktueller Stand).
 */

export interface RecapDay {
  date: DateKey;
  day: number;
  weekday: string;
  lantern: Lantern;
  today: boolean;
}

export interface RecapChallenge {
  id: string;
  title: string;
  goal: number;
  progress: number;
  done: boolean;
}

export interface WeekRecap {
  monday: DateKey;
  /** „2.–8. November“ */
  title: string;
  /** laufende Woche (noch nicht vorbei) */
  current: boolean;
  days: RecapDay[];
  learned: number;
  goals: number;
  shields: number;
  xp: number;
  newWords: number;
  tasks: number;
  right: number;
  rounds: number;
  /** Anteil richtiger Aufgaben in Prozent (ohne Aufgaben: null). */
  share: number | null;
  /** null: für diese Woche nicht festgehalten (vor dem Wochenarchiv). */
  challenges: RecapChallenge[] | null;
}

export const weekDays = (monday: DateKey): DateKey[] => Array.from({ length: 7 }, (_, i) => addDays(monday, i));

/** Wurde in dieser Woche gelernt? (Überbrückte Tage allein zählen nicht.) */
export const weekActive = (save: SaveState, monday: DateKey) =>
  weekDays(monday).some((d) => {
    const log = save.days[d];
    return !!log && activeDay(log);
  });

const parts = (d: DateKey) => d.split('-').map(Number) as [number, number, number];

/** „2.–8. November“, „26. Oktober – 1. November“, über den Jahreswechsel mit Jahren. */
export function weekTitle(monday: DateKey): string {
  const [y1, m1, d1] = parts(monday);
  const [y2, m2, d2] = parts(addDays(monday, 6));
  if (y1 === y2 && m1 === m2) return `${d1}.–${d2}. ${MONTHS[m2 - 1]}`;
  if (y1 === y2) return `${d1}. ${MONTHS[m1 - 1]} – ${d2}. ${MONTHS[m2 - 1]}`;
  return `${d1}. ${MONTHS[m1 - 1]} ${y1} – ${d2}. ${MONTHS[m2 - 1]} ${y2}`;
}

export function weekRecap(save: SaveState, monday: DateKey, today: DateKey): WeekRecap {
  const start = diaryStart(save);
  const dates = weekDays(monday);
  const days = dates.map((date, i) => ({
    date,
    day: parts(date)[2],
    weekday: WEEKDAYS_SHORT[i]!,
    lantern: lanternOf(save.days[date], date, today, start),
    today: date === today,
  }));
  const logs = dates.filter((d) => d <= today).flatMap((d) => (save.days[d] ? [save.days[d]!] : []));
  const sum = (k: 'xp' | 'newWords' | 'tasks' | 'right' | 'rounds') => logs.reduce((n, l) => n + l[k], 0);
  const has = (l: Lantern) => days.filter((d) => d.lantern === l).length;
  const current = weekOf(today) === monday;
  const tasks = sum('tasks');
  const right = sum('right');

  const known = <T extends { id: string }>(list: T[]) => list.flatMap((s) => (challenge(s.id) ? [{ s, c: challenge(s.id)! }] : []));
  let challenges: RecapChallenge[] | null = null;
  if (current && save.challenges.week === monday) {
    challenges = known(save.challenges.list).map(({ s, c }) => ({ id: c.id, title: c.title, goal: c.goal, progress: challengeProgress(save, c.id), done: s.done }));
  } else if (save.weeks[monday]) {
    challenges = known(save.weeks[monday]!.challenges).map(({ s, c }) => ({ id: c.id, title: c.title, goal: c.goal, progress: Math.min(c.goal, s.progress), done: s.done }));
  }
  return {
    monday,
    title: weekTitle(monday),
    current,
    days,
    learned: has('learned') + has('goal'),
    goals: has('goal'),
    shields: has('shield'),
    xp: sum('xp'),
    newWords: sum('newWords'),
    tasks,
    right,
    rounds: sum('rounds'),
    share: tasks > 0 ? Math.round((right / tasks) * 100) : null,
    challenges,
  };
}

/**
 * Montag der Woche, deren Rückblick jetzt von selbst kommt: die Woche vor der laufenden, wenn in ihr gelernt wurde
 * und ihr Rückblick noch nicht gezeigt wurde. Sonst null.
 */
export function recapDue(save: SaveState, today: DateKey): DateKey | null {
  const prev = addDays(weekOf(today), -7);
  if (save.recap.seen !== null && save.recap.seen >= prev) return null;
  return weekActive(save, prev) ? prev : null;
}
