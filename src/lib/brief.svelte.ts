/**
 * Trâus Tagesblick – einmal in App.svelte. Öffnet von selbst bei der ersten Öffnung am Tag (App.svelte); am ersten Tag
 * einer neuen Woche ist er stattdessen die letzte Seite des Wochenrückblicks. Jederzeit über Trâu oben im Lernpfad
 * (PathScreen). Beim Schließen kehrt der Fokus zurück.
 */
export const brief = $state<{ open: boolean }>({ open: false });

let opener: HTMLElement | null = null;

/** `from`: das angetippte Element – Safari fokussiert Knöpfe beim Antippen nicht, der Fokus soll aber dorthin zurück. */
export function openBrief(from?: HTMLElement): void {
  opener = from ?? (document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null);
  brief.open = true;
}

export function closeBrief(): void {
  if (!brief.open) return;
  brief.open = false;
  opener?.focus({ preventScroll: true });
  opener = null;
}
