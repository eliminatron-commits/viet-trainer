import type { UseStore } from 'idb-keyval';
import type { ItemId, StageId } from '../content/types';
import { toggleEquip as equip } from './logic/accessories';
import { checkAchievements } from './logic/achievements';
import { CHALLENGE_XP, checkChallenges, rollWeek } from './logic/challenges';
import { awardChest, openChest as open, type ChestPrize } from './logic/chest';
import { logNewWord, logRound, logShields, logTask, syncDay } from './logic/diary';
import { completeStage, isDone } from './logic/path';
import { activateBoost, addXp, applyShields, rollDay, XP_PER_CORRECT, xpMultiplier, type XpResult } from './logic/rewards';
import { answerItem, markSeen } from './logic/srs';
import { countTask, type TaskResult } from './logic/stats';
import { feed } from './logic/yard';
import { loadSave, openSaveStore, writeSave } from './storage/persist';
import { dateKey, newSave, type ProgressKey, type ReviewVerdict, type SaveState, type Settings } from './storage/state';

/** Neuigkeiten für die Anzeige (Toast bzw. Ergebnis einer Runde); nicht gespeichert. */
export type News =
  | { kind: 'achievement'; id: string; title: string }
  | { kind: 'challenge'; id: string; title: string; xp: number }
  | { kind: 'shield'; days: number };

/** Globaler Spielstand. Jede Aktion schreibt sofort den kompletten Stand nach IndexedDB. */
export const game = $state<{ save: SaveState; ready: boolean; error: string; news: News[] }>({
  save: newSave(),
  ready: false,
  error: '',
  news: [],
});

let store: UseStore | null = null;
let writing: Promise<void> = Promise.resolve();

export const today = () => dateKey(new Date());

export async function initGame(): Promise<void> {
  store = openSaveStore();
  try {
    game.save = await loadSave(store);
  } catch (e) {
    game.error = e instanceof Error ? e.message : String(e);
  }
  game.ready = true;
  settle(begin());
  persist();
}

/** Schreibvorgänge nacheinander, damit ein älterer Stand nie einen neueren überholt. */
function persist(): void {
  if (!store) return;
  const s = store;
  writing = writing
    .then(() => writeSave(game.save, s))
    .catch((e: unknown) => {
      game.error = `Speichern fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`;
    });
}

/** Wartet, bis alle Schreibvorgänge durch sind (z. B. vor Export). */
export const flushed = () => writing;

/**
 * Vor jeder Aktion: Tageswechsel (Tages-XP zurück, verpasste Tage mit Streak-Schutz überbrücken) und
 * Wochenwechsel (neue Challenges – bevor die Aktion zählt). Gibt das heutige Datum zurück.
 */
function begin(now = new Date()): string {
  const t = dateKey(now);
  rollDay(game.save, t);
  const last = game.save.streak.lastDate;
  const used = applyShields(game.save, t);
  if (used > 0) {
    game.news.push({ kind: 'shield', days: used });
    if (last) logShields(game.save, last, used);
  }
  rollWeek(game.save, t);
  return t;
}

/**
 * Nach jeder Änderung: Wochen-Challenges und Achievements prüfen, Neues melden. Challenge-XP zählen wie andere XP
 * fürs Tagesziel (und können so die Challenge „Tagesziel“ erfüllen – deshalb, bis nichts Neues mehr kommt).
 */
function settle(t: string): XpResult {
  const extra: XpResult = { levelUp: null, goalJustReached: false };
  let gained = false;
  for (let done = checkChallenges(game.save, t); done.length > 0; done = checkChallenges(game.save, t)) {
    for (const c of done) {
      gained = true;
      const r = addXp(game.save, CHALLENGE_XP, t);
      if (r.goalJustReached) {
        game.save.stats.goals++;
        extra.goalJustReached = true;
      }
      extra.levelUp = r.levelUp ?? extra.levelUp;
      game.news.push({ kind: 'challenge', id: c.id, title: c.title, xp: CHALLENGE_XP });
    }
  }
  for (const a of checkAchievements(game.save, t)) game.news.push({ kind: 'achievement', id: a.id, title: a.title });
  // Tagebuch: Challenge-XP zählen zum Tag (nur an Tagen mit Aktivität – bloßes Öffnen legt keinen Eintrag an).
  if (gained || game.save.days[t]) syncDay(game.save, t);
  return extra;
}

