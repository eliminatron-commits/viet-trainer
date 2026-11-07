import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import type { Sentence, Stage, WordId } from '../src/content/types';
import { newSave } from '../src/lib/storage/state';
import type { ItemProgress, ProgressKey, SaveState } from '../src/lib/storage/state';
import {
  bossReady,
  completeStage,
  coreKeys,
  isSentenceFree,
  roleKeys,
  stageRoles,
  stageSentences,
  stageWords,
} from '../src/lib/logic/path';
import { addDays, answerItem, markSeen } from '../src/lib/logic/srs';
import {
  BOSS_LIVES,
  BOSS_SIZE,
  NEW_PER_SESSION,
  REVIEWS_PER_SESSION,
  SESSION_SIZE,
  TRAINING_BATCH,
  answerOf,
  buildBossSession,
  buildStageSession,
  buildTrainingBatch,
  buildWateringBatch,
  learnedKeys,
  optionText,
  thirstyKeys,
} from '../src/lib/logic/session';
import type { Item, Task } from '../src/lib/logic/session';

const { stages, words } = content;
const NOW = new Date('2026-11-03T10:00:00');
const TODAY = '2026-11-03';
const LATER = '2026-11-20';

/** Deterministischer Zufall (Mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const progress = (right: number, due: string): ItemProgress => ({
  box: 1,
  due,
  seen: Math.max(1, right),
  right,
  wrong: 0,
});

/** Alle Einheiten einer Etappe (Wörter, Sätze, Rollen) als richtig beantwortet markieren – ohne Abschluss. */
function markLearned(save: SaveState, stage: Stage, due = LATER) {
  for (const key of [...coreKeys(stage.id), ...stageSentences(stage.id).map((s) => s.id)]) {
    save.items[key] = progress(1, due);
  }
}

/** Spielstand: alle Etappen vor Index `upTo` sind bestanden und gelernt. */
function learnedBefore(upTo: number, due = LATER): SaveState {
  const save = newSave(NOW);
  for (const stage of stages.slice(0, upTo)) {
    completeStage(save, stage.id, BOSS_LIVES);
    markLearned(save, stage, due);
  }
  return save;
}

/** Alle Einheiten, die zur Etappe gehören (Wörter, Sätze, Rollen). */
const ownKeys = (stage: Stage) =>
  new Set<string>([
    ...stageWords(stage.id).map((w) => w.id),
    ...stageSentences(stage.id).map((s) => s.id),
    ...stageRoles(stage.id).flatMap(roleKeys),
  ]);

/** Spielt Aufgaben durch: Vorstellkarten werden gesehen, Quiz-Antworten sind richtig (oder laut `correct`). */
function play(save: SaveState, tasks: Task[], today: string, correct = () => true) {
  for (const t of tasks) {
    if (t.kind === 'intro') save.items[t.key] = markSeen(save.items[t.key], today);
    else save.items[t.key] = answerItem(save.items[t.key], correct(), today);
  }
}

const isSentence = (x: Item): x is Sentence => x.id.startsWith('s');

