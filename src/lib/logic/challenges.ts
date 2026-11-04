import { content } from '../../content';
import type { DateKey, SaveState, StatKey } from '../storage/state';
import { addDays } from './srs';

/** Wochen-Challenges: jede Woche (ab Montag) drei Aufgaben aus dem Vorrat, der Reihe nach rotierend. */

export interface Challenge {
  id: string;
  title: string;
  metric: StatKey;
  goal: number;
}

export const CHALLENGES: readonly Challenge[] = [
  { id: 'richtig', title: '80 Aufgaben richtig lösen', metric: 'correct', goal: 80 },
  { id: 'paare', title: '5 Paare-Runden gegen die Uhr gewinnen', metric: 'pairs', goal: 5 },
  { id: 'tagesziel', title: 'An 4 Tagen das Tagesziel schaffen', metric: 'goals', goal: 4 },
  { id: 'ton', title: '15 Töne beim Ton-Ninja treffen', metric: 'tones', goal: 15 },
  { id: 'neu', title: '12 neue Wörter lernen', metric: 'newWords', goal: 12 },
  { id: 'satzbau', title: '8 Sätze aus Kacheln bauen', metric: 'builds', goal: 8 },
  { id: 'runden', title: '8 Runden spielen', metric: 'rounds', goal: 8 },
  { id: 'diktat', title: '6 Hör-Diktate lösen', metric: 'dictations', goal: 6 },
];

export const CHALLENGES_PER_WEEK = 3;
export const CHALLENGE_XP = 50;

const byId = new Map(CHALLENGES.map((c) => [c.id, c]));
export const challenge = (id: string) => byId.get(id);

/** Montag der Woche eines Tages. */
export function weekOf(day: DateKey): DateKey {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  const weekday = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  return addDays(day, -weekday);
}

/** Ohne unbekannte Wörter lässt sich „neue Wörter lernen“ nicht mehr erfüllen. */
const possible = (save: SaveState, c: Challenge) => c.metric !== 'newWords' || content.words.some((w) => !save.items[w.id]);

/** Die Challenges einer Woche: fortlaufend durch den Vorrat, nicht Erfüllbares wird übersprungen. */
export function challengesFor(week: DateKey, save: SaveState): Challenge[] {
  const n = Math.round((Date.parse(`${week}T00:00:00Z`) - Date.parse('2026-01-05T00:00:00Z')) / (7 * 86_400_000));
  const start = (((n * CHALLENGES_PER_WEEK) % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length;
  const picked: Challenge[] = [];
  for (let i = 0; i < CHALLENGES.length && picked.length < CHALLENGES_PER_WEEK; i++) {
    const c = CHALLENGES[(start + i) % CHALLENGES.length]!;
    if (possible(save, c)) picked.push(c);
  }
  return picked;
}

/** Fortschritt einer Challenge in dieser Woche (gedeckelt auf das Ziel). */
export function challengeProgress(save: SaveState, id: string): number {
  const c = challenge(id);
  const state = save.challenges.list.find((s) => s.id === id);
  if (!c || !state) return 0;
  return Math.min(c.goal, save.stats[c.metric] - state.base);
}

/**
 * Neue Woche ⇒ neue Challenges mit dem aktuellen Zählerstand als Basis. Muss vor dem Zählen einer Aktion laufen,
 * sonst steckt die erste Aufgabe der Woche schon in der Basis.
 */
export function rollWeek(save: SaveState, today: DateKey): void {
  const week = weekOf(today);
  if (save.challenges.week === week) return;
  save.challenges = {
    week,
    list: challengesFor(week, save).map((c) => ({ id: c.id, base: save.stats[c.metric], done: false })),
  };
}

/** Markiert erreichte Challenges als erledigt und gibt sie zurück (die XP bucht der Aufrufer). */
export function checkChallenges(save: SaveState, today: DateKey): Challenge[] {
  rollWeek(save, today);
  const done: Challenge[] = [];
  for (const state of save.challenges.list) {
    const c = challenge(state.id);
    if (!c || state.done || save.stats[c.metric] - state.base < c.goal) continue;
    state.done = true;
    done.push(c);
  }
  return done;
}
