import type { StageId } from '../../content/types';
import type { DateKey, SaveState, StatKey } from '../storage/state';
import { challenge, challengeProgress, weekOf } from './challenges';
import { bossReady, currentStage, isDone, stageIndex } from './path';
import { focusInfo, learnedKeys, type TrainingFocus } from './session';
import { isDue } from './srs';

/**
 * Trâus Tagesblick: bei der ersten Öffnung am Tag zeigt Trâu, was ansteht – durstige Pflanzen, das Tagesziel und die
 * Wochen-Challenge, die dem Ziel am nächsten ist. Jeder Punkt führt direkt hin (Gießrunde, Etappe bzw. Boss, passende
 * Übung). Abschaltbar (`settings.brief`). Am ersten Tag einer neuen Woche ist er die letzte Seite des Wochenrückblicks.
 */

export type BriefTarget =
  | { kind: 'water' }
  | { kind: 'stage'; stage: StageId }
  | { kind: 'boss'; stage: StageId }
  | { kind: 'training'; focus: TrainingFocus };

export interface BriefItem {
  kind: 'water' | 'goal' | 'challenge';
  title: string;
  detail: string;
  /** Text des Knopfs */
  action: string;
  target: BriefTarget;
  /** Fortschritt 0–1 (Tagesziel, Challenge); bei den Pflanzen null */
  progress: number | null;
}

/** Wo es mit dem Lernpfad weitergeht: Etappe, ihr Boss oder (alles geschafft) das Training. */
export function nextStep(save: SaveState): { target: BriefTarget; detail: string; action: string } {
  const s = currentStage(save);
  const n = stageIndex(s.id) + 1;
  if (isDone(save, s.id)) return { target: { kind: 'training', focus: 'mixed' }, detail: 'Alle Etappen geschafft – trainier, was du kannst.', action: 'Training' };
  if (bossReady(save, s.id)) return { target: { kind: 'boss', stage: s.id }, detail: `Der Boss von Etappe ${n} wartet: ${s.title}`, action: 'Zum Boss' };
  return { target: { kind: 'stage', stage: s.id }, detail: `Weiter mit Etappe ${n}: ${s.title}`, action: 'Weiter lernen' };
}

/** Übung je Challenge (Zähler → Trainingsmodus); fehlt sie oder ist sie noch gesperrt, geht es auf dem Lernpfad weiter. */
const FOCUS: Partial<Record<StatKey, TrainingFocus>> = { pairs: 'pairs', tones: 'tone', builds: 'build', dictations: 'dictation', correct: 'mixed', rounds: 'mixed' };
const FOCUS_ACTION: Record<TrainingFocus, string> = {
  mixed: 'Training',
  pairs: 'Paare spielen',
  gap: 'Lückensatz',
  build: 'Satzbau',
  dictation: 'Hör-Diktat',
  tone: 'Ton-Ninja',
  twins: 'Ton-Zwillinge',
};

export function briefItems(save: SaveState, today: DateKey): BriefItem[] {
  const items: BriefItem[] = [];
  const thirsty = learnedKeys(save).filter((k) => isDue(save.items[k]!, today)).length;
  if (thirsty > 0)
    items.push({
      kind: 'water',
      title: thirsty === 1 ? 'Eine Pflanze ist durstig' : `${thirsty} Pflanzen sind durstig`,
      detail: 'Alles Fällige einmal gießen.',
      action: 'Feld gießen',
      target: { kind: 'water' },
      progress: null,
    });

  const step = nextStep(save);
  const xp = save.today.date === today ? save.today.xp : 0;
  const left = save.dailyGoal - xp;
  if (left > 0) items.push({ kind: 'goal', title: `Noch ${left} XP bis zum Tagesziel`, detail: step.detail, action: step.action, target: step.target, progress: xp / save.dailyGoal });

  if (save.challenges.week === weekOf(today)) {
    const open = save.challenges.list
      .flatMap((s) => {
        const c = challenge(s.id);
        return c && !s.done ? [{ c, p: challengeProgress(save, c.id) }] : [];
      })
      .sort((a, b) => b.p / b.c.goal - a.p / a.c.goal);
    const best = open[0];
    if (best) {
      const focus = FOCUS[best.c.metric];
      const ok = focus !== undefined && focusInfo(save, focus).available;
      items.push({
        kind: 'challenge',
        title: best.c.title,
        detail: `Wochen-Challenge: ${best.p} von ${best.c.goal}`,
        action: ok ? FOCUS_ACTION[focus] : step.action,
        target: ok ? { kind: 'training', focus } : step.target,
        progress: best.p / best.c.goal,
      });
    }
  }
  return items;
}

/** Kommt der Tagesblick heute von selbst? Eingeschaltet, heute noch nicht gezeigt, und es wurde schon einmal gelernt. */
export const briefDue = (save: SaveState, today: DateKey) =>
  save.settings.brief && save.brief.seen !== today && Object.keys(save.items).length > 0;

/** Gruß nach Uhrzeit (wie im Lernpfad). */
export const greeting = (hour: number) => (hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Hallo' : 'Guten Abend');
