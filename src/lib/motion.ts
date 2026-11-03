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
let running: Promise<void> = Promise.resolve();

export function transitionTo(update: () => void): void {
  if (!supportsViewTransitions() || reducedMotion()) {
    update();
    return;
  }
  const vt = document.startViewTransition(async () => {
    update();
    await tick();
  });
  running = vt.finished.catch(() => {});
}

/**
 * Scrollen erst nach dem laufenden Übergang: Scrollen während einer View Transition
 * bringt WebKit zum Absturz (im Playwright-WebKit reproduziert).
 */
export function afterTransition(fn: () => void): void {
  void running.then(fn);
}

/**
 * Fallback-Morph für Browser ohne View Transitions. Bei verfügbarer View Transition
 * oder reduzierter Bewegung dauert er 0 ms, damit nichts doppelt animiert.
 */
export const [send, receive] = crossfade({
  duration: () => (supportsViewTransitions() || reducedMotion() ? 0 : 380),
  easing: cubicOut,
});
