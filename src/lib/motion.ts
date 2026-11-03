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
let seq = 0;

/**
 * `morph` nur für Wechsel, bei denen dasselbe Element auf beiden Seiten steht (Lernpfad ↔ Etappe).
 * Sonst schaltet `data-vt="plain"` alle Inline-`view-transition-name`s ab (base.css) – sonst
 * ploppt z. B. die Etappenkarte beim Tab-Wechsel deckend über die ausblendende alte Ansicht.
 */
export function transitionTo(update: () => void, { morph = false } = {}): void {
  if (!supportsViewTransitions() || reducedMotion()) {
    update();
    return;
  }
  const root = document.documentElement;
  const id = ++seq;
  if (morph) delete root.dataset.vt;
  else root.dataset.vt = 'plain';
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
