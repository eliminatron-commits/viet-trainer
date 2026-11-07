import { content } from '../../content';
import type { ItemId } from '../../content/types';
import type { DateKey, ItemProgress, ProgressKey } from '../storage/state';
import { isDue } from './srs';

/**
 * Reisfeld im Training: Jede gelernte Einheit ist eine Reispflanze. Ihr Wuchs folgt der SRS-Box
 * (1 Setzling … 5 reif), fällige Pflanzen sind durstig und lassen die Köpfe hängen; Training gießt sie.
 * Reine Funktionen: Zustand je Pflanze, Plätze im Feld (viewBox 400×260 wie alle Szenen), Umrisse, Unterschiede.
 */

export interface Plant {
  /** Wuchsstufe 1–5 = SRS-Box. */
  stage: number;
  /** Fällig: Die Pflanze lässt den Kopf hängen, bis sie wiederholt (gegossen) wird. */
  thirsty: boolean;
}

export const plantOf = (p: ItemProgress, day: DateKey): Plant => ({ stage: p.box, thirsty: isDue(p, day) });

export const STAGE_NAMES = ['Setzling', 'jung', 'kräftig', 'in Ähren', 'reif'] as const;

// ---------------------------------------------------------------------------------------------
// Unterschiede seit dem letzten Besuch

export interface Change {
  key: ProgressKey;
  /** null = neu gepflanzt. */
  from: Plant | null;
  to: Plant;
  /** Gegossen: neu, gewachsen oder nicht mehr durstig – dann fallen Tropfen. Sonst welkt sie nur. */
  watered: boolean;
}

