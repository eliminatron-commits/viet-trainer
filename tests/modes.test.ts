import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import type { Sentence } from '../src/content/types';
import { completeStage, coreKeys, isSentenceFree, stageSentences } from '../src/lib/logic/path';
import {
  BOSS_LIVES,
  BOSS_SIZE,
  FOCUS_BATCH,
  PAIRS_SECONDS,
  PAIR_COUNT,
  TRAINING_BATCH,
  answerOf,
  buildBossSession,
  buildCorrect,
  buildStageSession,
  buildTask,
  buildTrainingBatch,
  focusInfo,
  isBuildable,
  pairsTask,
  quizTask,
  sentenceTiles,
  shuffle,
  toneTask,
} from '../src/lib/logic/session';
import type { Task } from '../src/lib/logic/session';
import { baseForm, toneVariants, tonesAllowed, tonesOf } from '../src/lib/logic/tones';
import { newSave } from '../src/lib/storage/state';
import type { ItemProgress, SaveState } from '../src/lib/storage/state';

const { words, sentences, stages } = content;
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

const progress = (due = LATER): ItemProgress => ({ box: 1, due, seen: 1, right: 1, wrong: 0 });

/** Spielstand, in dem alle Wörter und Sätze gelernt sind. */
function everythingLearned(): SaveState {
  const save = newSave(NOW);
  for (const w of words) save.items[w.id] = progress();
  for (const s of sentences) save.items[s.id] = progress();
  return save;
}

const kinds = (tasks: Task[]) => tasks.map((t) => t.kind);
const strip = (text: string) => text.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();

describe('Ton-Ninja: Tonlogik', () => {
  it('setzt Töne auf den richtigen Vokal (alte Schreibung wie in den Inhalten)', () => {
    const variants = (vn: string) => toneVariants(vn).map((v) => v.text);
    expect(variants('hoa')).toContain('hòa');
    expect(variants('khoe')).toContain('khỏe');
    expect(variants('toan')).toContain('toán');
    expect(variants('ngoai')).toContain('ngoài');
    expect(variants('tiêng')).toContain('tiếng');
    expect(variants('nươc')).toContain('nước');
    expect(variants('qua')).toContain('quá');
    expect(variants('gi')).toContain('gì');
    expect(variants('gio')).toContain('giò');
  });

  it('tauscht Tonzeichen auf demselben Vokal und erkennt den Ton je Silbe', () => {
    expect(tonesOf('mà')).toEqual(['huyen']);
    expect(tonesOf('bây giờ')).toEqual(['ngang', 'huyen']);
    const v = toneVariants('mà').map((x) => x.text);
    expect(v).toContain('má');
    expect(v).toContain('ma');
    expect(v).not.toContain('mà');
  });

  it('Stoppsilben (p, t, c, ch) erlauben nur sắc und nặng', () => {
    expect(toneVariants('cát').map((v) => v.text)).toEqual(['cạt']);
    expect(toneVariants('ép').map((v) => v.text)).toEqual(['ẹp']);
    expect(tonesAllowed('cát')).toBe(true);
    expect(tonesAllowed('càt')).toBe(false);
  });

  it('hoà und hòa haben dieselbe Tonfolge', () => {
    expect(tonesOf('hoà')).toEqual(tonesOf('hòa'));
    expect(baseForm('hoà')).toBe(baseForm('hòa'));
  });
});

