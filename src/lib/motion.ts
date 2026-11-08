import { tick } from 'svelte';

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Nur per Feature-Detection: iOS 18+ Safari kann same-document View Transitions. */
export const supportsViewTransitions = () => typeof document !== 'undefined' && 'startViewTransition' in document;

/**
 * Art des Ansichtswechsels – die Choreografie steht in base.css unter `:root[data-vt=…]`.
 * - morph-open / morph-close: dieselbe Karte wächst zum Vollbild bzw. schrumpft zurück (Lernpfad ↔ Etappe)
 * - tab-next / tab-prev: Seiten gleiten in Richtung des gewählten Tabs
 * - push / pop: Unterseite schiebt sich von rechts herein bzw. zurück (Einstellungen)
 * - reveal: Session öffnet sich als Kreis vom Tippunkt aus (wie die Tipp-Welle im Vorbild)
 * - sheet-down: Session sinkt wie ein Blatt hinunter und gibt die Welt dahinter frei
 * - theme: Tag/Nacht wechselt als Kreis (vom Tippunkt bzw. vom Himmel oben rechts)
 * Außer bei morph-* sind alle Inline-`view-transition-name`s abgeschaltet (base.css), sonst
 * ploppt z. B. die Etappenkarte deckend über die alte Ansicht.
 */
export type Motion = 'morph-open' | 'morph-close' | 'tab-next' | 'tab-prev' | 'push' | 'pop' | 'reveal' | 'sheet-down' | 'theme';

let seq = 0;

/**
 * Art des laufenden Wechsels – auch ohne View Transition (reduzierte Bewegung, ältere Browser), damit eine Ansicht
 * beim Einhängen weiß, wie sie betreten wurde (z. B. Scrollstand nach morph-close wiederherstellen).
 */
let current: Motion | null = null;
export const arrivingBy = (): Motion | null => current;

/** Letzter Tippunkt – Mittelpunkt des Kreises bei „reveal“ und „theme“. */
let tap = { x: 0, y: 0 };
if (typeof window !== 'undefined')
  window.addEventListener('pointerdown', (e: PointerEvent) => (tap = { x: e.clientX, y: e.clientY }), { capture: true, passive: true });

/**
 * Führt einen Ansichtswechsel aus – mit View Transition, wenn verfügbar und Bewegung erwünscht ist.
 * `origin`: Kreismittelpunkt bei reveal/theme (sonst der letzte Tippunkt). `over`: der Wechsel startet aus einem Blatt
 * (Tagesblick, Rückblick) – Navigation und Statusleiste gehören dann zum Bild unter dem Blatt statt darüber (base.css).
 */
export function transitionTo(update: () => void, motion: Motion, origin?: { x: number; y: number }, over = false): void {
  const id = ++seq;
  current = motion;
  if (!supportsViewTransitions() || reducedMotion()) {
    update();
    void tick().then(() => {
      if (id === seq) current = null;
    });
    return;
  }
  const root = document.documentElement;
  root.dataset.vt = motion;
  if (over) root.dataset.vtOver = '';
  else delete root.dataset.vtOver;
  if (motion === 'reveal' || motion === 'theme') {
    const o = origin ?? { x: tap.x || innerWidth / 2, y: tap.y || innerHeight * 0.8 };
    root.style.setProperty('--vt-x', `${o.x}px`);
    root.style.setProperty('--vt-y', `${o.y}px`);
  }
  const vt = document.startViewTransition(async () => {
    update();
    await tick();
  });
  void vt.finished.finally(() => {
    if (id !== seq) return;
    delete root.dataset.vt;
    delete root.dataset.vtOver;
    current = null;
  });
}


/** Wurde die Ansicht gerade per Tab-Wechsel betreten? (beim Initialisieren aufrufen) → Klasse `arrive`, base.css. */
export const arrivingByTab = () => document.documentElement.dataset.vt?.startsWith('tab') ?? false;
