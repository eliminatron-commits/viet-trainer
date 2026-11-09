import { content } from '../../content';
import type { RegionId, Stage } from '../../content/types';
import type { SaveState } from '../storage/state';
import { regionDone } from './path';

/**
 * Reise zur nächsten Region: nach dem ersten Sieg über den Boss, der eine Region abschließt, fährt Trâu im Zug an der
 * Küste zur nächsten (vier Fahrten – nach Sài Gòn gibt es keine). Im Reisepass lässt sich jede Fahrt wiederholen.
 */

/** Die Region nach `id` in Spielreihenfolge, nach der letzten keine. */
export function nextRegion(id: RegionId): RegionId | null {
  const i = content.regions.findIndex((r) => r.id === id);
  return content.regions[i + 1]?.id ?? null;
}

/** Hat dieser (erste) Boss-Sieg eine Region abgeschlossen, nach der es weitergeht? Dann die Region, aus der es losgeht. */
export function tripAfterWin(save: SaveState, stage: Stage, firstWin: boolean): RegionId | null {
  if (!firstWin || !regionDone(save, stage.region)) return null;
  return nextRegion(stage.region) ? stage.region : null;
}

/** Fahrten, die der Reisepass wiederholen kann: geschaffte Regionen mit einer nächsten. */
export const replayable = (save: SaveState, id: RegionId) => regionDone(save, id) && nextRegion(id) !== null;

/**
 * Zeitplan der Fahrt in ms ab dem Öffnen. Der Zug steht im Bild, die Welt zieht vorbei (die Kamera fährt mit):
 * anfahren, gleiten, bremsen. Mitten im Gleiten fährt der Zug durch einen Tunnel (er liegt hinter dem Zug, Trâu
 * bleibt sichtbar); während der Tunnel die Küste verdeckt, wechselt sie zum neuen Ort. Danach fliegt das Souvenir in den
 * Reisepass.
 */
export const TRIP = {
  /** Fahrt beginnt (das Blatt ist dann schon fast aufgegangen) */
  start: 350,
  /** Dauer der Fahrt bis zum Halt */
  ride: 5200,
  /** Ende des Anfahrens bzw. Beginn des Bremsens (Anteil der Fahrt) */
  accel: 0.3,
  brake: 0.6,
  /** Mitte der Tunnel-Deckung (Anteil der Fahrt): hier wechselt die Szene */
  cover: 0.52,
  /** Strecke der Gleise in Szeneneinheiten (viewBox 400×260) */
  dist: 1800,
  /** Souvenir steigt auf (ms nach dem Halt) und landet nach `flight` ms im Reisepass */
  souvenir: 250,
  flight: 1350,
} as const;

/**
 * Tunnel in Strecken-Koordinaten (Szeneneinheiten): sein dunkles Inneres reicht von der Mitte ± `TUNNEL_HALF` und
 * liegt zur Zeit `cover` mittig über dem Bild (x 0..400) – dort wechselt die Küste unsichtbar zum neuen Ort.
 */
export const TUNNEL_HALF = 330;
export const tunnelCenter = () => 200 + TRIP.dist * rideProgress(TRIP.cover);
/** Wie weit die Gleise zur Zeit t (ms ab dem Öffnen) gefahren sind. */
export const trackOffset = (t: number) => TRIP.dist * rideProgress((t - TRIP.start) / TRIP.ride);

export const tripStop = () => TRIP.start + TRIP.ride;
export const tripSwap = () => TRIP.start + TRIP.cover * TRIP.ride;
export const tripLanding = () => tripStop() + TRIP.souvenir + TRIP.flight;

/** Zeitanteil, zu dem die Fahrt den Streckenanteil `p` erreicht (Umkehrung von `rideProgress`, Bisektion). */
export function rideTimeAt(p: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (rideProgress(m) < p) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/** Stammfunktion von smoothstep (3x² − 2x³) ab 0: weiches Anfahren bzw. Bremsen; I(1) = 1/2. */
const ramp = (x: number) => x ** 3 - x ** 4 / 2;

/**
 * Zurückgelegter Anteil der Strecke (0..1) zum Zeitanteil u (0..1). Die Geschwindigkeit steigt weich von 0 auf ihr
 * Maximum (bis `accel`), bleibt bis `brake` gleich und fällt weich auf 0 – ohne Ruck an den Übergängen.
 */
export function rideProgress(u: number, accel: number = TRIP.accel, brake: number = TRIP.brake): number {
  const x = Math.min(1, Math.max(0, u));
  const total = accel / 2 + (brake - accel) + (1 - brake) / 2;
  let s: number;
  if (x < accel) s = accel * ramp(x / accel);
  else if (x < brake) s = accel / 2 + (x - accel);
  else s = accel / 2 + (brake - accel) + (1 - brake) * (0.5 - ramp((1 - x) / (1 - brake)));
  return s / total;
}
