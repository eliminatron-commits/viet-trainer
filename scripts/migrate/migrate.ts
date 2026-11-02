/**
 * Einmalige Migration der Inhalte aus der alten App (legacy/js/*.js) und den
 * vorbereiteten Inhalten (prepared/*.js) nach src/content/*.json, Audios nach
 * public/audio/. Aufruf: npm run migrate (Node >= 23, native Type-Stripping).
 *
 * Achtung: überschreibt src/content/*.json. Nach der Migration sind die JSON-
 * Dateien die Quelle der Wahrheit; erneut ausführen nur bewusst (z. B. wenn sich
 * die Etappenzuordnung in curriculum.ts ändert, bevor JSON von Hand gepflegt wird).
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import type {
  ContextId,
  Role,
  Sentence,
  SentenceContext,
  SentenceId,
  Stage,
  StageId,
  Word,
  WordId,
} from '../../src/content/types.ts';
import { REGIONS, STAGES } from './curriculum.ts';

const ROOT = join(import.meta.dirname, '..', '..');
const OUT = join(ROOT, 'src', 'content');
const AUDIO_OUT = join(ROOT, 'public', 'audio');

interface LegacyWord { id: string; vn: string; de: string; pron?: string; pack?: number; verb?: boolean }
interface LegacySentence { id: string; vn: string; de: string; words: string[]; ctx?: string }
interface LegacyRole { id: string; label: string; self: string; addr: string | null }
interface LegacyVT {
  DATA: { words: LegacyWord[]; isVerb(id: string): boolean };
  WORDS_EXT: { words: LegacyWord[] };
  SENTENCES: { sentences: LegacySentence[]; contexts: Record<string, { label: string }> };
  SENTENCES_EXT: { sentences: LegacySentence[] };
  PRONOUNS: { roles: LegacyRole[] };
}

function loadLegacy(): LegacyVT {
  const ctx: Record<string, unknown> = {};
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of [
    'legacy/js/data.js',
    'prepared/words-ext.js',
    'legacy/js/sentences.js',
    'prepared/sentences-ext.js',
    'legacy/js/pronouns.js',
  ]) {
    vm.runInContext(readFileSync(join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  return ctx.VT as LegacyVT;
}

const fail = (msg: string): never => {
  console.error('Migration abgebrochen: ' + msg);
  process.exit(1);
};

const wordId = (n: number) => `w${String(n).padStart(3, '0')}` as WordId;
const stageId = (i: number) => `e${String(i + 1).padStart(2, '0')}` as StageId;

/** Ich-/Du-Wörter der Satzkontexte (aus den Kommentaren in legacy/js/sentences.js). */
const CONTEXT_PRONOUNS: Record<ContextId, { self: WordId; addr: WordId[] }> = {
  emAnh: { self: 'w005', addr: ['w003'] },
  emChi: { self: 'w005', addr: ['w004'] },
  anhEm: { self: 'w003', addr: ['w005'] },
  conParent: { self: 'w023', addr: ['w022', 'w021'] },
  chauOng: { self: 'w026', addr: ['w006'] },
  chauBa: { self: 'w026', addr: ['w007'] },
  chauChu: { self: 'w026', addr: ['w009'] },
  chauCo: { self: 'w026', addr: ['w008'] },
  formal: { self: 'w001', addr: [] },
};

