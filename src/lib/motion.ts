import { tick } from 'svelte';
import { crossfade } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Nur per Feature-Detection: iOS 18+ Safari kann same-document View Transitions. */
export const supportsViewTransitions = () => typeof document !== 'undefined' && 'startViewTransition' in document;

/**
 * Art des Ansichtswechsels – die Choreografie steht in base.css unter `:root[data-vt=…]`.
 * - morph-open / morph-close: dieselbe Karte wächst zum Vollbild bzw. schrumpft zurück (Lernpfad ↔ Etappe)
 * - tab-next / tab-prev: Seiten gleiten in Richtung des gewählten Tabs
 * - push / pop: Unterseite schiebt sich von rechts herein bzw. zurück (Einstellungen)
 * - sheet-up / sheet-down: Session fährt wie ein Blatt von unten hoch bzw. wieder hinunter
 * Außer bei morph-* sind alle Inline-`view-transition-name`s abgeschaltet (base.css), sonst
 * ploppt z. B. die Etappenkarte deckend über die alte Ansicht.
 */
export type Motion = 'morph-open' | 'morph-close' | 'tab-next' | 'tab-prev' | 'push' | 'pop' | 'sheet-up' | 'sheet-down';

let seq = 0;

/** Führt einen Ansichtswechsel aus – mit View Transition, wenn verfügbar und Bewegung erwünscht ist. */
export function transitionTo(update: () => void, motion: Motion): void {
  if (!supportsViewTransitions() || reducedMotion()) {
    update();
    return;
  }
  const root = document.documentElement;
  const id = ++seq;
  root.dataset.vt = motion;
  const vt = document.startViewTransition(async () => {
    update();
    await tick();
  });
  void vt.finished.finally(() => {
    if (id === seq) delete root.dataset.vt;
  });
}

/**
 * Fallback-Morph für Browser ohne View Transitions. Bei verfügbarer View Transition
 * oder reduzierter Bewegung dauert er 0 ms, damit nichts doppelt animiert.
 */
export const [send, receive] = crossfade({
  duration: () => (supportsViewTransitions() || reducedMotion() ? 0 : 380),
  easing: cubicOut,
});
