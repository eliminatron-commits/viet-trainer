import type { ItemId, StageId } from '../../content/types';
import type { ThemeMode } from '../logic/theme';

/** Lokales Datum im Format YYYY-MM-DD (Europe/Berlin = Gerätezeit). */
export type DateKey = string;

/** Lerneinheit einer Anrede-Rolle: „wie nenne ich mich?“ (self) bzw. „wie rede ich an?“ (addr). */
export type RoleKey = `${string}:self` | `${string}:addr`;
/** Schlüssel im SRS: Wort, Satz oder Rollen-Einheit. */
export type ProgressKey = ItemId | RoleKey;

/** Leitner-Fortschritt eines Wortes/Satzes. Box 1–5 ↔ Intervalle 1/2/4/8/16 Tage. */
export interface ItemProgress {
  box: 1 | 2 | 3 | 4 | 5;
  due: DateKey;
  seen: number;
  right: number;
  wrong: number;
}

export interface StageProgress {
  done: boolean;
  /** Beste Bosskampf-Wertung (übrige Leben). */
  bossBest: number;
}

export interface ReviewVerdict {
  verdict: 'ok' | 'unnatural';
  note: string;
}

export interface Settings {
  /** Erinnerungszeiten HH:MM, Europe/Berlin. */
  morning: string;
  evening: string;
  sound: boolean;
  haptics: boolean;
  /** Darstellung: 'auto' = Nacht von 20 bis 9 Uhr, sonst Tag; oder fest gewählt. */
  theme: ThemeMode;
  /** Trâus Tagesblick bei der ersten Öffnung am Tag. */
  brief: boolean;
}

/** Zähler für Achievements und Wochen-Challenges. */
export interface Stats {
  /** Richtig gelöste Aufgaben insgesamt. */
  correct: number;
  /** Richtige Aufgaben in Folge: aktuell und Bestwert. */
  combo: number;
  bestCombo: number;
  /** Beendete Runden (Etappe, Training, Bosskampf). */
  rounds: number;
  bossWins: number;
  /** Bosse ohne verlorenes Leben. */
  perfectBosses: number;
  /** Vorgestellte neue Wörter. */
  newWords: number;
  /** Tage, an denen das Tagesziel erreicht wurde. */
  goals: number;
  /** Geöffnete Truhen. */
  chests: number;
  /** Richtig gelöste Aufgaben der Spielmodi aus Phase 3. */
  pairs: number;
  builds: number;
  dictations: number;
  tones: number;
}
export type StatKey = keyof Stats;

/** Wochen-Challenge: Fortschritt = Zählerstand minus Stand zu Wochenbeginn (base). */
export interface ChallengeState {
  id: string;
  base: number;
  done: boolean;
}

/** Tagebuch: was an einem Tag geschah (zählt ab dem Update mit dem Tagebuch, frühere Tage fehlen). */
export interface DayLog {
  /** Tages-XP (wie `today.xp`, mit Boost und Challenge-XP). */
  xp: number;
  /** Gelöste Aufgaben und davon richtige. */
  tasks: number;
  right: number;
  /** Erstmals vorgestellte Wörter. */
  newWords: number;
  /** Beendete Runden (Etappe, Training, Bosskampf). */
  rounds: number;
  /** Tagesziel erreicht. */
  goal: boolean;
  /** Verpasster Tag, den der Streak-Schutz überbrückt hat. */
  shield: boolean;
}

export const emptyDay = (): DayLog => ({ xp: 0, tasks: 0, right: 0, newWords: 0, rounds: 0, goal: false, shield: false });

/** Eine Challenge am Ende ihrer Woche: Fortschritt (gedeckelt aufs Ziel) und ob geschafft. */
export interface ChallengeResult {
  id: string;
  progress: number;
  done: boolean;
}

/** Wochenarchiv: was beim Wochenwechsel sonst verloren ginge (die Challenges der Woche). */
export interface WeekLog {
  challenges: ChallengeResult[];
}

/** Roller-Sprint: Bestzeit gesamt, Bestzeit der Woche (week = deren Montag), Zahl der Fahrten; Zeiten in ms. */
export interface SprintRecord {
  best: number | null;
  week: DateKey | null;
  weekBest: number | null;
  runs: number;
}

/** Gesamter Spielstand; liegt als ein Datensatz in IndexedDB und wird bei jeder Aktion sofort geschrieben. */
export interface SaveState {
  version: 1;
  createdAt: string;
  items: Partial<Record<ProgressKey, ItemProgress>>;
  stages: Partial<Record<StageId, StageProgress>>;
  xp: number;
  /** XP des heutigen Tages; Tagesziel erreicht ⇒ Streak +1. */
  today: { date: DateKey; xp: number };
  dailyGoal: number;
  /** Serie; best = längste Serie, shields = Streak-Schutz (überbrückt verpasste Tage automatisch). */
  streak: { count: number; lastDate: DateKey | null; shields: number; best: number };
  /**
   * Ungeöffnete Truhen (davon perfectChests aus makellosen Bossen: garantiertes Accessoire),
   * XP-Boosts (aktiv bis boostUntil, ISO-Zeit), Accessoires des Büffels.
   */
  inventory: {
    chests: number;
    perfectChests: number;
    xpBoosts: number;
    boostUntil: string | null;
    accessories: string[];
    equipped: string[];
  };
  stats: Stats;
  /** Achievement-ID → Datum der Vergabe. */
  achievements: Record<string, DateKey>;
  /** Montag der laufenden Woche und ihre drei Challenges. */
  challenges: { week: DateKey | null; list: ChallengeState[] };
  favorites: ItemId[];
  /** Prüfmodus-Urteile der Muttersprachlerin. */
  review: Partial<Record<ItemId, ReviewVerdict>>;
  settings: Settings;
  /** Trâus Hof: zuletzt gefüttert (einmal am Tag, nach erreichtem Tagesziel) und wie oft insgesamt. */
  yard: { fedOn: DateKey | null; fed: number };
  /** Tagebuch je Kalendertag (nur Tage mit Aktivität oder Streak-Schutz). */
  days: Record<DateKey, DayLog>;
  sprint: SprintRecord;
  /** Wochenarchiv je Montag (ab dem Update mit dem Wochenrückblick). */
  weeks: Record<DateKey, WeekLog>;
  /** Wochenrückblick: Montag der Woche, deren Rückblick zuletzt von selbst gezeigt wurde. */
  recap: { seen: DateKey | null };
  /** Trâus Tagesblick: Tag, an dem er zuletzt von selbst kam. */
  brief: { seen: DateKey | null };
}