function main() {
  const VT = loadLegacy();

  // Etappen + Wort→Etappe
  const stages: Stage[] = STAGES.map((s, i) => ({ id: stageId(i), region: s.region, title: s.title, kind: s.kind }));
  const stageOf = new Map<WordId, number>();
  STAGES.forEach((s, i) =>
    s.words.forEach((n) => {
      const id = wordId(n);
      if (stageOf.has(id)) fail(`${id} ist mehreren Etappen zugeordnet`);
      stageOf.set(id, i);
    }),
  );

  // Wörter
  const core = VT.DATA.words.map((w) => ({ ...w, verb: VT.DATA.isVerb(w.id), checked: true }));
  const ext = VT.WORDS_EXT.words.map((w) => ({ ...w, verb: w.verb === true, checked: false }));
  const words: Word[] = [...core, ...ext].map((w) => {
    const id = w.id as WordId;
    const st = stageOf.get(id);
    if (st === undefined) fail(`${id} (${w.vn}) ist keiner Etappe zugeordnet`);
    const stage = stages[st!]!;
    const word: Word = {
      id,
      vn: w.vn,
      de: w.de,
      verb: w.verb,
      kind: stage.kind === 'particles' ? 'particle' : 'word',
      stage: stage.id,
      tags: [],
      checked: w.checked,
    };
    if (w.pron) word.pron = w.pron;
    return word;
  });
  const wordIds = new Set(words.map((w) => w.id));
  for (const id of stageOf.keys()) if (!wordIds.has(id)) fail(`Etappe nennt unbekanntes Wort ${id}`);

  // Satz/Rolle → Etappe des zuletzt eingeführten Wortes
  const lastStage = (ids: WordId[], owner: string): StageId => {
    let max = 0;
    for (const id of ids) {
      const st = stageOf.get(id);
      if (st === undefined) fail(`${owner} nennt unbekanntes Wort ${id}`);
      max = Math.max(max, st!);
    }
    return stages[max]!.id;
  };

  const contexts: SentenceContext[] = Object.entries(VT.SENTENCES.contexts).map(([id, c]) => {
    const pr = CONTEXT_PRONOUNS[id as ContextId] ?? fail(`unbekannter Kontext ${id}`);
    return { id: id as ContextId, label: c.label, ...pr };
  });
  const contextIds = new Set<string>(contexts.map((c) => c.id));

  const sentences: Sentence[] = [
    ...VT.SENTENCES.sentences.map((s) => ({ ...s, checked: true })),
    ...VT.SENTENCES_EXT.sentences.map((s) => ({ ...s, checked: false })),
  ].map((s) => {
    if (s.ctx && !contextIds.has(s.ctx)) fail(`${s.id}: unbekannter Kontext ${s.ctx}`);
    const ws = s.words as WordId[];
    const sentence: Sentence = {
      id: s.id as SentenceId,
      vn: s.vn,
      de: s.de,
      words: ws,
      stage: lastStage(ws, s.id),
      tags: [],
      checked: s.checked,
    };
    if (s.ctx) sentence.ctx = s.ctx as ContextId;
    return sentence;
  });

  const roles: Role[] = VT.PRONOUNS.roles.map((r) => {
    const ids = [r.self, ...(r.addr ? [r.addr] : [])] as WordId[];
    return { id: r.id, label: r.label, self: r.self as WordId, addr: r.addr as WordId | null, stage: lastStage(ids, `Rolle ${r.id}`) };
  });

  // Doppelte IDs?
  for (const list of [words, sentences, roles]) {
    const seen = new Set<string>();
    for (const x of list) {
      if (seen.has(x.id)) fail(`doppelte ID ${x.id}`);
      seen.add(x.id);
    }
  }

  // Audios
  mkdirSync(AUDIO_OUT, { recursive: true });
  for (const { id } of [...words, ...sentences]) {
    const src = [join(ROOT, 'audio', `${id}.mp3`), join(ROOT, 'prepared', 'audio', `${id}.mp3`)].find(existsSync);
    if (!src) fail(`keine Audiodatei für ${id}`);
    copyFileSync(src!, join(AUDIO_OUT, `${id}.mp3`));
  }

  // Schreiben: ein Objekt pro Zeile → gut lesbare Diffs
  const write = (name: string, items: unknown[]) =>
    writeFileSync(join(OUT, name), '[\n' + items.map((x) => '  ' + JSON.stringify(x)).join(',\n') + '\n]\n');
  write('regions.json', REGIONS);
  write('stages.json', stages);
  write('words.json', words);
  write('sentences.json', sentences);
  write('roles.json', roles);
  write('contexts.json', contexts);

  const perStage = stages.map((st) => `${st.id}:${words.filter((w) => w.stage === st.id).length}w/${sentences.filter((s) => s.stage === st.id).length}s`);
  console.log(`${words.length} Wörter, ${sentences.length} Sätze, ${roles.length} Rollen, ${stages.length} Etappen`);
  console.log(perStage.join('  '));
}

main();
