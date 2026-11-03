import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import type { Word } from '../src/content/types';
import { newSave } from '../src/lib/storage/state';
import type { ProgressKey, SaveState } from '../src/lib/storage/state';
import {
  bossReady,
  completeStage,
  coreKeys,
  currentStage,
  isSentenceFree,
  isUnlocked,
  regionDone,
  stageIndex,
  stageLearned,
  stageStatus,
  stageWords,
} from '../src/lib/logic/path';

const { stages, words, sentences } = content;
const NOW = new Date('2026-11-03T10:00:00');
const fresh = (): SaveState => newSave(NOW);

/** Einheit als richtig beantwortet (right) markieren. */
function setRight(save: SaveState, key: ProgressKey, right: number) {
  save.items[key] = { box: 1, due: '2026-11-04', seen: Math.max(1, right), right, wrong: 0 };
}

/** Wort nur gesehen (seen), noch nicht richtig beantwortet. */
function setSeen(save: SaveState, key: ProgressKey, seen: number) {
  save.items[key] = { box: 1, due: '2026-11-03', seen, right: 0, wrong: 0 };
}

const wordStage = new Map<string, Word['stage']>(words.map((w) => [w.id, w.stage]));

describe('Lernpfad: Freischaltung', () => {
  it('neuer Stand: nur die erste Etappe ist offen, alle anderen gesperrt', () => {
    const save = fresh();
    expect(stageStatus(save, stages[0]!.id)).toBe('open');
    for (const s of stages.slice(1)) expect(stageStatus(save, s.id), s.id).toBe('locked');
  });

  it('neuer Stand: currentStage ist die erste Etappe', () => {
    expect(currentStage(fresh()).id).toBe(stages[0]!.id);
  });

  it('Etappen werden strikt der Reihe nach frei', () => {
    const save = fresh();
    stages.forEach((stage, i) => {
      completeStage(save, stage.id, 3);
      expect(stageStatus(save, stage.id), `${stage.id} nach Abschluss`).toBe('done');
      if (stages[i + 1]) expect(stageStatus(save, stages[i + 1]!.id), `${stages[i + 1]!.id}`).toBe('open');
      if (stages[i + 2]) expect(stageStatus(save, stages[i + 2]!.id), `${stages[i + 2]!.id}`).toBe('locked');
      for (const later of stages.slice(i + 2)) {
        expect(isUnlocked(save, later.id), later.id).toBe(false);
      }
    });
  });

  it('currentStage zeigt nach jedem Abschluss die nächste Etappe, am Ende die letzte', () => {
    const save = fresh();
    stages.forEach((stage, i) => {
      expect(currentStage(save).id).toBe(stage.id);
      completeStage(save, stage.id, 2);
      expect(currentStage(save).id).toBe(stages[Math.min(i + 1, stages.length - 1)]!.id);
    });
  });

  it('completeStage merkt das Maximum von bossBest', () => {
    const save = fresh();
    completeStage(save, 'e01', 2);
    completeStage(save, 'e01', 1);
    expect(save.stages.e01).toEqual({ done: true, bossBest: 2 });
    completeStage(save, 'e01', 3);
    expect(save.stages.e01?.bossBest).toBe(3);
  });
});