/** Optionen einer Quiz-Aufgabe: Anzahl, genau eine richtige, keine Ablenker mit gleichem Text. */
function checkOptions(task: Task, save: SaveState, where: string) {
  if (task.kind === 'choice') {
    const answer = task.item;
    expect(task.options, where).toHaveLength(4);
    expect(answerOf(task), where).toBe(answer.id);
    expect(task.options.filter((o) => o.id === answer.id), where).toHaveLength(1);
    expect(new Set(task.options.map((o) => optionText(o, task.mode))).size, where).toBe(4);
    for (const o of task.options) {
      if (o.id === answer.id) continue;
      expect(o.de, where).not.toBe(answer.de);
      expect(o.vn, where).not.toBe(answer.vn);
    }
    if (isSentence(answer)) expect(isSentenceFree(save, answer), `${where} ${answer.id} frei`).toBe(true);
  }
  if (task.kind === 'gap') {
    expect(task.options, where).toHaveLength(4);
    expect(answerOf(task), where).toBe(task.answer.id);
    expect(task.options.filter((o) => o.id === task.answer.id), where).toHaveLength(1);
    expect(new Set(task.options.map((o) => o.vn.trim().toLowerCase())).size, where).toBe(4);
    // Lückensatz nur bei gelernten, freien Sätzen
    expect(save.items[task.key]?.right ?? 0, `${where} ${task.key} gelernt`).toBeGreaterThan(0);
    expect(isSentenceFree(save, task.item), `${where} ${task.key} frei`).toBe(true);
  }
  if (task.kind === 'role') {
    const answer = task.answer;
    expect(task.options.length, where).toBeGreaterThanOrEqual(3);
    expect(answerOf(task), where).toBe(answer.id);
    expect(task.options.filter((o) => o.id === answer.id), where).toHaveLength(1);
    expect(new Set(task.options.map((o) => o.vn)).size, where).toBe(task.options.length);
    expect(new Set(task.options.map((o) => o.de)).size, where).toBe(task.options.length);
    for (const o of task.options) {
      if (o.id === answer.id) continue;
      expect(o.de, where).not.toBe(answer.de);
      expect(o.vn, where).not.toBe(answer.vn);
    }
  }
}

/** Index der ersten Quiz-Aufgabe, die direkt hinter einer Quiz-Aufgabe zur selben Einheit steht (-1 = keine). */
function adjacentSameUnit(tasks: Task[]): number {
  return tasks.findIndex((t, i) => i > 0 && t.kind !== 'intro' && tasks[i - 1]!.kind !== 'intro' && tasks[i - 1]!.key === t.key);
}

type Batch = { label: string; stage?: Stage; save: SaveState; tasks: Task[]; verbsOnly?: boolean; kind: 'session' | 'boss' | 'training' };

/** Batches über alle Etappen, zwei Seeds und drei Tage (mit Lernfortschritt dazwischen). */
function sampleBatches(): Batch[] {
  const out: Batch[] = [];
  for (const [k, stage] of stages.entries()) {
    for (const seed of [1, 2]) {
      const random = rng(seed * 1000 + k);
      const save = learnedBefore(k, TODAY);
      for (let day = 0; day < 3; day++) {
        const today = addDays(TODAY, day);
        const label = `${stage.id} Seed ${seed} Tag ${day}`;
        const session = buildStageSession(stage, save, today, random);
        out.push({ kind: 'session', label, stage, save: structuredClone(save), tasks: session });
        out.push({ kind: 'boss', label, stage, save: structuredClone(save), tasks: buildBossSession(stage, save, random) });
        out.push({ kind: 'training', label, save: structuredClone(save), tasks: buildTrainingBatch(save, today, false, random) });
        out.push({
          kind: 'training',
          label,
          save: structuredClone(save),
          verbsOnly: true,
          tasks: buildTrainingBatch(save, today, true, random),
        });
        play(save, session, today, () => random() < 0.7);
      }
    }
  }
  return out;
}

