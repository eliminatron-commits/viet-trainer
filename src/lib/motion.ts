import { tick } from 'svelte';
import { crossfade } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Nur per Feature-Detection: iOS 18+ Safari kann same-document View Transitions. */
export const supportsViewTransitions = () => typeof document !== 'undefined' && 'startViewTransition' in document;

/**
 * Führt einen Ansichtswechsel aus – mit View Transition (Shared-Element-Morph über
 * `view-transition-name`), wenn verfügbar und Bewegung erwünscht ist.
 */
export function transitionTo(update: () => void): void {
  if (!supportsViewTransitions() || reducedMotion()) {
    update();
    return;
  }
  document.startViewTransition(async () => {
    update();
    await tick();
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
