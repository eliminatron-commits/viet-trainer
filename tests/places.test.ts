import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { SITUATION_TAGS, type SituationTag } from '../src/content/types';
import { buildEntries, groupBySituation } from '../src/lib/logic/phrasebook';
import { gridNeighbours, PLACE_LABEL, PLACE_ORDER, PLACE_TONE } from '../src/lib/logic/places';

const PLACES_DIR = new URL('../src/lib/illustrations/places/', import.meta.url);

/** Schlüssel und Farben eines Paletten-Objekts (`const DAY = { … }` bzw. `const NIGHT: typeof DAY = { … }`). */
function palette(source: string, name: 'DAY' | 'NIGHT'): [string, string][] {
  const block = new RegExp(`const ${name}(?:: typeof DAY)? = \\{([\\s\\S]*?)\\};`).exec(source);
  expect(block, `${name} fehlt`).not.toBeNull();
  return [...block![1]!.matchAll(/(\w+): '(#[0-9A-Fa-f]{6})'/g)].map((m) => [m[1]!, m[2]!]);
}

describe('Orte im Sprachführer', () => {
  it('jede Situation hat Kartenfarbe und Bildbeschreibung', () => {
    expect(PLACE_ORDER).toEqual(Object.keys(SITUATION_TAGS));
    for (const tag of PLACE_ORDER) {
      expect(PLACE_TONE[tag]).toMatch(/^(lantern|sea|yellow|lotus)$/);
      expect(PLACE_LABEL[tag].length).toBeGreaterThan(5);
    }
  });

  it('Nachbarn in der zweispaltigen Übersicht haben nie dieselbe Farbe', () => {
    // Die Übersicht zeigt die Gruppen in dieser Reihenfolge (leere Gruppen entfallen).
    const shown: SituationTag[] = groupBySituation(buildEntries(content)).map((g) => g.tag);
    expect(shown.length).toBe(PLACE_ORDER.length);
    for (const [a, b] of gridNeighbours(shown.length)) expect(PLACE_TONE[shown[a]!], `${shown[a]} / ${shown[b]}`).not.toBe(PLACE_TONE[shown[b]!]);
  });

  it('gridNeighbours: rechts daneben und darunter, nie über den Zeilenrand', () => {
    expect(gridNeighbours(5)).toEqual([
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
      [2, 4],
    ]);
    expect(gridNeighbours(1)).toEqual([]);
  });

  it('jede Szene hat Tag- und Nachtpalette mit gleichen Schlüsseln und höchstens 14 Farben', () => {
    const files = readdirSync(PLACES_DIR).filter((f) => f.endsWith('.svelte'));
    expect(files).toHaveLength(PLACE_ORDER.length);
    for (const f of files) {
      const source = readFileSync(new URL(f, PLACES_DIR), 'utf8');
      const day = palette(source, 'DAY');
      const night = palette(source, 'NIGHT');
      expect(day.map(([k]) => k), f).toEqual(night.map(([k]) => k));
      expect(day.length, f).toBeLessThanOrEqual(14);
      expect(day.length, f).toBeGreaterThan(5);
    }
  });
});
