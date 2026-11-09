import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import type { RegionId } from '../src/content/types';
import { completeStage } from '../src/lib/logic/path';
import {
  nextRegion,
  replayable,
  rideProgress,
  rideTimeAt,
  trackOffset,
  TRIP,
  tripAfterWin,
  tripLanding,
  tripStop,
  tripSwap,
  TUNNEL_HALF,
  tunnelCenter,
} from '../src/lib/logic/trip';
import { newSave, type SaveState } from '../src/lib/storage/state';

const stagesOf = (r: RegionId) => content.stages.filter((s) => s.region === r);
/** Alle Etappen bis einschließlich der Regionen `regions` geschafft. */
function done(...regions: RegionId[]): SaveState {
  const save = newSave(new Date('2026-11-10T08:00:00'));
  for (const r of regions) for (const s of stagesOf(r)) completeStage(save, s.id, 3);
  return save;
}

describe('Reise: wann und wohin', () => {
  it('die Regionen folgen in Spielreihenfolge, nach Sài Gòn geht es nicht weiter', () => {
    expect(nextRegion('danang')).toBe('hoian');
    expect(nextRegion('hoian')).toBe('hue');
    expect(nextRegion('hue')).toBe('hanoi');
    expect(nextRegion('hanoi')).toBe('saigon');
    expect(nextRegion('saigon')).toBeNull();
  });

  it('nur der erste Sieg über den letzten Boss einer Region startet die Reise', () => {
    const last = stagesOf('danang').at(-1)!;
    const save = done('danang');
    expect(tripAfterWin(save, last, true)).toBe('danang');
    // derselbe Boss noch einmal besiegt: keine zweite Reise
    expect(tripAfterWin(save, last, false)).toBeNull();
  });

  it('ein Boss mitten in der Region startet keine Reise', () => {
    const save = newSave(new Date('2026-11-10T08:00:00'));
    const first = stagesOf('danang')[0]!;
    completeStage(save, first.id, 3);
    expect(tripAfterWin(save, first, true)).toBeNull();
  });

  it('nach dem letzten Boss von Sài Gòn gibt es keine Reise (kein Finale)', () => {
    const save = done('danang', 'hoian', 'hue', 'hanoi', 'saigon');
    expect(tripAfterWin(save, stagesOf('saigon').at(-1)!, true)).toBeNull();
    expect(tripAfterWin(save, stagesOf('hanoi').at(-1)!, true)).toBe('hanoi');
  });

  it('im Reisepass wiederholbar: geschaffte Regionen mit einer nächsten', () => {
    const save = done('danang');
    expect(replayable(save, 'danang')).toBe(true);
    expect(replayable(save, 'hoian')).toBe(false);
    const all = done('danang', 'hoian', 'hue', 'hanoi', 'saigon');
    expect(content.regions.filter((r) => replayable(all, r.id)).map((r) => r.id)).toEqual(['danang', 'hoian', 'hue', 'hanoi']);
  });
});

describe('Reise: Fahrprofil und Zeitplan', () => {
  const speed = (u: number, h = 1e-4) => (rideProgress(u + h) - rideProgress(u - h)) / (2 * h);

  it('beginnt bei 0, endet bei 1 und läuft nie rückwärts', () => {
    expect(rideProgress(0)).toBe(0);
    expect(rideProgress(1)).toBeCloseTo(1, 10);
    for (let i = 1; i <= 200; i++) expect(rideProgress(i / 200)).toBeGreaterThan(rideProgress((i - 1) / 200));
  });

  it('fährt weich an und hält weich (Geschwindigkeit 0 an den Enden)', () => {
    expect(speed(0.001)).toBeLessThan(0.01);
    expect(speed(0.999)).toBeLessThan(0.01);
  });

  it('ohne Ruck an den Übergängen: gleiche Geschwindigkeit links und rechts von Anfahren und Bremsen', () => {
    for (const u of [TRIP.accel, TRIP.brake]) expect(speed(u - 0.002)).toBeCloseTo(speed(u + 0.002), 1);
    // gleitet mit Höchstgeschwindigkeit
    expect(speed(0.45)).toBeCloseTo(speed(TRIP.accel + 0.01), 3);
  });

  it('rideTimeAt kehrt rideProgress um', () => {
    for (const p of [0.1, 0.3, 0.5, 0.77, 0.95]) expect(rideProgress(rideTimeAt(p))).toBeCloseTo(p, 6);
  });

  it('der Ortswechsel liegt mitten im Tunnel: das Innere deckt das ganze Bild, auch mit Spiel im Zeitgeber', () => {
    const [a, b] = [tunnelCenter() - TUNNEL_HALF, tunnelCenter() + TUNNEL_HALF];
    for (const dt of [-120, 0, 120]) {
      const off = trackOffset(tripSwap() + dt);
      expect(a - off).toBeLessThanOrEqual(0);
      expect(b - off).toBeGreaterThanOrEqual(400);
    }
    // vorher und nachher ist der Tunnel nicht im Bild: Abfahrt an der Küste, Ankunft im Ort
    expect(a - trackOffset(TRIP.start)).toBeGreaterThan(400 + 130);
    expect(b + 130 - trackOffset(tripStop())).toBeLessThan(0);
  });

  it('Reihenfolge: Wechsel beim Gleiten, dann Halt, dann landet das Souvenir', () => {
    const swap = (tripSwap() - TRIP.start) / TRIP.ride;
    expect(swap).toBeGreaterThan(TRIP.accel);
    expect(swap).toBeLessThan(TRIP.brake);
    expect(tripStop()).toBeGreaterThan(tripSwap());
    expect(tripLanding()).toBeGreaterThan(tripStop());
  });
});