/** Was sich seit `before` (letzter Besuch, null = erster Besuch in dieser Sitzung) geändert hat. */
export function fieldChanges(before: ReadonlyMap<string, Plant> | null, after: ReadonlyMap<ProgressKey, Plant>): Change[] {
  if (!before) return [];
  const out: Change[] = [];
  for (const [key, to] of after) {
    const from = before.get(key) ?? null;
    if (from && from.stage === to.stage && from.thirsty === to.thirsty) continue;
    const watered = !from || to.stage > from.stage || (from.thirsty && !to.thirsty);
    out.push({ key, from, to, watered });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Plätze im Feld

/** Wasserfläche, in der gepflanzt wird: vorne groß, hinten klein (Perspektive). `loose` = größte Pflanzengröße (wenige Pflanzen). */
export const FIELD = { left: 14, right: 386, front: 244, back: 124, pitch: 24, gap: 12, far: 0.4, loose: 2.4 } as const;

export interface Slot {
  /** Fuß der Pflanze. */
  x: number;
  y: number;
  /** Größe (1 = vorderste Reihe bei mittlerer Dichte). */
  k: number;
  /** Reihe, 0 = vorne. */
  row: number;
  /** leichte Schräglage in Grad */
  tilt: number;
}

const depth = (y: number) => FIELD.far + ((1 - FIELD.far) * (y - FIELD.back)) / (FIELD.front - FIELD.back);

function rowsFor(g: number): { y: number; k: number; n: number }[] {
  const rows: { y: number; k: number; n: number }[] = [];
  for (let y: number = FIELD.front; y >= FIELD.back; ) {
    const k = depth(y) * g;
    rows.push({ y, k, n: Math.max(1, Math.floor((FIELD.right - FIELD.left) / (FIELD.pitch * k))) });
    y -= FIELD.gap * k;
  }
  return rows;
}

/** Wie viele Pflanzen bei Dichte g ins Feld passen (größer = lockerer mit größeren Pflanzen). */
export const capacity = (g: number) => rowsFor(g).reduce((sum, r) => sum + r.n, 0);

/** Fester Pseudozufall je Platz in [0, 1): Das Feld wirkt natürlich und sieht bei jedem Aufbau gleich aus. */
function noise(a: number, b: number): number {
  let h = Math.imul(a + 1, 73856093) ^ Math.imul(b + 1, 19349663);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Plätze für `count` Pflanzen, von vorn nach hinten. Die Pflanzen verteilen sich immer über das ganze Feld
 * in vollen, versetzten Reihen: Die Größe wird so gewählt, dass die Reihen gerade reichen – wenige Pflanzen stehen
 * groß, viele rücken dichter (kleiner), bis jede Einheit Platz hat.
 */
export function fieldSlots(count: number): Slot[] {
  if (count <= 0) return [];
  let g: number = FIELD.loose;
  while (capacity(g) < count && g > 0.2) g *= 0.97;
  const all: Slot[] = [];
  rowsFor(g).forEach((r, row) => {
    const step = (FIELD.right - FIELD.left) / r.n;
    const shift = row % 2 ? 0.22 : -0.22;
    for (let i = 0; i < r.n; i++) {
      all.push({
        x: FIELD.left + step * (i + 0.5 + shift) + (noise(row, i) - 0.5) * step * 0.18,
        y: r.y,
        k: r.k * (0.96 + noise(i, row) * 0.08),
        row,
        tilt: (noise(row + 7, i + 3) - 0.5) * 5,
      });
    }
  });
  // gleichmäßig auswählen, vorne links bis hinten rechts: jede Reihe bekommt ihren Anteil
  if (count === 1) return [all[Math.floor(rowsFor(g)[0]!.n / 2)]!];
  return Array.from({ length: count }, (_, i) => all[Math.round((i * (all.length - 1)) / (count - 1))]!);
}

/** Pflanzreihenfolge: nach Wuchs sortiert – vorne die Setzlinge, hinten das goldene Band der reifen. */
export function fieldOrder<K extends string>(keys: readonly K[], plants: ReadonlyMap<K, Plant>): K[] {
  return [...keys].sort((a, b) => plants.get(a)!.stage - plants.get(b)!.stage);
}

/** Pflanze unter dem Tippunkt (viewBox-Koordinaten): nächster Pflanzenkörper im Umkreis, sonst null (Wasser). */
export function nearestSlot(slots: readonly Slot[], x: number, y: number, reach = 22): number | null {
  let best: number | null = null;
  let bestD = Infinity;
  slots.forEach((s, i) => {
    const dx = x - s.x;
    const dy = (y - (s.y - 12 * s.k)) / 1.6;
    const d = Math.hypot(dx, dy);
    if (d < bestD && d <= reach * Math.max(0.5, s.k)) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

// ---------------------------------------------------------------------------------------------
// Umriss einer Pflanze (Fuß bei 0,0, nach oben negativ; reif etwa 30 Einheiten hoch)

type Pt = [number, number];
const rad = Math.PI / 180;
const dir = (deg: number): Pt => [Math.sin(deg * rad), -Math.cos(deg * rad)];
const n2 = (v: number) => Math.round(v * 100) / 100;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Blätter eines Horsts: Winkel zur Senkrechten, Länge relativ, ab welcher Stufe, Seite (-1 links = Schattenseite). */
const BLADES = [
  { angle: -5, len: 1, from: 1, side: -1 },
  { angle: 6, len: 0.97, from: 1, side: 1 },
  { angle: 18, len: 0.86, from: 1, side: 1 },
  { angle: -17, len: 0.84, from: 1, side: -1 },
  { angle: 30, len: 0.7, from: 2, side: 1 },
  { angle: -29, len: 0.68, from: 3, side: -1 },
] as const;
/** Höhe je Stufe 0–5. */
const HEIGHT = [0, 12, 18, 24, 27, 31] as const;

function heightAt(stage: number): number {
  const s = Math.min(5, Math.max(0, stage));
  const i = Math.min(4, Math.floor(s));
  return HEIGHT[i]! + (HEIGHT[i + 1]! - HEIGHT[i]!) * (s - i);
}

/** Schlankes Blatt aus dem Horst: unten steil, oben nach außen gebogen; `bend` (Grad) lässt die Spitze hängen. */
function blade(angle: number, len: number, w: number, bend: number): { d: string; tip: Pt; tipAngle: number; peak: number } {
  const out = Math.sign(angle) || 1;
  const x0 = angle * 0.055;
  const lower = angle * 0.6 + bend * 0.12;
  const upper = angle + out * (8 + Math.abs(angle) * 0.6) + bend;
  const d0 = dir(lower);
  const d1 = dir((lower + upper) / 2);
  const d2 = dir(upper);
  const joint: Pt = [x0 + d0[0] * len * 0.5, d0[1] * len * 0.5];
  const tip: Pt = [joint[0] + d2[0] * len * 0.5, joint[1] + d2[1] * len * 0.5];
  const nb: Pt = [-d0[1] * w, d0[0] * w];
  const nj: Pt = [-d1[1] * w * 1.3, d1[0] * w * 1.3];
  const d =
    `M${n2(x0 - nb[0])} ${n2(-nb[1])}Q${n2(joint[0] - nj[0])} ${n2(joint[1] - nj[1])} ${n2(tip[0])} ${n2(tip[1])}` +
    `Q${n2(joint[0] + nj[0])} ${n2(joint[1] + nj[1])} ${n2(x0 + nb[0])} ${n2(nb[1])}Z`;
  // höchster Punkt der Mittellinie (quadratische Kurve Fuß → Knick → Spitze)
  let peak = 0;
  for (let t = 0.25; t <= 1; t += 0.25) peak = Math.max(peak, -(2 * t * (1 - t) * joint[1] + t * t * tip[1]));
  return { d, tip, tipAngle: upper, peak };
}

/** Kreis als Teilpfad (Reiskorn), damit eine ganze Rispe ein einziger Pfad bleibt. */
const dot = ([x, y]: Pt, r: number) => `M${n2(x - r)} ${n2(y)}a${n2(r)} ${n2(r)} 0 1 0 ${n2(2 * r)} 0a${n2(r)} ${n2(r)} 0 1 0 ${n2(-2 * r)} 0Z`;

/** Rispe: Körnerkette an dünner Spindel entlang eines Bogens ab `from`; `arc` < 0 neigt sie nach links. */
function panicle(from: Pt, angle: number, arc: number, len: number, r: number): { d: string; high: number } {
  const N = 7;
  const pts: Pt[] = [from];
  for (let j = 1; j <= N; j++) {
    const v = dir(angle + (arc * j) / N);
    const prev = pts[j - 1]!;
    pts.push([prev[0] + (v[0] * len) / N, prev[1] + (v[1] * len) / N]);
  }
  const spine = pts.map((pt, j) => `${j ? 'L' : 'M'}${n2(pt[0])} ${n2(pt[1])}`).join('');
  const back = [...pts]
    .reverse()
    .map((pt) => `L${n2(pt[0] + 0.45)} ${n2(pt[1] + 0.25)}`)
    .join('');
  const grains = pts.slice(1).map((pt, j) => {
    const v = dir(angle + (arc * (j + 1)) / N + 90);
    const off = j % 2 ? 0.55 : -0.55;
    return dot([pt[0] + v[0] * off, pt[1] + v[1] * off], r * (1 - j * 0.05));
  });
  return { d: `${spine}${back}Z${grains.join('')}`, high: -Math.min(...pts.map((pt) => pt[1])) };
}

export interface PlantShape {
  /** Blätter der Lichtseite (rechts) samt Halmen. */
  light: string;
  /** Blätter der Schattenseite (links). */
  shade: string;
  /** Rispen mit Körnern (ab Stufe 4), sonst leer. */
  head: string;
  /** Höhe über dem Fuß (für Tropfen und Tippen). */
  top: number;
}

/**
 * Umriss bei Wuchsstufe `stage` (0–5, stetig für Übergänge) und Hängen `droop` (0 aufrecht, 1 durstig).
 * Blätter wachsen nacheinander heraus; ab Stufe 3 schiebt sich die Rispe, reif neigen sich zwei goldene Rispen.
 * Durstig knicken die Blattspitzen ab und die Rispen hängen herab.
 */
export function plantShape(stage: number, droop: number): PlantShape {
  const h = heightAt(stage);
  const light: string[] = [];
  const shade: string[] = [];
  let top = 0;
  for (const b of BLADES) {
    const grow = clamp01(stage - (b.from - 1));
    if (grow <= 0.02) continue;
    const w = (0.85 + 0.07 * Math.min(5, stage)) * (0.55 + 0.45 * grow);
    const leaf = blade(b.angle, h * b.len * grow, w, droop * 72 * (Math.sign(b.angle) || 1));
    (b.side < 0 ? shade : light).push(leaf.d);
    top = Math.max(top, leaf.peak);
  }
  const heads: string[] = [];
  const p = clamp01(stage - 3);
  if (p > 0.02) {
    const ripe = clamp01(stage - 4);
    const stalk = blade(3, h * (1.02 + 0.1 * p), 0.45, droop * 30);
    light.push(stalk.d);
    const main = panicle(stalk.tip, stalk.tipAngle, 55 + 35 * ripe + droop * 60, h * 0.42 * p, 1.15 + 0.15 * ripe);
    heads.push(main.d);
    top = Math.max(top, stalk.peak, main.high);
    if (ripe > 0.3) {
      const k = (ripe - 0.3) / 0.7;
      const side = blade(-8, h * 0.94, 0.4, -droop * 30);
      light.push(side.d);
      const second = panicle(side.tip, side.tipAngle, -(50 + 40 * ripe + droop * 60), h * 0.32 * k, 1.1 * k);
      heads.push(second.d);
      top = Math.max(top, side.peak, second.high);
    }
  }
  return { light: light.join(''), shade: shade.join(''), head: heads.join(''), top };
}

const shapes = new Map<string, PlantShape>();
/** Umriss eines ruhenden Zustands (zwischengespeichert – viele Pflanzen teilen ihn). */
export function restingShape(plant: Plant): PlantShape {
  const id = `${plant.stage}:${plant.thirsty}`;
  let s = shapes.get(id);
  if (!s) shapes.set(id, (s = plantShape(plant.stage, plant.thirsty ? 1 : 0)));
  return s;
}

// ---------------------------------------------------------------------------------------------
// Beschriftung beim Antippen

const wordById = new Map(content.words.map((w) => [w.id as string, w]));
const sentenceById = new Map(content.sentences.map((s) => [s.id as string, s]));
const roleById = new Map(content.roles.map((r) => [r.id, r]));

function daysBetween(a: DateKey, b: DateKey): number {
  const t = (d: DateKey) => {
    const [y, m, dd] = d.split('-').map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, dd);
  };
  return Math.round((t(b) - t(a)) / 86400000);
}

export interface PlantInfo {
  /** Wort oder Satz hinter der Pflanze (bei einer Rolle das Anredewort) – für Audio und Wortkarte; null, wenn unbekannt. */
  item: ItemId | null;
  vn: string;
  de: string;
  /** Wuchs und nächstes Gießen, z. B. „reif · in 12 Tagen wieder gießen“. */
  state: string;
}

export function plantInfo(key: ProgressKey, p: ItemProgress, day: DateKey): PlantInfo {
  let vn = key as string;
  let de = '';
  let item: ItemId | null = null;
  if (key.includes(':')) {
    const [id, mode] = key.split(':') as [string, 'self' | 'addr'];
    const role = roleById.get(id);
    const word = role && wordById.get((mode === 'self' ? role.self : role.addr) ?? '');
    if (role && word) {
      item = word.id;
      vn = word.vn;
      de = `${mode === 'self' ? '„ich“' : '„du“'} im Gespräch mit: ${role.label}`;
    }
  } else {
    const it = wordById.get(key) ?? sentenceById.get(key);
    if (it) {
      item = it.id;
      vn = it.vn;
      de = it.de;
    }
  }
  const stage = STAGE_NAMES[p.box - 1];
  const late = daysBetween(p.due, day);
  const next = -late;
  const state = isDue(p, day)
    ? late === 0
      ? `${stage} · durstig, heute fällig`
      : `${stage} · durstig seit ${late === 1 ? 'gestern' : `${late} Tagen`}`
    : `${stage} · ${next === 1 ? 'morgen' : `in ${next} Tagen`} wieder gießen`;
  return { item, vn, de, state };
}
