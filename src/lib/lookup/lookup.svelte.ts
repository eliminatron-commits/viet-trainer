import type { SentenceId, WordId } from '../../content/types';

/**
 * Satzlupe und Wortkarte: ein Blatt über der aktuellen Ansicht, mit eigenem Verlauf (Satz → Wort → anderer Satz …).
 * Geöffnet von überall, wo Vietnamesisch steht (Sprachführer, Lösung in der Runde, Wort-Chips der Etappe).
 */
export type LookupView = { kind: 'sentence'; id: SentenceId } | { kind: 'word'; id: WordId; from?: SentenceId };

export const lookup = $state<{ stack: LookupView[]; dir: 1 | -1 }>({ stack: [], dir: 1 });

/** Element, das das Blatt geöffnet hat – bekommt beim Schließen den Fokus zurück. */
let opener: HTMLElement | null = null;

export function openLookup(view: LookupView): void {
  if (!lookup.stack.length) opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  lookup.dir = 1;
  lookup.stack = [view];
}

export function pushLookup(view: LookupView): void {
  lookup.dir = 1;
  lookup.stack = [...lookup.stack, view];
}

export function backLookup(): void {
  lookup.dir = -1;
  lookup.stack = lookup.stack.slice(0, -1);
}

export function closeLookup(): void {
  lookup.stack = [];
  opener?.focus({ preventScroll: true });
  opener = null;
}
