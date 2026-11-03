import { content } from '../../content';
import type { Role, Sentence, Stage, StageId, Word } from '../../content/types';
import type { ProgressKey, RoleKey, SaveState } from '../storage/state';

/** Lernpfad: Etappen werden der Reihe nach frei, eine Etappe gilt nach gewonnenem Boss als geschafft. */

export type StageStatus = 'done' | 'open' | 'locked';

export const stageIndex = (id: StageId) => content.stages.findIndex((s) => s.id === id);
export const stageWords = (id: StageId): Word[] => content.words.filter((w) => w.stage === id);
export const stageSentences = (id: StageId): Sentence[] => content.sentences.filter((s) => s.stage === id);
export const stageRoles = (id: StageId): Role[] => content.roles.filter((r) => r.stage === id);

export const isDone = (save: SaveState, id: StageId) => save.stages[id]?.done === true;

export function isUnlocked(save: SaveState, id: StageId): boolean {
  const i = stageIndex(id);
  return i === 0 || (i > 0 && isDone(save, content.stages[i - 1]!.id));
}

export function stageStatus(save: SaveState, id: StageId): StageStatus {
  if (isDone(save, id)) return 'done';
  return isUnlocked(save, id) ? 'open' : 'locked';
}

/** Die Etappe, an der es weitergeht (nach der letzten die letzte). */
export function currentStage(save: SaveState): Stage {
  return content.stages.find((s) => !isDone(save, s.id)) ?? content.stages[content.stages.length - 1]!;
}

/** Ein Satz ist frei, sobald alle seine Wörter mindestens einmal gesehen wurden. */
export function isSentenceFree(save: SaveState, sentence: Sentence): boolean {
  return sentence.words.every((id) => (save.items[id]?.seen ?? 0) > 0);
}

export function roleKeys(role: Role): RoleKey[] {
  return role.addr ? [`${role.id}:self`, `${role.id}:addr`] : [`${role.id}:self`];
}

/** Was für den Boss gelernt sein muss: alle Wörter der Etappe und – in Pronomen-Etappen – alle Rollen-Einheiten. */
export function coreKeys(id: StageId): ProgressKey[] {
  return [...stageWords(id).map((w) => w.id), ...stageRoles(id).flatMap(roleKeys)];
}

/** Anteil der Kern-Einheiten, die schon mindestens einmal richtig beantwortet wurden (0..1). */
export function stageLearned(save: SaveState, id: StageId): number {
  const keys = coreKeys(id);
  return keys.filter((k) => (save.items[k]?.right ?? 0) > 0).length / keys.length;
}

/** Bosskampf möglich: Etappe frei und jede Kern-Einheit mindestens einmal richtig. */
export const bossReady = (save: SaveState, id: StageId) => isUnlocked(save, id) && stageLearned(save, id) === 1;

/** Bosskampf gewonnen: Etappe abschließen, beste Wertung (übrige Leben) merken. */
export function completeStage(save: SaveState, id: StageId, lives: number): void {
  const prev = save.stages[id];
  save.stages[id] = { done: true, bossBest: Math.max(prev?.bossBest ?? 0, lives) };
}

export const regionDone = (save: SaveState, region: string) =>
  content.stages.filter((s) => s.region === region).every((s) => isDone(save, s.id));
