import { describe, expect, it } from 'vitest';
import { covers, routeDashes, routePoint, type Obstacle } from '../src/lib/logic/route';

/** Route im Lernpfad: S-Kurve von Knoten zu Knoten, Striche im Takt, nie unter Knoten oder Titeln. */
describe('Route im Lernpfad', () => {
  const from = { x: 200, y: 0 };
  const to = { x: 270, y: 200 };

  it('verbindet die Knotenmitten und verlässt sie senkrecht', () => {
    expect(routePoint(from, to, 0)).toEqual(from);
    expect(routePoint(from, to, 1)).toEqual(to);
    const start = routePoint(from, to, 0.02);
    const end = routePoint(from, to, 0.98);
    expect(Math.abs(start.x - from.x)).toBeLessThan(0.2 * (start.y - from.y));
    expect(Math.abs(to.x - end.x)).toBeLessThan(0.2 * (to.y - end.y));
  });

  it('setzt die Striche im festen Takt, mittig auf der Strecke und durchnummeriert', () => {
    const dashes = routeDashes(from, to, 13);
    expect(dashes.length).toBeGreaterThan(10);
    for (let i = 1; i < dashes.length; i++) {
      const gap = Math.hypot(dashes[i]!.x - dashes[i - 1]!.x, dashes[i]!.y - dashes[i - 1]!.y);
      expect(gap).toBeGreaterThan(12.5);
      expect(gap).toBeLessThanOrEqual(13.01);
    }
    // Die S-Kurve ist punktsymmetrisch: gleicher Abstand zu beiden Enden.
    const first = dashes[0]!;
    const last = dashes.at(-1)!;
    expect(Math.hypot(first.x - from.x, first.y - from.y)).toBeCloseTo(Math.hypot(to.x - last.x, to.y - last.y), 0);
    expect(dashes.map((d) => d.k)).toEqual(dashes.map((_, i) => i));
  });

  it('richtet die Striche an der Kurve aus (an den Enden senkrecht)', () => {
    const dashes = routeDashes({ x: 0, y: 0 }, { x: 0, y: 100 }, 10);
    for (const d of dashes) expect(d.angle).toBeCloseTo(90, 5);
  });

  it('setzt unter Knoten und Titeln aus', () => {
    const obstacles: Obstacle[] = [
      { kind: 'circle', x: from.x, y: from.y, r: 50 },
      { kind: 'box', x: 140, y: 60, w: 120, h: 40 },
      { kind: 'circle', x: to.x, y: to.y, r: 50 },
    ];
    const dashes = routeDashes(from, to, 13, obstacles);
    expect(dashes.length).toBeGreaterThan(0);
    for (const d of dashes) for (const o of obstacles) expect(covers(o, d), JSON.stringify(d)).toBe(false);
  });

  it('zeichnet nichts, wenn der nächste Knoten nicht weiter unten liegt', () => {
    expect(routeDashes(from, { x: 270, y: 0 }, 13)).toEqual([]);
    expect(routeDashes(from, { x: 270, y: -40 }, 13)).toEqual([]);
  });
});
