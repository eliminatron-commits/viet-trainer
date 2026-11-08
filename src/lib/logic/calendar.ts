import type { DateKey, DayLog, SaveState } from '../storage/state';

/**
 * Laternen-Kalender im Profil: je Tag eine Laterne aus dem Tagebuch (`save.days`). Sie bleibt aus, leuchtet nach
 * einem Lerntag, leuchtet rot mit Lichthof nach erreichtem Tagesziel und meerblau, wenn der Streak-Schutz den Tag
 * überbrückt hat. Vor dem Tagebuch gibt es keine Zahlen (nicht rekonstruierbar – PROGRESS.md, Phase 6).
 */

/** Seit diesem Tag zählt das Tagebuch (Update `d1a89bd`). */
export const DIARY_START: DateKey = '2026-11-07';

/** Jahr und Monat, YYYY-MM. */
export type MonthKey = string;

export type Lantern = 'off' | 'learned' | 'goal' | 'shield' | 'before' | 'future';

export interface CalendarDay {
  date: DateKey;
  day: number;
  lantern: Lantern;
  today: boolean;
  log: DayLog | null;
}

export interface CalendarMonth {
  month: MonthKey;
  title: string;
  /** Leere Felder vor dem 1. (Woche beginnt Montag). */
  lead: number;
  days: CalendarDay[];
  /** Lerntage (gelernt oder Tagesziel), Tagesziele, überbrückte Tage. */
  learned: number;
  goals: number;
  shields: number;
}

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const parts = (d: DateKey) => d.split('-').map(Number) as [number, number, number];
const pad = (n: number) => String(n).padStart(2, '0');

export const monthOf = (d: DateKey): MonthKey => d.slice(0, 7);

export function shiftMonth(m: MonthKey, n: number): MonthKey {
  const [y, mo] = m.split('-').map(Number) as [number, number];
  const t = y * 12 + (mo - 1) + n;
  return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}`;
}

/** Wochentag, Montag = 0. */
const weekday = (d: DateKey) => {
  const [y, m, day] = parts(d);
  return (new Date(Date.UTC(y, m - 1, day)).getUTCDay() + 6) % 7;
};

/** Hat an diesem Tag etwas stattgefunden? (Ein überbrückter Tag allein zählt nicht.) */
export const activeDay = (log: DayLog) => log.tasks > 0 || log.newWords > 0 || log.rounds > 0 || log.xp > 0;

/** Ab wann das Tagebuch für diesen Spielstand zählt: Update mit dem Tagebuch oder Beginn des Spielstands. */
export function diaryStart(save: SaveState): DateKey {
  const created = save.createdAt.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(created) && created > DIARY_START ? created : DIARY_START;
}

/** Zustand der Laterne. Vorrang: Zukunft, Tagesziel, Streak-Schutz, gelernt; ohne Eintrag aus bzw. vor dem Tagebuch. */
export function lanternOf(log: DayLog | undefined, date: DateKey, today: DateKey, start: DateKey): Lantern {
  if (date > today) return 'future';
  if (log?.goal) return 'goal';
  if (log?.shield) return 'shield';
  if (log && activeDay(log)) return 'learned';
  return date < start ? 'before' : 'off';
}

/** Blätterbare Monate: vom ersten Eintrag (spätestens diesem Monat) bis zum laufenden Monat. */
export function monthRange(save: SaveState, today: DateKey): { first: MonthKey; last: MonthKey } {
  const earliest = Object.keys(save.days).reduce((a, k) => (k < a ? k : a), today);
  return { first: monthOf(earliest), last: monthOf(today) };
}

export function calendarMonth(save: SaveState, month: MonthKey, today: DateKey): CalendarMonth {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const start = diaryStart(save);
  const days: CalendarDay[] = [];
  for (let day = 1; day <= count; day++) {
    const date = `${month}-${pad(day)}`;
    const log = save.days[date] ?? null;
    days.push({ date, day, lantern: lanternOf(log ?? undefined, date, today, start), today: date === today, log });
  }
  const has = (l: Lantern) => days.filter((d) => d.lantern === l).length;
  return {
    month,
    title: `${MONTHS[m - 1]} ${y}`,
    lead: weekday(`${month}-01`),
    days,
    learned: has('learned') + has('goal'),
    goals: has('goal'),
    shields: has('shield'),
  };
}

/** „7. November 2026“ */
export function dateText(d: DateKey): string {
  const [y, m, day] = parts(d);
  return `${day}. ${MONTHS[m - 1]} ${y}`;
}

/** „Samstag, 7. November“ */
export function dayTitle(d: DateKey): string {
  const [, m, day] = parts(d);
  return `${WEEKDAYS[weekday(d)]}, ${day}. ${MONTHS[m - 1]}`;
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Zeile unter dem Monat: „5 Lerntage · 3 Tagesziele“. */
export function monthSummary(c: CalendarMonth): string {
  if (c.learned === 0) return c.shields > 0 ? count(c.shields, 'Tag vom Streak-Schutz gerettet', 'Tage vom Streak-Schutz gerettet') : 'Noch kein Lerntag';
  return `${count(c.learned, 'Lerntag', 'Lerntage')} · ${count(c.goals, 'Tagesziel', 'Tagesziele')}`;
}

export interface DayInfo {
  title: string;
  status: string;
  /** Immer vier Zahlen (gleiche Höhe für jeden Tag); vor dem Tagebuch ohne Wert. */
  numbers: { value: string; label: string }[];
}

/** Was ein angetippter Tag zeigt. */
export function dayInfo(d: CalendarDay, start: DateKey): DayInfo {
  const log = d.log;
  const rounds = log && log.rounds > 0 ? ` · ${count(log.rounds, 'Runde', 'Runden')}` : '';
  const status: Record<Lantern, string> = {
    goal: 'Tagesziel erreicht',
    learned: d.today ? 'Gelernt – das Tagesziel fehlt noch' : 'Gelernt, Tagesziel nicht erreicht',
    shield: 'Der Streak-Schutz hat die Serie gerettet',
    off: d.today ? 'Heute noch nichts gelernt' : 'Nicht gelernt',
    before: `Vor dem Tagebuch – es zählt seit dem ${dateText(start)}`,
    future: 'Noch nicht da',
  };
  const none = d.lantern === 'before' || d.lantern === 'future';
  const v = (n: number | undefined) => (none ? '–' : String(n ?? 0));
  const n = (k: keyof DayLog) => (log ? (log[k] as number) : 0);
  return {
    title: dayTitle(d.date),
    status: status[d.lantern] + (none ? '' : rounds),
    numbers: [
      { value: v(n('xp')), label: 'XP' },
      { value: v(n('tasks')), label: n('tasks') === 1 ? 'Aufgabe' : 'Aufgaben' },
      { value: v(n('right')), label: 'richtig' },
      { value: v(n('newWords')), label: n('newWords') === 1 ? 'neues Wort' : 'neue Wörter' },
    ],
  };
}