describe('Lernpfad: Bosskampf-Bereitschaft', () => {
  it('Kern-Einheiten: Wörter der Etappe plus Rollen-Einheiten in Pronomen-Etappen', () => {
    const save = fresh();
    const e01 = coreKeys('e01');
    expect(e01).toEqual(expect.arrayContaining([...stageWords('e01').map((w) => w.id), 'anh:self', 'anh:addr', 'chi:self', 'chi:addr', 'em:self', 'em:addr', 'la:self']));
    expect(e01).not.toContain('la:addr');
    expect(e01).toHaveLength(stageWords('e01').length + 7);
    expect(coreKeys('e02')).toEqual(stageWords('e02').map((w) => w.id));
    expect(coreKeys('e07')).toEqual(expect.arrayContaining(['bo:self', 'bo:addr', 'ong:addr', 'ba:addr']));
    expect(save.items).toEqual({});
  });

  it('bossReady erst, wenn jede Kern-Einheit richtig beantwortet ist', () => {
    const save = fresh();
    const keys = coreKeys('e01');
    keys.slice(0, -1).forEach((k) => setRight(save, k, 1));
    expect(bossReady(save, 'e01')).toBe(false);
    expect(stageLearned(save, 'e01')).toBe((keys.length - 1) / keys.length);
    setRight(save, keys[keys.length - 1]!, 1);
    expect(stageLearned(save, 'e01')).toBe(1);
    expect(bossReady(save, 'e01')).toBe(true);
  });

  it('nur Einheiten mit right ≥ 1 zählen, reines Gesehen-Werden nicht', () => {
    const save = fresh();
    for (const k of coreKeys('e01')) setSeen(save, k, 5);
    expect(stageLearned(save, 'e01')).toBe(0);
    expect(bossReady(save, 'e01')).toBe(false);
  });

  it('stageLearned liefert den Anteil der richtig beantworteten Kern-Einheiten', () => {
    const save = fresh();
    const keys = coreKeys('e01');
    keys.slice(0, 4).forEach((k) => setRight(save, k, 2));
    expect(stageLearned(save, 'e01')).toBe(4 / keys.length);
  });

  it('bossReady nur für freie Etappen', () => {
    const save = fresh();
    for (const k of coreKeys('e02')) setRight(save, k, 1);
    expect(stageLearned(save, 'e02')).toBe(1);
    expect(isUnlocked(save, 'e02')).toBe(false);
    expect(bossReady(save, 'e02')).toBe(false);
    completeStage(save, 'e01', 3);
    expect(bossReady(save, 'e02')).toBe(true);
  });
});

describe('Lernpfad: Satzfreigabe', () => {
  it('ein Satz ist frei genau dann, wenn alle seine Wörter gesehen wurden', () => {
    const save = fresh();
    for (const w of words) setSeen(save, w.id, 1);
    for (const s of sentences) {
      expect(isSentenceFree(save, s), `${s.id} mit allen Wörtern`).toBe(true);
      for (const id of s.words) {
        const before = save.items[id]!;
        setSeen(save, id, 0);
        expect(isSentenceFree(save, s), `${s.id} ohne ${id}`).toBe(false);
        save.items[id] = before;
      }
    }
  });

  it('ein Satz ohne Eintrag eines seiner Wörter ist nicht frei', () => {
    const save = fresh();
    const s = sentences[0]!;
    expect(isSentenceFree(save, s)).toBe(false);
  });

  it('wird nie vor der Etappe seines letzten Wortes frei, wenn die Etappen der Reihe nach gelernt werden', () => {
    stages.forEach((stage, i) => {
      const save = fresh();
      for (const w of words) if (stageIndex(w.stage) <= i) setSeen(save, w.id, 1);
      for (const s of sentences) {
        const lastWordStage = Math.max(...s.words.map((id) => stageIndex(wordStage.get(id)!)));
        expect(isSentenceFree(save, s), `${s.id} nach ${stage.id}`).toBe(lastWordStage <= i);
        if (stageIndex(s.stage) <= i) expect(isSentenceFree(save, s), `${s.id} nach ${stage.id}`).toBe(true);
      }
    });
  });
});

describe('Lernpfad: Regionen', () => {
  it('regionDone erst, wenn alle Etappen der Region abgeschlossen sind', () => {
    const save = fresh();
    const danang = stages.filter((s) => s.region === 'danang');
    danang.forEach((stage, i) => {
      expect(regionDone(save, 'danang')).toBe(false);
      completeStage(save, stage.id, 3);
      expect(regionDone(save, 'danang')).toBe(i === danang.length - 1);
    });
    expect(regionDone(save, 'hoian')).toBe(false);
  });
});
