/**
 * Inhaltsmodell. Die JSON-Dateien in src/content/ sind nach der einmaligen
 * Migration (scripts/migrate/) die Quelle der Wahrheit. Neue Wörter/Sätze
 * werden dort angehängt; Audio liegt immer unter public/audio/<id>.mp3.
 */

export type WordId = `w${number}`;
export type SentenceId = `s${number}`;
export type ItemId = WordId | SentenceId;
export type RegionId = 'danang' | 'hoian' | 'hue' | 'hanoi' | 'saigon';
export type StageId = `e${number}`;

/** standard = Vokabeln mit Übersetzung, pronouns = Anreden + Rollen, particles = Erklärung statt Übersetzung. */
export type StageKind = 'standard' | 'pronouns' | 'particles';

/** Situationen für den Sprachführer (Vergabe in Phase 3). */
export const SITUATION_TAGS = {
  restaurant: 'Restaurant',
  familie: 'Familie',
  taxi: 'Taxi & Grab',
  markt: 'Markt',
  smalltalk: 'Smalltalk',
  unterwegs: 'Unterwegs',
  zuhause: 'Zuhause',
  gefuehle: 'Gefühle',
  gesundheit: 'Gesundheit',
  arbeit: 'Arbeit',
} as const;
export type SituationTag = keyof typeof SITUATION_TAGS;

/** Sozialer Kontext eines Satzes: legt fest, welches Wort „ich“ und „du“ ist. */
export type ContextId =
  | 'emAnh'
  | 'emChi'
  | 'anhEm'
  | 'conParent'
  | 'chauOng'
  | 'chauBa'
  | 'chauChu'
  | 'chauCo'
  | 'formal';

export interface Word {
  id: WordId;
  vn: string;
  /** Übersetzung; bei kind=particle eine funktionale Erklärung. */
  de: string;
  /** Vereinfachte Aussprachehilfe; fehlt bei noch nicht ergänzten Wörtern. */
  pron?: string;
  /** true, wenn pron KI-erstellt und noch nicht von einer Muttersprachlerin bestätigt ist. */
  pronAi?: boolean;
  verb: boolean;
  kind: 'word' | 'particle';
  stage: StageId;
  tags: SituationTag[];
  /** false = vorbereiteter Inhalt, Natürlichkeit noch nicht von der Verlobten geprüft. */
  checked: boolean;
}

export interface Sentence {
  id: SentenceId;
  vn: string;
  de: string;
  /** Vokabeln im Satz; der Satz wird frei, sobald alle mindestens einmal gesehen wurden. */
  words: WordId[];
  ctx?: ContextId;
  stage: StageId;
  tags: SituationTag[];
  checked: boolean;
}

export interface SentenceContext {
  id: ContextId;
  label: string;
  /** Wort für „ich“. */
  self: WordId;
  /** Wörter für „du“ (leer = förmlich, meist ohne Pronomen). */
  addr: WordId[];
}

/** Anrede-Rolle: Gegenüber → welches Wort für mich (self), welches für die Person (addr). */
export interface Role {
  id: string;
  label: string;
  self: WordId;
  addr: WordId | null;
  stage: StageId;
}

export interface Region {
  id: RegionId;
  /** Anzeigename mit Diakritika, z. B. „Hội An“. */
  name: string;
  subtitle: string;
}

export interface Stage {
  id: StageId;
  region: RegionId;
  title: string;
  kind: StageKind;
}

export interface Content {
  regions: Region[];
  /** In Spielreihenfolge. */
  stages: Stage[];
  words: Word[];
  sentences: Sentence[];
  roles: Role[];
  contexts: SentenceContext[];
}