export const SAVE_VERSION = 1;

export function dateKey(d: Date): DateKey {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function newSave(now: Date = new Date()): SaveState {
  return {
    version: SAVE_VERSION,
    createdAt: now.toISOString(),
    items: {},
    stages: {},
    xp: 0,
    today: { date: dateKey(now), xp: 0 },
    dailyGoal: 50,
    streak: { count: 0, lastDate: null, shields: 0, best: 0 },
    inventory: { chests: 0, perfectChests: 0, xpBoosts: 0, boostUntil: null, accessories: [], equipped: [] },
    stats: {
      correct: 0,
      combo: 0,
      bestCombo: 0,
      rounds: 0,
      bossWins: 0,
      perfectBosses: 0,
      newWords: 0,
      goals: 0,
      chests: 0,
      pairs: 0,
      builds: 0,
      dictations: 0,
      tones: 0,
    },
    achievements: {},
    challenges: { week: null, list: [] },
    favorites: [],
    review: {},
    settings: { morning: '08:00', evening: '20:00', sound: true, haptics: true, theme: 'auto', brief: true },
    yard: { fedOn: null, fed: 0 },
    days: {},
    sprint: { best: null, week: null, weekBest: null, runs: 0 },
    weeks: {},
    recap: { seen: null },
    brief: { seen: null },
  };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Prüft einen gelesenen/importierten Spielstand und ergänzt fehlende Felder mit
 * Standardwerten (so übersteht ein Stand das Hinzufügen neuer Felder in Updates).
 */
export function normalizeSave(raw: unknown): SaveState {
  if (!isObject(raw)) throw new Error('Kein gültiger Spielstand.');
  if (raw.version !== SAVE_VERSION) throw new Error(`Unbekannte Spielstand-Version: ${String(raw.version)}`);
  const base = newSave();
  const out: Record<string, unknown> = { ...base };
  for (const [key, def] of Object.entries(base)) {
    const v = raw[key];
    if (v === undefined) continue;
    if (Array.isArray(def) !== Array.isArray(v) || typeof def !== typeof v) {
      throw new Error(`Spielstand-Feld „${key}“ hat den falschen Typ.`);
    }
    out[key] = isObject(def) && isObject(v) ? { ...def, ...v } : v;
  }
  const save = out as unknown as SaveState;
  // Stände von vor den Zählern: was sich aus dem Fortschritt ablesen lässt, nachtragen.
  if (raw.stats === undefined) {
    const items = Object.values(save.items);
    const stages = Object.values(save.stages);
    save.stats.correct = items.reduce((n, p) => n + (p?.right ?? 0), 0);
    save.stats.newWords = Object.keys(save.items).filter((k) => k.startsWith('w')).length;
    save.stats.bossWins = stages.filter((s) => s?.done).length;
    save.stats.perfectBosses = stages.filter((s) => s?.bossBest === 3).length;
  }
  save.streak.best = Math.max(save.streak.best, save.streak.count);
  // Tagebuch: Einträge älterer Fassungen um neue Felder ergänzen, Unbrauchbares verwerfen.
  save.days = Object.fromEntries(
    Object.entries(save.days)
      .filter(([k, d]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && isObject(d))
      .map(([k, d]) => [k, { ...emptyDay(), ...d } as DayLog] as const),
  );
  // Roller-Sprint: nur gültige Zeiten übernehmen.
  const time = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
  const sp = save.sprint;
  const week = typeof sp.week === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sp.week) ? sp.week : null;
  save.sprint = {
    best: time(sp.best),
    week,
    weekBest: week ? time(sp.weekBest) : null,
    runs: typeof sp.runs === 'number' && sp.runs >= 0 ? Math.floor(sp.runs) : 0,
  };
  // Wochenarchiv und Rückblick: nur gültige Daten und Einträge übernehmen.
  const isDate = (v: unknown): v is DateKey => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  save.weeks = Object.fromEntries(
    Object.entries(save.weeks)
      .filter(([k, w]) => isDate(k) && isObject(w) && Array.isArray(w.challenges))
      .map(([k, w]) => [
        k,
        {
          challenges: (w.challenges as unknown[])
            .filter((c): c is Record<string, unknown> => isObject(c) && typeof c.id === 'string')
            .map((c) => ({ id: c.id as string, progress: num(c.progress), done: c.done === true })),
        },
      ]),
  );
  save.recap = { seen: isDate(save.recap.seen) ? save.recap.seen : null };
  save.brief = { seen: isDate(save.brief.seen) ? save.brief.seen : null };
  if (typeof save.settings.brief !== 'boolean') save.settings.brief = true;
  return save;
}
