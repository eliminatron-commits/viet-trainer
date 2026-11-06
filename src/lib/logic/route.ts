/**
 * Route im Lernpfad: Von Knoten zu Knoten führt eine gestrichelte S-Kurve – senkrecht aus der Mitte des einen
 * hinaus, hinüber und senkrecht in die Mitte des nächsten hinein. Unter Knoten und Titeln setzt sie aus
 * (Hindernisse); in jeder freien Strecke stehen die Striche im festen Takt und mittig.
 */
export type Point = { x: number; y: number };
/** Mitte eines Strichs, seine Richtung in Grad (0 = nach rechts, 90 = nach unten) und seine Nummer im Abschnitt. */
export type Dash = Point & { angle: number; k: number };
/** Fläche, unter der die Route aussetzt – samt Luft, die der Strich braucht. */
export type Obstacle = { kind: 'circle'; x: number; y: number; r: number } | { kind: 'box'; x: number; y: number; w: number; h: number };
/** Eine Etappe aus Sicht der Route: Versatz des Knotens, schon erreicht, aktuelle Etappe. */
export type RouteStop = { x: number; reached: boolean; current: boolean };

/** Punkt der S-Kurve bei t ∈ [0, 1]: kubische Bézierkurve mit senkrechten Tangenten an beiden Enden. */
export function routePoint(from: Point, to: Point, t: number): Point {
  const d = (to.y - from.y) / 2;
  const u = 1 - t;
  const b0 = u * u * u;
  const b1 = 3 * u * u * t;
  const b2 = 3 * u * t * t;
  const b3 = t * t * t;
  return {
    x: (b0 + b1) * from.x + (b2 + b3) * to.x,
    y: b0 * from.y + b1 * (from.y + d) + b2 * (to.y - d) + b3 * to.y,
  };
}

export function covers(o: Obstacle, p: Point): boolean {
  return o.kind === 'circle'
    ? Math.hypot(p.x - o.x, p.y - o.y) < o.r
    : p.x > o.x && p.x < o.x + o.w && p.y > o.y && p.y < o.y + o.h;
}

/** Striche entlang der S-Kurve im Abstand `pitch`, nur außerhalb der Hindernisse; ohne Weg nach unten keine. */
export function routeDashes(from: Point, to: Point, pitch: number, obstacles: Obstacle[] = []): Dash[] {
  if (to.y <= from.y) return [];
  // Fein abtasten (etwa jeder Pixel), Bogenlänge mitführen.
  const steps = Math.max(32, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) * 1.5));
  const pts = Array.from({ length: steps + 1 }, (_, i) => routePoint(from, to, i / steps));
  const s = [0];
  for (let i = 1; i <= steps; i++) s.push(s[i - 1]! + Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y));
  const free = pts.map((p) => !obstacles.some((o) => covers(o, p)));

  const dashes: Dash[] = [];
  const at = (len: number): void => {
    let j = 0;
    while (j < steps - 1 && s[j + 1]! < len) j++;
    const a = pts[j]!;
    const b = pts[j + 1]!;
    const f = (len - s[j]!) / (s[j + 1]! - s[j]! || 1);
    dashes.push({
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
      angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      k: dashes.length,
    });
  };
  for (let i = 0; i <= steps; i++) {
    if (!free[i]) continue;
    let j = i;
    while (j < steps && free[j + 1]) j++;
    const s0 = s[i]!;
    const room = s[j]! - s0;
    const n = Math.floor(room / pitch) + 1;
    const offset = (room - (n - 1) * pitch) / 2;
    for (let k = 0; k < n; k++) at(s0 + offset + k * pitch);
    i = j;
  }
  return dashes;
}
