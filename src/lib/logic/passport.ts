import type { DateKey } from '../storage/state';
import { ACHIEVEMENTS, type Achievement } from './achievements';

/**
 * Reisepass im Profil: die Erfolge als Stempel, je Seite sechs. Jeder Stempel hat seine eigene, feste Form,
 * Farbe und Schräglage (aus der ID abgeleitet, damit er bei jedem Öffnen gleich auf dem Papier sitzt).
 */
export const STAMPS_PER_PAGE = 6;

export function passportPages(perPage = STAMPS_PER_PAGE): Achievement[][] {
  const pages: Achievement[][] = [];
  for (let i = 0; i < ACHIEVEMENTS.length; i += perPage) pages.push(ACHIEVEMENTS.slice(i, i + perPage));
  return pages;
}

/** Stempelform: Kreis, Rechteck mit runden Ecken, Achteck. Tinte: Index in die Stempelfarben der Ansicht. */
export type StampStyle = { shape: 0 | 1 | 2; ink: 0 | 1 | 2 | 3; rot: number };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function stampStyle(id: string): StampStyle {
  const h = hash(id);
  return {
    shape: (h % 3) as StampStyle['shape'],
    ink: ((h >>> 3) % 4) as StampStyle['ink'],
    // −12° bis +12°, nie ganz gerade (wie von Hand gestempelt)
    rot: (((h >>> 6) % 21) - 10) * 1.2 || 4,
  };
}

/** „2026-11-06“ → „06.11.26“ (wie auf einem Stempel). */
export function stampDate(date: DateKey): string {
  const [y, m, d] = date.split('-');
  return `${d}.${m}.${y!.slice(2)}`;
}
