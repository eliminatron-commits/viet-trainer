import type { ProgressKey, StatKey, Stats } from '../storage/state';

/** Ergebnis einer Aufgabe und was es an den Zählern für Achievements und Challenges ändert. */

export type TaskMode = 'vn2de' | 'de2vn' | 'listen' | 'role' | 'pairs' | 'build' | 'dictation' | 'tone';

export interface TaskResult {
  mode: TaskMode;
  /** Aufgabe als Ganzes gelöst (zählt für Runde, Boss-Leben und XP). */
  correct: boolean;
  /** Je geübter Einheit richtig oder falsch – für das SRS (Paare üben mehrere Wörter auf einmal). */
  units: { key: ProgressKey; correct: boolean }[];
}

const MODE_STAT: Partial<Record<TaskMode, StatKey>> = {
  pairs: 'pairs',
  build: 'builds',
  dictation: 'dictations',
  tone: 'tones',
};

export function countTask(stats: Stats, result: TaskResult): void {
  if (!result.correct) {
    stats.combo = 0;
    return;
  }
  stats.correct++;
  stats.combo++;
  stats.bestCombo = Math.max(stats.bestCombo, stats.combo);
  const mode = MODE_STAT[result.mode];
  if (mode) stats[mode]++;
}