describe('Session einer Etappe', () => {
  it('Erste Session: bis zu NEW_PER_SESSION Vorstellkarten, jede direkt gefolgt von einem Quiz zum selben Wort', () => {
    for (const [k, stage] of stages.entries()) {
      const tasks = buildStageSession(stage, learnedBefore(k), TODAY, rng(k + 1));
      const intros = tasks.flatMap((t, i) => (t.kind === 'intro' ? [i] : []));
      expect(intros, stage.id).toHaveLength(Math.min(NEW_PER_SESSION, stageWords(stage.id).length));
      for (const i of intros) {
        expect(tasks[i + 1]?.kind, `${stage.id} nach Vorstellkarte ${i}`).toBe('choice');
        expect(tasks[i + 1]?.key, `${stage.id} nach Vorstellkarte ${i}`).toBe(tasks[i]!.key);
      }
    }
  });

  it('Erste Session: jedes neue Wort hat insgesamt zwei Quiz-Aufgaben', () => {
    for (const [k, stage] of stages.entries()) {
      const tasks = buildStageSession(stage, learnedBefore(k), TODAY, rng(k + 2));
      for (const t of tasks) {
        if (t.kind !== 'intro') continue;
        const quizzes = tasks.filter((x) => x.kind !== 'intro' && x.key === t.key);
        expect(quizzes, `${stage.id} ${t.key}`).toHaveLength(2);
      }
    }
  });

  it('Erste Session: höchstens SESSION_SIZE Quiz-Aufgaben (Vorstellkarten nicht mitgezählt)', () => {
    for (const [k, stage] of stages.entries()) {
      const tasks = buildStageSession(stage, learnedBefore(k), TODAY, rng(k + 3));
      expect(tasks.filter((t) => t.kind !== 'intro').length, stage.id).toBeLessThanOrEqual(SESSION_SIZE);
    }
  });

  it('Fällige Wiederholungen: genau REVIEWS_PER_SESSION Aufgaben fremder Etappen, die am weitesten überfälligen zuerst', () => {
    const save = learnedBefore(1);
    const e01 = stageWords('e01');
    // Sechs Wörter überfällig (Datum je Index aufsteigend), drei noch nicht fällig.
    e01.forEach((w, i) => {
      save.items[w.id] = progress(1, i < 6 ? `2026-10-${String(10 + i).padStart(2, '0')}` : LATER);
    });
    const stage = stages[1]!;
    const own = ownKeys(stage);
    for (const seed of [1, 2, 3]) {
      const tasks = buildStageSession(stage, save, TODAY, rng(seed));
      const foreign = tasks.filter((t) => t.kind !== 'intro' && !own.has(t.key));
      expect(foreign, `Seed ${seed}`).toHaveLength(REVIEWS_PER_SESSION);
      expect(new Set(foreign.map((t) => t.key)), `Seed ${seed}`).toEqual(
        new Set(e01.slice(0, REVIEWS_PER_SESSION).map((w) => w.id)),
      );
    }
  });

  it('Fällige Wiederholungen: nicht fällige fremde Einheiten kommen nicht vor', () => {
    const save = learnedBefore(1);
    const notDue = stageWords('e01').slice(6).map((w) => w.id);
    for (const w of stageWords('e01')) save.items[w.id] = progress(1, notDue.includes(w.id) ? LATER : '2026-10-10');
    const stage = stages[1]!;
    const tasks = buildStageSession(stage, save, TODAY, rng(9));
    for (const id of notDue) expect(tasks.some((t) => t.key === id), id).toBe(false);
  });

  it('Quiz-Aufgaben bleiben bei SESSION_SIZE, auch wenn Wiederholungen fällig sind', () => {
    const violations: string[] = [];
    for (const [k, stage] of stages.entries()) {
      if (k === 0) continue;
      const tasks = buildStageSession(stage, learnedBefore(k, TODAY), TODAY, rng(k));
      const quizzes = tasks.filter((t) => t.kind !== 'intro').length;
      if (quizzes > SESSION_SIZE) violations.push(`${stage.id}: ${quizzes} Quiz-Aufgaben`);
    }
    expect(violations).toEqual([]);
  });

  it('Weiterspielen: neue Wörter kommen der Reihe nach, danach nur noch Übung ohne Vorstellkarten', () => {
    for (const [k, stage] of stages.entries()) {
      const save = learnedBefore(k);
      const order = stageWords(stage.id).map((w) => w.id);
      const introduced: string[] = [];
      for (let s = 0; s < 15; s++) {
        const tasks = buildStageSession(stage, save, TODAY, rng(k * 100 + s));
        const intros = tasks.filter((t) => t.kind === 'intro').map((t) => t.key);
        const next = order.filter((id) => !introduced.includes(id)).slice(0, NEW_PER_SESSION);
        expect(intros, `${stage.id} Session ${s}`).toEqual(next);
        expect(tasks.filter((t) => t.kind !== 'intro').length, `${stage.id} Session ${s}`).toBeLessThanOrEqual(SESSION_SIZE);
        introduced.push(...intros);
        play(save, tasks, TODAY);
      }
      expect(introduced, stage.id).toHaveLength(order.length);
      expect(bossReady(save, stage.id), stage.id).toBe(true);
      const later = buildStageSession(stage, save, TODAY, rng(k + 999));
      expect(later.filter((t) => t.kind === 'intro'), stage.id).toHaveLength(0);
      // Eine Paare-Aufgabe ersetzt zwei Übungsaufgaben (Gewicht 2).
      const weight = later.filter((t) => t.kind !== 'intro').reduce((n, t) => n + (t.kind === 'pairs' ? 2 : 1), 0);
      expect(weight, stage.id).toBe(SESSION_SIZE);
    }
  });

  it('Quiz-Optionen sind gültig über alle Etappen, Seeds, Sessions, Bosskämpfe und Training', () => {
    for (const b of sampleBatches()) {
      const where = `${b.kind} ${b.label}`;
      for (const t of b.tasks) checkOptions(t, b.save, where);
    }
  }, 120_000);

  it('keine zwei Quiz-Aufgaben zur selben Einheit direkt hintereinander (Session, Boss, Training)', () => {
    // Bei nur einer einzigen Einheit im Pool ist die Regel unerfüllbar (alle Aufgaben wären gleich);
    // geprüft werden daher Batches mit mindestens zwei verschiedenen Einheiten.
    const problems = sampleBatches()
      .filter((b) => new Set(b.tasks.map((t) => t.key)).size > 1)
      .map((b) => ({ where: `${b.kind} ${b.label}`, at: adjacentSameUnit(b.tasks) }))
      .filter((p) => p.at !== -1);
    expect(problems).toEqual([]);
  }, 120_000);
});

