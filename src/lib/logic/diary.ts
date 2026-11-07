import { emptyDay, type DateKey, type DayLog, type SaveState } from '../storage/state';
import { goalReached } from './rewards';
import { addDays } from './srs';

/**
 * Tagebuch: zählt je Kalendertag, was geschah (Grundlage für Laternen-Kalender und Wochenrückblick).
 * Ein Eintrag entsteht erst mit Aktivität (oder wenn der Streak-Schutz den Tag überbrückt) – bloßes Öffnen zählt nicht.
 */

/**
 * Eintrag des Tages, bei Bedarf angelegt. Nach dem Anlegen neu gelesen, damit in der App jede Änderung über den
 * Svelte-Proxy des Spielstands läuft (CLAUDE.md: `$state` liefert Proxies) und nie am bloßen Objekt vorbei.
 */
export function dayLog(save: SaveState, t: DateKey): DayLog {
  if (!save.days[t]) save.days[t] = emptyDay();
  return save.days[t]!;
}

/** Tages-XP und Tagesziel aus `today` übernehmen (dort zählt die App die XP des Tages). */
export function syncDay(save: SaveState, t: DateKey): void {
  const d = dayLog(save, t);
  if (save.today.date === t) d.xp = save.today.xp;
  if (goalReached(save, t)) d.goal = true;
}

/** Eine gelöste Aufgabe. */
export function logTask(save: SaveState, t: DateKey, correct: boolean): void {
  const d = dayLog(save, t);
  d.tasks++;
  if (correct) d.right++;
  syncDay(save, t);
}

/** Ein Wort zum ersten Mal vorgestellt. */
export function logNewWord(save: SaveState, t: DateKey): void {
  dayLog(save, t).newWords++;
}

/** Eine Runde beendet. */
export function logRound(save: SaveState, t: DateKey): void {
  dayLog(save, t).rounds++;
  syncDay(save, t);
}

/** Der Streak-Schutz hat `days` Tage nach `last` (letztes erreichtes Tagesziel) überbrückt. */
export function logShields(save: SaveState, last: DateKey, days: number): void {
  for (let i = 1; i <= days; i++) dayLog(save, addDays(last, i)).shield = true;
}
