import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import StageVignette from '../src/lib/illustrations/StageVignette.svelte';

/** Etappen-Vignetten: jede Etappe hat ihr eigenes Motiv, gezeichnet nur aus Flächen. */
describe('Etappen-Vignetten', () => {
  const drawn = content.stages.map((s) => ({
    id: s.id,
    svg: render(StageVignette, { props: { stage: s.id, tone: 'sea' } }).body,
  }));

  it('zeichnet für jede Etappe ein Motiv auf die Scheibe', () => {
    for (const { id, svg } of drawn) {
      // Scheibe allein = ein Kreis; ein Motiv bringt mehrere Flächen dazu.
      expect((svg.match(/<(path|circle|ellipse|rect)\b/g) ?? []).length, id).toBeGreaterThan(4);
    }
  });

  it('hat für jede Etappe ein anderes Motiv', () => {
    expect(new Set(drawn.map((d) => d.svg)).size).toBe(drawn.length);
  });

  it('kommt ohne Konturen aus', () => {
    for (const { id, svg } of drawn) expect(svg, id).not.toMatch(/stroke/);
  });
});
