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
  streak: { count: number; lastDate: DateKey | null; shields: number };
  inventory: { xpBoosts: number; accessories: string[]; equipped: string[] };
  /** Achievement-ID → Datum der Vergabe. */
  achievements: Record<string, DateKey>;
  challenges: { week: DateKey | null; list: { id: string; progress: number; done: boolean }[] };
  favorites: ItemId[];
  /** Prüfmodus-Urteile der Muttersprachlerin. */
  review: Partial<Record<ItemId, ReviewVerdict>>;
  settings: Settings;
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
    streak: { count: 0, lastDate: null, shields: 0 },
    inventory: { xpBoosts: 0, accessories: [], equipped: [] },
    achievements: {},
    challenges: { week: null, list: [] },
    favorites: [],
    review: {},
    settings: { morning: '08:00', evening: '20:00', sound: true, haptics: true, theme: 'auto' },
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
  return out as unknown as SaveState;
}
