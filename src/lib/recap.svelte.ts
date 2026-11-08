import type { DateKey } from './storage/state';

/**
 * Wochenrückblick „Deine Woche“ – einmal in App.svelte. Öffnet von selbst bei der ersten Öffnung einer neuen Woche
 * (App.svelte) oder aus dem Laternen-Kalender. Beim Schließen kehrt der Fokus zum auslösenden Element zurück.
 */
/** brief: Trâus Tagesblick als letzte Seite (am ersten Tag einer neuen Woche, von selbst geöffnet). */
export const recap = $state<{ week: DateKey | null; brief: boolean }>({ week: null, brief: false });

let opener: HTMLElement | null = null;

export function openRecap(week: DateKey, brief = false): void {
  opener = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
  recap.week = week;
  recap.brief = brief;
}

export function closeRecap(): void {
  if (!recap.week) return;
  recap.week = null;
  recap.brief = false;
  opener?.focus({ preventScroll: true });
  opener = null;
}