describe('Bosskampf', () => {
  it('genau BOSS_SIZE Aufgaben, nur Einheiten der Etappe (Wörter, freie Sätze, Rollen), keine Vorstellkarten', () => {
    for (const [k, stage] of stages.entries()) {
      const save = learnedBefore(k);
      markLearned(save, stage);
      expect(bossReady(save, stage.id), stage.id).toBe(true);
      const allowed = new Set<string>([
        ...coreKeys(stage.id),
        ...stageSentences(stage.id)
          .filter((s) => isSentenceFree(save, s))
          .map((s) => s.id),
      ]);
      const tasks = buildBossSession(stage, save, rng(k + 7));
      expect(tasks, stage.id).toHaveLength(BOSS_SIZE);
      for (const t of tasks) {
        expect(t.kind, stage.id).not.toBe('intro');
        expect(allowed.has(t.key), `${stage.id} ${t.key}`).toBe(true);
      }
    }
  });
});

describe('Training', () => {
  it('ist leer, solange nichts richtig beantwortet ist', () => {
    const save = newSave(NOW);
    expect(buildTrainingBatch(save, TODAY, false, rng(1))).toEqual([]);
    expect(buildTrainingBatch(save, TODAY, true, rng(1))).toEqual([]);
    setSeenOnly(save);
    expect(buildTrainingBatch(save, TODAY, false, rng(1))).toEqual([]);
  });

  it('liefert TRAINING_BATCH Aufgaben, nur aus gelernten Einheiten', () => {
    const save = learnedBefore(3);
    const learned = new Set<string>(learnedKeys(save));
    const tasks = buildTrainingBatch(save, TODAY, false, rng(2));
    expect(tasks).toHaveLength(TRAINING_BATCH);
    for (const t of tasks) expect(learned.has(t.key), t.key).toBe(true);
  });

  it('verbsOnly: nur Wörter mit verb:true', () => {
    const save = learnedBefore(3);
    const verbs = new Set<string>(words.filter((w) => w.verb).map((w) => w.id));
    const tasks = buildTrainingBatch(save, TODAY, true, rng(3));
    expect(tasks).toHaveLength(TRAINING_BATCH);
    for (const t of tasks) expect(verbs.has(t.key), t.key).toBe(true);
  });

  it('verbsOnly ohne gelernte Verben ist leer', () => {
    expect(buildTrainingBatch(learnedBefore(1), TODAY, true, rng(3))).toEqual([]);
  });

  it('fällige Einheiten kommen vor nicht fälligen', () => {
    const save = learnedBefore(3);
    const due = learnedKeys(save).slice(0, 4);
    for (const k of due) save.items[k] = progress(1, TODAY);
    const tasks = buildTrainingBatch(save, TODAY, false, rng(4));
    expect(new Set(tasks.slice(0, due.length).map((t) => t.key))).toEqual(new Set(due));
  });

  it('fällige Einheiten kommen auch vor, wenn nur wenige Einheiten gelernt sind', () => {
    const save = newSave(NOW);
    save.items[words[0]!.id] = progress(1, LATER);
    save.items[words[1]!.id] = progress(1, TODAY);
    const tasks = buildTrainingBatch(save, TODAY, false, rng(5));
    expect(tasks[0]!.key).toBe(words[1]!.id);
  });
});

