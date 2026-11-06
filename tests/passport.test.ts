import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../src/lib/logic/achievements';
import { passportPages, stampDate, stampStyle } from '../src/lib/logic/passport';

/** Reisepass: jeder Erfolg genau einmal als Stempel, jeder Stempel sitzt immer gleich. */
describe('Reisepass', () => {
  it('verteilt alle Erfolge genau einmal auf Seiten zu höchstens sechs Stempeln', () => {
    const pages = passportPages();
    expect(pages.flat().map((a) => a.id)).toEqual(ACHIEVEMENTS.map((a) => a.id));
    for (const p of pages) expect(p.length).toBeGreaterThan(0);
    for (const p of pages) expect(p.length).toBeLessThanOrEqual(6);
  });

  it('gibt jedem Stempel eine feste, leicht schräge Lage und abwechslungsreiche Formen und Farben', () => {
    for (const a of ACHIEVEMENTS) {
      const s = stampStyle(a.id);
      expect(stampStyle(a.id)).toEqual(s);
      expect(Math.abs(s.rot)).toBeGreaterThan(0);
      expect(Math.abs(s.rot)).toBeLessThanOrEqual(12);
    }
    const styles = ACHIEVEMENTS.map((a) => stampStyle(a.id));
    expect(new Set(styles.map((s) => s.shape)).size).toBe(3);
    expect(new Set(styles.map((s) => s.ink)).size).toBe(4);
  });

  it('schreibt das Datum wie auf einem Stempel', () => {
    expect(stampDate('2026-11-06')).toBe('06.11.26');
  });
});