/** Vorstellkarte gesehen. */
export function recordSeen(key: ProgressKey): void {
  const t = begin();
  if (!game.save.items[key] && key.startsWith('w')) {
    game.save.stats.newWords++;
    logNewWord(game.save, t);
  }
  game.save.items[key] = markSeen(game.save.items[key], t);
  settle(t);
  persist();
}

export interface TaskOutcome extends XpResult {
  /** Gebuchte XP (mit XP-Boost). */
  xp: number;
}

/** Bucht eine gelöste Aufgabe: SRS je Einheit, Zähler, XP (mit Boost), Tagesziel, Achievements, Challenges. */
export function recordTask(result: TaskResult): TaskOutcome {
  const now = new Date();
  const t = begin(now);
  for (const u of result.units) game.save.items[u.key] = answerItem(game.save.items[u.key], u.correct, t);
  countTask(game.save.stats, result);
  const xp = result.correct ? XP_PER_CORRECT * xpMultiplier(game.save, now) : 0;
  const booked = xp > 0 ? addXp(game.save, xp, t) : { levelUp: null, goalJustReached: false };
  if (booked.goalJustReached) game.save.stats.goals++;
  const extra = settle(t);
  logTask(game.save, t, result.correct);
  persist();
  return {
    xp,
    levelUp: Math.max(booked.levelUp ?? 0, extra.levelUp ?? 0) || null,
    goalJustReached: booked.goalJustReached || extra.goalJustReached,
  };
}

/** Runde (Etappe oder Training) beendet. */
export function recordRoundEnd(): XpResult {
  const t = begin();
  game.save.stats.rounds++;
  const extra = settle(t);
  logRound(game.save, t);
  persist();
  return extra;
}

/**
 * Bosskampf gewonnen: Etappe abschließen; der erste Sieg bringt eine Truhe (makellos: mit garantiertem Accessoire).
 * Gibt zurück, ob es eine gab.
 */
export function recordBossWin(stage: StageId, lives: number, maxLives: number): boolean {
  const t = begin();
  const firstWin = !isDone(game.save, stage);
  completeStage(game.save, stage, lives);
  game.save.stats.rounds++;
  game.save.stats.bossWins++;
  if (lives === maxLives) game.save.stats.perfectBosses++;
  const chest = awardChest(game.save, firstWin, lives === maxLives);
  settle(t);
  logRound(game.save, t);
  persist();
  return chest;
}

/** Bosskampf verloren: zählt als gespielte Runde. */
export const recordBossLoss = recordRoundEnd;

/** Öffnet eine Truhe aus dem Vorrat (makellose zuerst – sie garantieren ein fehlendes Accessoire). */
export function openChest(): ChestPrize | null {
  const prize = open(game.save, Math.random);
  if (prize) {
    settle(begin());
    persist();
  }
  return prize;
}

export function useBoost(): boolean {
  const ok = activateBoost(game.save, new Date());
  if (ok) persist();
  return ok;
}

export function toggleEquip(id: string): void {
  equip(game.save, id);
  persist();
}

/** Trâus Hof: füttern (einmal am Tag nach erreichtem Tagesziel). */
export function feedTrau(): boolean {
  const ok = feed(game.save, today());
  if (ok) persist();
  return ok;
}

export function toggleFavorite(id: ItemId): void {
  const favs = game.save.favorites;
  game.save.favorites = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
  settle(begin());
  persist();
}

/** Prüfmodus: Urteil setzen oder (null) zurücknehmen. */
export function setReview(id: ItemId, verdict: ReviewVerdict | null): void {
  if (verdict) game.save.review[id] = verdict;
  else delete game.save.review[id];
  persist();
}

/** Nimmt die angezeigten Neuigkeiten aus der Warteschlange. */
export function takeNews(): News[] {
  return game.news.splice(0);
}

export function updateSettings(patch: Partial<Settings>): void {
  game.save.settings = { ...game.save.settings, ...patch };
  persist();
}

/** Import: ersetzt den kompletten Spielstand. */
export function replaceSave(next: SaveState): void {
  game.save = next;
  persist();
}
