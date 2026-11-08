import type { DateKey } from './storage/state';

/**
 * Wochenrückblick „Deine Woche“ – einmal in App.svelte. Öffnet von selbst bei der ersten Öffnung einer neuen Woche
 * (App.svelte) oder aus dem Laternen-Kalender. Beim Schließen kehrt der Fokus zum auslösenden Element zurück.
 */
export const recap = $state<{ week: DateKey | null }>({ week: null });

let opener: HTMLElement | null = null;

export function openRecap(week: DateKey): void {
  opener = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
  recap.week = week;
}

export function closeRecap(): void {
  recap.week = null;
  opener?.focus({ preventScroll: true });
  opener = null;
}
