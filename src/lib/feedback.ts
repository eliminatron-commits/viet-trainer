import { uiContext } from './audio/player';
import { game } from './game.svelte';

/**
 * Rückmeldung ohne Dateien: UI-Klänge per WebAudio synthetisiert (Kontext aus player.ts) und ein leichter
 * Haptik-Tick über den iOS-18-Trick (verstecktes <input type="checkbox" switch>, nur per Feature-Detection).
 * Beides lässt sich in den Einstellungen abschalten (settings.sound / settings.haptics).
 */

export type Cue = 'right' | 'wrong' | 'chest' | 'levelup';

/** Ton: Frequenz (Hz), Einsatz und Dauer (s), Lautstärke, optional Gleiten zur Zielfrequenz. */
type Note = { f: number; at: number; dur: number; vol: number; to?: number; wave?: OscillatorType };

// Pentatonisch und weich (Dreieck/Sinus), kurz genug, um das folgende Wort-Audio nicht zu überdecken.
const CUES: Record<Cue, Note[]> = {
  right: [
    { f: 659.3, at: 0, dur: 0.14, vol: 0.16 },
    { f: 987.8, at: 0.08, dur: 0.22, vol: 0.16 },
  ],
  wrong: [{ f: 233.1, at: 0, dur: 0.3, vol: 0.14, to: 174.6, wave: 'sine' }],
  chest: [
    { f: 523.3, at: 0, dur: 0.16, vol: 0.13 },
    { f: 659.3, at: 0.07, dur: 0.16, vol: 0.13 },
    { f: 784, at: 0.14, dur: 0.16, vol: 0.13 },
    { f: 1046.5, at: 0.21, dur: 0.5, vol: 0.14 },
    { f: 1568, at: 0.28, dur: 0.45, vol: 0.05, wave: 'sine' },
  ],
  levelup: [
    { f: 392, at: 0, dur: 0.14, vol: 0.14 },
    { f: 523.3, at: 0.12, dur: 0.14, vol: 0.14 },
    { f: 659.3, at: 0.24, dur: 0.14, vol: 0.14 },
    { f: 784, at: 0.36, dur: 0.6, vol: 0.16 },
    { f: 392, at: 0.36, dur: 0.6, vol: 0.08, wave: 'sine' },
  ],
};

/** Gesamtlänge eines Klangs in ms (z. B. um Wort-Audio danach zu starten). */
export const cueLength = (cue: Cue) => Math.round(Math.max(...CUES[cue].map((n) => n.at + n.dur)) * 1000);

export function cue(kind: Cue): void {
  if (!game.save.settings.sound) return;
  const c = uiContext();
  if (!c) return;
  const t0 = c.currentTime + 0.01;
  for (const n of CUES[kind]) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const at = t0 + n.at;
    osc.type = n.wave ?? 'triangle';
    osc.frequency.setValueAtTime(n.f, at);
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, at + n.dur);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(n.vol, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + n.dur);
    osc.connect(gain).connect(c.destination);
    osc.start(at);
    osc.stop(at + n.dur + 0.02);
  }
}

let switchSupport: boolean | null = null;

/** iOS 18 lässt beim Umschalten eines `switch`-Kontrollkästchens das Gerät ticken. */
export function hapticsSupported(): boolean {
  switchSupport ??= typeof HTMLInputElement !== 'undefined' && 'switch' in HTMLInputElement.prototype;
  return switchSupport;
}

/** Leichter Tick; muss in einer Nutzergeste laufen. Ohne Unterstützung passiert nichts. */
export function tick(): void {
  if (!game.save.settings.haptics || !hapticsSupported()) return;
  const label = document.createElement('label');
  label.ariaHidden = 'true';
  label.style.display = 'none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  label.remove();
}

/**
 * Rückmeldung auf eine Antwort: Klang und Tick. haptic=false, wenn die Auflösung nicht in einer Geste läuft
 * (Paare enden verzögert bzw. mit der Uhr) – dort tickt die Ansicht selbst beim Tippen.
 */
export function answered(correct: boolean, haptic = true): void {
  cue(correct ? 'right' : 'wrong');
  if (haptic) tick();
}
