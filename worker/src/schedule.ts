/**
 * Erinnerungs-Logik des Push-Workers (rein, ohne Worker-APIs – per Vitest getestet).
 * Alle Uhrzeiten gelten in Europe/Berlin; Sommer-/Winterzeit übernimmt Intl.
 */

export type Slot = 'morning' | 'evening';

/** Was der Worker in KV über den einen Nutzer speichert. */
export interface PushUser {
  subscription: PushSubscriptionData | null;
  /** HH:MM, Europe/Berlin. */
  morning: string;
  evening: string;
  /** Fällige Wiederholungen je Datum (kumulativ), gemeldet beim Session-Ende. */
  dueByDate: Record<string, number>;
  /** Letzter Tag, an dem das Tagesziel erreicht wurde. */
  goalDate: string | null;
  /** Datum der letzten Erinnerung je Slot – höchstens eine pro Tag. */
  sent: Record<Slot, string | null>;
}

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

export const ZONE = 'Europe/Berlin';
/** Nach der eingestellten Zeit wird noch so lange nachgeholt (Cron-Raster, Ausfälle). */
export const SEND_WINDOW_MIN = 60;

export function emptyUser(): PushUser {
  return {
    subscription: null,
    morning: '08:00',
    evening: '20:00',
    dueByDate: {},
    goalDate: null,
    sent: { morning: null, evening: null },
  };
}

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Berliner Ortszeit eines Zeitpunkts: Datum YYYY-MM-DD und Minuten seit Mitternacht. */
export function berlinTime(at: Date): { date: string; minutes: number } {
  const parts = Object.fromEntries(fmt.formatToParts(at).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return h * 60 + m;
};

/** UTC-Zeitpunkt, zu dem es in Berlin am Datum `date` die Uhrzeit `hhmm` ist (für Anzeige und Tests). */
export function berlinToUtc(date: string, hhmm: string): Date {
  const [y, mo, d] = date.split('-').map(Number) as [number, number, number];
  const wanted = Date.UTC(y, mo - 1, d) + toMinutes(hhmm) * 60_000;
  // Versatz ermitteln und einmal nachkorrigieren (reicht für ganzstündige Zonenwechsel).
  let guess = wanted;
  for (let i = 0; i < 2; i++) {
    const local = berlinTime(new Date(guess));
    const [ly, lm, ld] = local.date.split('-').map(Number) as [number, number, number];
    const localMs = Date.UTC(ly, lm - 1, ld) + local.minutes * 60_000;
    guess += wanted - localMs;
  }
  return new Date(guess);
}

/** Fällige Wiederholungen an einem Tag; jenseits der gemeldeten Vorschau der letzte bekannte Stand. */
export function dueOn(user: PushUser, date: string): number {
  const days = Object.keys(user.dueByDate)
    .filter((d) => d <= date)
    .sort();
  const last = days[days.length - 1];
  return last ? user.dueByDate[last]! : 0;
}

export interface Reminder {
  slot: Slot;
  date: string;
  /** false = Slot ist dran, aber entfällt (Abend mit erreichtem Tagesziel); trotzdem als erledigt merken. */
  send: boolean;
}

/** Welche Erinnerungen der Cron-Lauf um `now` auslösen soll. */
export function remindersDue(now: Date, user: PushUser): Reminder[] {
  if (!user.subscription) return [];
  const { date, minutes } = berlinTime(now);
  const out: Reminder[] = [];
  for (const slot of ['morning', 'evening'] as const) {
    const start = toMinutes(user[slot]);
    if (user.sent[slot] === date || minutes < start || minutes >= start + SEND_WINDOW_MIN) continue;
    out.push({ slot, date, send: slot === 'morning' || user.goalDate !== date });
  }
  return out;
}

export function reminderText(slot: Slot, date: string, user: PushUser): { title: string; body: string } {
  if (slot === 'evening') {
    return { title: 'Tagesziel noch offen', body: 'Drei Minuten reichen, damit deine Serie hält.' };
  }
  const due = dueOn(user, date);
  return due > 0
    ? { title: 'Zeit für Vietnamesisch', body: due === 1 ? 'Eine Wiederholung wartet auf dich.' : `${due} Wiederholungen warten auf dich.` }
    : { title: 'Zeit für Vietnamesisch', body: 'Eine kurze Runde für deine Serie?' };
}
