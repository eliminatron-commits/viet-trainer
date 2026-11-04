/** Darstellung: automatisch nach Uhrzeit oder fest hell bzw. dunkel (Einstellungen). */
export type ThemeMode = 'auto' | 'light' | 'dark';

/** Nacht von 20:00 bis 8:59 Uhr Ortszeit (Alex, 2026-11-04). */
export const NIGHT_FROM = 20;
export const NIGHT_UNTIL = 9;

export const isNightAt = (d: Date) => d.getHours() >= NIGHT_FROM || d.getHours() < NIGHT_UNTIL;

/** Ob die App dunkel erscheint: im Automatik-Modus nach Uhrzeit, sonst fest. */
export function isDark(mode: ThemeMode, now: Date): boolean {
  return mode === 'auto' ? isNightAt(now) : mode === 'dark';
}

/** Millisekunden bis zum nächsten automatischen Wechsel (9:00 oder 20:00 Uhr Ortszeit, auch über Zeitumstellungen). */
export function msUntilSwitch(now: Date): number {
  const next = new Date(now);
  next.setHours(isNightAt(now) ? NIGHT_UNTIL : NIGHT_FROM, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}