describe('Ton-Ninja: Aufgaben für alle Wörter', () => {
  it('jedes Wort ergibt eine lösbare Aufgabe (viele Seeds)', () => {
    const problems: string[] = [];
    for (const w of words) {
      for (const seed of [1, 2, 3]) {
        const t = toneTask(w, rng(seed * 31 + Number(w.id.slice(1))));
        if (!t || t.kind !== 'tone') {
          problems.push(`${w.id} ${w.vn}: keine Aufgabe`);
          continue;
        }
        const where = `${w.id} ${w.vn} Seed ${seed}`;
        const ids = t.options.map((o) => o.id);
        if (t.options.length < 2 || t.options.length > 4) problems.push(`${where}: ${t.options.length} Optionen`);
        if (new Set(ids).size !== ids.length) problems.push(`${where}: doppelte IDs`);
        if (ids.filter((id) => id === w.id).length !== 1) problems.push(`${where}: Antwort nicht genau einmal`);
        if (answerOf(t) !== w.id) problems.push(`${where}: answerOf`);
        const tones = t.options.map((o) => tonesOf(o.vn).join());
        if (new Set(tones).size !== tones.length) problems.push(`${where}: gleiche Tonfolge ${t.options.map((o) => o.vn).join('/')}`);
        const base = baseForm(w.vn);
        for (const o of t.options) {
          if (baseForm(o.vn) !== base) problems.push(`${where}: andere Grundform ${o.vn}`);
          if (!tonesAllowed(o.vn)) problems.push(`${where}: Stoppsilbe mit falschem Ton ${o.vn}`);
          if (o.id !== w.id && !(o.id.startsWith(`${w.id}~`) || content.words.some((x) => x.id === o.id))) {
            problems.push(`${where}: unbekannte ID ${o.id}`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

describe('Satzbau und Diktat', () => {
  const buildable = sentences.filter(isBuildable);
  const addressIds = new Set([
    ...content.roles.flatMap((r) => [r.self, r.addr]),
    ...content.contexts.flatMap((c) => [c.self, ...c.addr]),
  ]);
  const addressTexts = new Set(words.filter((w) => addressIds.has(w.id)).map((w) => w.vn.toLowerCase()));
  /** Bedeutungen unabhängig von session.ts: Übersetzung ohne Klammern, an / ; , getrennt. */
  const meaningsOf = (w: { de: string }) =>
    w.de
      .toLowerCase()
      .replace(/\([^)]*\)/g, '')
      .split(/[/;,]/)
      .map((m) => m.trim())
      .filter(Boolean);
  const targetMeanings = (s: Sentence) => {
    const tiles = new Set(sentenceTiles(s).tiles.map((t) => t.toLowerCase()));
    return new Set(words.filter((w) => s.words.includes(w.id) || tiles.has(w.vn.toLowerCase())).flatMap(meaningsOf));
  };

  it('bietet zu „Chờ em một chút.“ nie „đợi“ an (beides heißt „warten“)', () => {
    const s = sentences.find((x) => x.vn.startsWith('Chờ em một chút'))!;
    for (let seed = 0; seed < 40; seed++) {
      const t = buildTask(s, 'build', rng(seed))!;
      if (t.kind !== 'build') continue;
      expect(t.tiles.map((x) => x.text.toLowerCase())).not.toContain('đợi');
    }
  });

  it('die meisten Sätze sind baubar', () => {
    expect(buildable.length).toBeGreaterThan(sentences.length * 0.8);
  });

  it('Zielkacheln ergeben aneinandergereiht den Satz ohne Satzzeichen, 2–10 Stück', () => {
    for (const s of buildable) {
      const { tiles, closing } = sentenceTiles(s);
      expect(tiles.length, s.id).toBeGreaterThanOrEqual(2);
      expect(tiles.length, s.id).toBeLessThanOrEqual(10);
      expect(tiles.join(' '), s.id).toBe(strip(s.vn));
      expect(s.vn.trim().endsWith(closing), s.id).toBe(true);
      for (const t of tiles) expect(t, s.id).not.toMatch(/[^\p{L}\p{N}\s]/u);
    }
  });

  it('mehrsilbige Wörter des Satzes bilden eine Kachel', () => {
    const multi = buildable.flatMap((s) =>
      s.words
        .map((id) => words.find((w) => w.id === id)!)
        .filter((w) => w.vn.trim().includes(' ') && s.vn.toLowerCase().includes(w.vn.toLowerCase()))
        .map((w) => ({ s, w })),
    );
    expect(multi.length).toBeGreaterThan(0);
    for (const { s, w } of multi) {
      expect(sentenceTiles(s).tiles.map((t) => t.toLowerCase()), `${s.id} ${w.vn}`).toContain(w.vn.toLowerCase());
    }
  });

  it('jede baubare Aufgabe ist lösbar; Ablenker kommen im Satz nicht vor', () => {
    for (const s of buildable) {
      for (const mode of ['build', 'dictation'] as const) {
        for (const seed of [1, 2]) {
          const where = `${s.id} ${mode} Seed ${seed}`;
          const t = buildTask(s, mode, rng(seed + Number(s.id.slice(1))));
          expect(t, where).not.toBeNull();
          if (!t || t.kind !== 'build') continue;
          const text = (id: string) => t.tiles.find((x) => x.id === id)!.text;
          expect(answerOf(t), where).toBe(t.target.join(' '));
          expect(t.target.map(text).join(' '), where).toBe(strip(s.vn));
          expect(new Set(t.tiles.map((x) => x.id)).size, where).toBe(t.tiles.length);
          const distractors = t.tiles.filter((x) => !t.target.includes(x.id));
          expect(distractors, where).toHaveLength(2);
          const padded = ` ${strip(s.vn).toLowerCase()} `;
          for (const d of distractors) expect(padded.includes(` ${d.text.toLowerCase()} `), `${where} ${d.text}`).toBe(false);
          expect(new Set(distractors.map((d) => d.text.toLowerCase())).size, where).toBe(2);
          // Ablenker haben keine Bedeutung eines Satzworts (chờ/đợi, bố/cha) – sonst wäre eine richtige Lösung „falsch“.
          for (const d of distractors) {
            const dm = words.filter((w) => w.vn.toLowerCase() === d.text.toLowerCase()).flatMap(meaningsOf);
            expect(dm.filter((m) => targetMeanings(s).has(m)), `${where} ${d.text}`).toEqual([]);
          }
          // Ablenker sind nie Anrede-/Pronomenwörter (die deutsche Vorgabe sagt nicht, wen man anspricht).
          for (const d of distractors) expect(addressTexts.has(d.text.toLowerCase()), `${where} ${d.text}`).toBe(false);
          // Prüffunktion: Zielfolge richtig, vertauschte Folge falsch (wo die Vertauschung den Text ändert).
          expect(buildCorrect(t, t.target), where).toBe(true);
          const swapped = [...t.target];
          [swapped[0], swapped[1]] = [swapped[1]!, swapped[0]!];
          expect(buildCorrect(t, swapped), where).toBe(text(swapped[0]!).toLowerCase() === text(swapped[1]!).toLowerCase());
          expect(buildCorrect(t, t.target.slice(1)), where).toBe(false);
          expect(buildCorrect(t, [...t.target, distractors[0]!.id]), where).toBe(false);
        }
      }
    }
  });

  it('gleiche Kacheltexte sind austauschbar', () => {
    const s = sentences.find((x) => {
      const tiles = sentenceTiles(x).tiles.map((t) => t.toLowerCase());
      return isBuildable(x) && new Set(tiles).size < tiles.length;
    });
    if (!s) return; // kein Satz mit doppeltem Wort im Inhalt
    const t = buildTask(s, 'build', rng(1))!;
    if (t.kind !== 'build') return;
    const text = (id: string) => t.tiles.find((x) => x.id === id)!.text.toLowerCase();
    const twin = t.target.findIndex((id, i) => t.target.some((o, k) => k !== i && text(o) === text(id)));
    const other = t.target.findIndex((id, i) => i !== twin && text(id) === text(t.target[twin]!));
    const swapped = [...t.target];
    [swapped[twin], swapped[other]] = [swapped[other]!, swapped[twin]!];
    expect(buildCorrect(t, swapped)).toBe(true);
  });

  it('quizTask liefert Satzbau/Diktat nur bei freien, baubaren Sätzen', () => {
    const save = newSave(NOW);
    const free = buildable.find((s) => s.words.length > 0)!;
    for (const id of free.words) save.items[id] = progress();
    const locked = buildable.find((s) => !isSentenceFree(save, s))!;
    for (let seed = 0; seed < 60; seed++) {
      expect(quizTask(locked.id, rng(seed), undefined, save).kind, 'gesperrter Satz').toBe('choice');
    }
    const modes = new Set(Array.from({ length: 200 }, (_, i) => quizTask(free.id, rng(i), undefined, save)).map((t) => (t.kind === 'build' ? t.mode : t.kind)));
    expect(modes.has('build')).toBe(true);
    expect(modes.has('dictation')).toBe(true);
    expect(modes.has('choice')).toBe(true);
    // ohne Spielstand (freie Wahl) bleiben Wörter bei Auswahl und Ton-Ninja
    const w = Array.from({ length: 200 }, (_, i) => quizTask(words[10]!.id, rng(i)).kind);
    expect(new Set(w)).toEqual(new Set(['choice', 'tone']));
  });
});

describe('Paare unter Zeitdruck', () => {
  it('lösbar: 5 verschiedene Wörter, vn und de paarweise verschieden, kurze Übersetzung, keine Partikel', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const t = pairsTask(shuffle(words, rng(seed)));
      expect(t, `Seed ${seed}`).not.toBeNull();
      if (!t || t.kind !== 'pairs') continue;
      expect(t.words, `Seed ${seed}`).toHaveLength(PAIR_COUNT);
      expect(t.seconds).toBe(PAIRS_SECONDS);
      expect(t.key).toBe(t.words[0]!.id);
      expect(new Set(t.words.map((w) => w.id)).size).toBe(PAIR_COUNT);
      expect(new Set(t.words.map((w) => w.vn.trim().toLowerCase())).size).toBe(PAIR_COUNT);
      expect(new Set(t.words.map((w) => w.de.trim().toLowerCase())).size).toBe(PAIR_COUNT);
      for (const w of t.words) {
        expect(w.kind).toBe('word');
        expect(w.de.trim().length).toBeLessThanOrEqual(28);
      }
      expect(answerOf(t)).toBe(t.words.map((w) => w.id).join(' '));
    }
  });

  it('keine Aufgabe, wenn keine 5 passenden Wörter da sind', () => {
    expect(pairsTask(words.slice(0, 4))).toBeNull();
    expect(pairsTask(words.filter((w) => w.kind === 'particle'))).toBeNull();
    const w = words[0]!;
    expect(pairsTask([w, w, w, w, w, w])).toBeNull();
  });

  it('Etappe, Boss und Training (alles gelernt, viele Seeds): jeweils lösbare Paare-Aufgaben', () => {
    const save = everythingLearned();
    for (const [k, stage] of stages.entries()) {
      completeStage(save, stage.id, BOSS_LIVES);
      for (const seed of [1, 2, 3]) {
        const r = rng(seed * 100 + k);
        const lists: Task[][] = [buildStageSession(stage, save, TODAY, r), buildBossSession(stage, save, r), buildTrainingBatch(save, TODAY, false, r)];
        for (const tasks of lists) {
          for (const t of tasks) {
            if (t.kind !== 'pairs') continue;
            expect(new Set(t.words.map((w) => w.vn.trim().toLowerCase())).size).toBe(PAIR_COUNT);
            expect(new Set(t.words.map((w) => w.de.trim().toLowerCase())).size).toBe(PAIR_COUNT);
            for (const w of t.words) expect(save.items[w.id], w.id).toBeDefined();
          }
        }
      }
    }
  });

  it('nur aus gesehenen Wörtern; mit zu wenigen gibt es keine Paare-Aufgabe in Etappe und Training', () => {
    const save = newSave(NOW);
    for (const w of words.slice(0, 4)) save.items[w.id] = progress();
    const stage = stages[0]!;
    expect(buildStageSession(stage, save, TODAY, rng(1)).some((t) => t.kind === 'pairs')).toBe(false);
    expect(buildTrainingBatch(save, TODAY, false, rng(1)).some((t) => t.kind === 'pairs')).toBe(false);
    expect(focusInfo(save, 'pairs').available).toBe(false);
    save.items[words[4]!.id] = progress();
    save.items[words[5]!.id] = progress();
    expect(focusInfo(save, 'pairs').available).toBe(true);
  });
});

describe('Einmischung in Etappe, Boss und Training', () => {
  it('Boss: genau eine Paare-Aufgabe, BOSS_SIZE bleibt, Schlüssel gehören zur Etappe', () => {
    const save = everythingLearned();
    for (const [k, stage] of stages.entries()) {
      const core = new Set<string>(coreKeys(stage.id));
      const free = new Set(stageSentences(stage.id).filter((s) => isSentenceFree(save, s)).map((s) => s.id));
      const tasks = buildBossSession(stage, save, rng(k + 5));
      expect(tasks, stage.id).toHaveLength(BOSS_SIZE);
      expect(kinds(tasks).filter((x) => x === 'pairs').length, stage.id).toBeLessThanOrEqual(1);
      for (const t of tasks) expect(core.has(t.key) || free.has(t.key as never), `${stage.id} ${t.key}`).toBe(true);
    }
    const tasks = buildBossSession(stages[3]!, save, rng(9));
    expect(kinds(tasks).filter((x) => x === 'pairs')).toHaveLength(1);
  });

  it('gemischtes Training: TRAINING_BATCH Aufgaben mit einer Paare-Aufgabe, nur Verben bei verbsOnly', () => {
    const save = everythingLearned();
    const verbs = new Set<string>(words.filter((w) => w.verb).map((w) => w.id));
    for (let seed = 1; seed <= 10; seed++) {
      const tasks = buildTrainingBatch(save, TODAY, false, rng(seed));
      expect(tasks).toHaveLength(TRAINING_BATCH);
      expect(kinds(tasks).filter((x) => x === 'pairs')).toHaveLength(1);
      const onlyVerbs = buildTrainingBatch(save, TODAY, true, rng(seed));
      expect(onlyVerbs).toHaveLength(TRAINING_BATCH);
      for (const t of onlyVerbs) {
        expect(verbs.has(t.key), t.key).toBe(true);
        if (t.kind === 'pairs') for (const w of t.words) expect(w.verb, w.vn).toBe(true);
      }
    }
  });

  it('der Modus-Mix enthält über viele Aufgaben alle Arten', () => {
    const save = everythingLearned();
    const seen = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      for (const t of buildTrainingBatch(save, TODAY, false, rng(seed))) {
        seen.add(t.kind === 'choice' ? t.mode : t.kind === 'build' ? t.mode : t.kind);
      }
    }
    for (const m of ['vn2de', 'de2vn', 'listen', 'tone', 'build', 'dictation', 'pairs']) expect(seen.has(m), m).toBe(true);
  });

  it('Etappen-Session: erstes Quiz eines neuen Wortes bleibt vn2de, Paare ersetzen zwei Übungsaufgaben', () => {
    const save = everythingLearned();
    const stage = stages[2]!;
    for (const w of content.words.filter((x) => x.stage === stage.id).slice(0, 2)) delete save.items[w.id];
    const tasks = buildStageSession(stage, save, TODAY, rng(4));
    const i = tasks.findIndex((t) => t.kind === 'intro');
    expect(tasks[i + 1]).toMatchObject({ kind: 'choice', mode: 'vn2de' });
    expect(kinds(tasks).filter((x) => x === 'pairs')).toHaveLength(1);
  });
});

describe('Training mit Fokus', () => {
  const save = everythingLearned();

  it('Paare: ca. 4 Aufgaben je Block, nur Paare', () => {
    const tasks = buildTrainingBatch(save, TODAY, false, rng(1), 'pairs');
    expect(tasks).toHaveLength(FOCUS_BATCH.pairs);
    expect(new Set(kinds(tasks))).toEqual(new Set(['pairs']));
    // die Aufgaben üben verschiedene Wörter (sie rücken nach hinten)
    expect(new Set(tasks.flatMap((t) => (t.kind === 'pairs' ? t.words.map((w) => w.id) : []))).size).toBeGreaterThan(PAIR_COUNT);
  });

  it('Satzbau, Diktat, Ton-Ninja: Block nur aus diesem Modus mit gelernten Einheiten', () => {
    const learned = new Set(Object.keys(save.items));
    for (const focus of ['build', 'dictation', 'tone'] as const) {
      const tasks = buildTrainingBatch(save, TODAY, false, rng(2), focus);
      expect(tasks, focus).toHaveLength(FOCUS_BATCH[focus]);
      for (const t of tasks) {
        expect(learned.has(t.key), `${focus} ${t.key}`).toBe(true);
        if (focus === 'tone') expect(t.kind).toBe('tone');
        else expect(t).toMatchObject({ kind: 'build', mode: focus });
        if (t.kind === 'build') expect(isSentenceFree(save, t.item)).toBe(true);
      }
    }
  });

  it('„Nur Verben“ gilt nicht für Fokus-Modi', () => {
    const tasks = buildTrainingBatch(save, TODAY, true, rng(3), 'tone');
    expect(tasks.some((t) => t.kind === 'tone' && !t.word.verb)).toBe(true);
  });

  it('leer, solange dafür nichts gelernt ist; focusInfo meldet es', () => {
    const empty = newSave(NOW);
    for (const focus of ['pairs', 'build', 'dictation', 'tone', 'mixed'] as const) {
      expect(buildTrainingBatch(empty, TODAY, false, rng(1), focus), focus).toEqual([]);
      expect(focusInfo(empty, focus).available, focus).toBe(false);
      expect(focusInfo(save, focus).available, focus).toBe(true);
    }
    const onlyWord = newSave(NOW);
    onlyWord.items[words[0]!.id] = progress();
    expect(focusInfo(onlyWord, 'build').available).toBe(false);
    expect(focusInfo(onlyWord, 'tone').available).toBe(true);
  });
});

describe('answerOf', () => {
  it('liefert die Lösungsform je Aufgabenart', () => {
    const w = words[10]!;
    const s = sentences.find(isBuildable) as Sentence;
    expect(answerOf({ kind: 'intro', key: w.id, word: w })).toBeNull();
    const tone = toneTask(w, rng(1))!;
    expect(answerOf(tone)).toBe(w.id);
    const build = buildTask(s, 'build', rng(1))!;
    expect(answerOf(build)).toMatch(/^t0 t1/);
  });
});