/** Nur gesehen, nie richtig beantwortet. */
function setSeenOnly(save: SaveState) {
  const key: ProgressKey = words[0]!.id;
  save.items[key] = { box: 1, due: TODAY, seen: 1, right: 0, wrong: 0 };
}

describe('Gießrunde (nur durstige Einheiten)', () => {
  /** Drei Etappen gelernt; `n` Einheiten davon sind fällig, je älter, desto weiter vorn in `keys`. */
  function thirstySave(n: number) {
    const save = learnedBefore(3);
    const keys = learnedKeys(save).slice(0, n);
    keys.forEach((k, i) => (save.items[k] = { ...save.items[k]!, due: addDays(TODAY, -(n - i)) }));
    return { save, keys };
  }

  it('gießt jede durstige Einheit genau einmal, die ältesten zuerst, und endet, wenn alle gegossen sind', () => {
    const { save, keys } = thirstySave(TRAINING_BATCH + 3);
    expect(thirstyKeys(save, TODAY)).toHaveLength(TRAINING_BATCH + 3);
    const r = rng(7);
    const first = buildWateringBatch(save, TODAY, false, r);
    expect(first).toHaveLength(TRAINING_BATCH);
    expect(first.every((t) => t.kind !== 'intro' && t.kind !== 'pairs')).toBe(true);
    const firstKeys = first.map((t) => t.key);
    expect(new Set(firstKeys).size).toBe(TRAINING_BATCH);
    // Die drei jüngsten fälligen bleiben für den zweiten Block.
    expect(new Set(firstKeys)).toEqual(new Set(keys.slice(0, TRAINING_BATCH)));
    // Auch falsche Antworten gießen: falsch heißt „morgen wieder“, heute nicht mehr durstig.
    play(save, first, TODAY, () => r() < 0.5);
    const second = buildWateringBatch(save, TODAY, false, r);
    expect(new Set(second.map((t) => t.key))).toEqual(new Set(keys.slice(TRAINING_BATCH)));
    play(save, second, TODAY);
    expect(thirstyKeys(save, TODAY)).toEqual([]);
    expect(buildWateringBatch(save, TODAY, false, r)).toEqual([]);
  });

  it('ohne durstige Einheiten ist die Gießrunde leer; „Nur Verben“ gießt nur Verben', () => {
    expect(buildWateringBatch(learnedBefore(3), TODAY)).toEqual([]);
    const { save } = thirstySave(learnedKeys(learnedBefore(3)).length);
    const verbs = buildWateringBatch(save, TODAY, true, rng(3));
    expect(verbs.length).toBeGreaterThan(0);
    const verbIds = new Set(words.filter((w) => w.verb).map((w) => w.id));
    expect(verbs.every((t) => verbIds.has(t.key as WordId))).toBe(true);
  });
});
