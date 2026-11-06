import { SITUATION_TAGS, type SituationTag } from '../../content/types';

/**
 * Situationen des Sprachführers als Orte: jede hat ihre Szene (illustrations/places) und ihre Kartenfarbe.
 * Die Übersicht steht in zwei Spalten in der Reihenfolge von SITUATION_TAGS – Nachbarn (neben- und
 * untereinander) haben nie dieselbe Farbe.
 */
export type PlaceTone = 'lantern' | 'sea' | 'yellow' | 'lotus';

export const PLACE_TONE: Record<SituationTag, PlaceTone> = {
  restaurant: 'lantern',
  familie: 'sea',
  taxi: 'yellow',
  markt: 'lotus',
  smalltalk: 'sea',
  unterwegs: 'lantern',
  zuhause: 'lotus',
  gefuehle: 'yellow',
  gesundheit: 'sea',
  arbeit: 'lotus',
};

/** Was die Szene zeigt (Bildbeschreibung für Screenreader). */
export const PLACE_LABEL: Record<SituationTag, string> = {
  restaurant: 'Garküche mit dampfender Phở und Plastikhockern',
  familie: 'Wohnhaus mit Wäscheleine, große und kleine Kleider',
  taxi: 'Taxi fährt durch die Stadt',
  markt: 'Obststand mit Drachenfrucht, Mangos und Bananen',
  smalltalk: 'Zwei Leute beim Eistee am Straßenrand, im Gespräch',
  unterwegs: 'Zug fährt an der Küste entlang',
  zuhause: 'Hängematte und Ventilator am offenen Fenster',
  gefuehle: 'Lotusteich mit blühender Lotusblume',
  gesundheit: 'Apotheke mit grünem Kreuz',
  arbeit: 'Laptop und Tasse auf dem Schreibtisch am Fenster',
};

/** Nachbarn in der zweispaltigen Übersicht: rechts daneben und darunter. */
export function gridNeighbours(count: number, columns = 2): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    if ((i + 1) % columns !== 0 && i + 1 < count) pairs.push([i, i + 1]);
    if (i + columns < count) pairs.push([i, i + columns]);
  }
  return pairs;
}

export const PLACE_ORDER = Object.keys(SITUATION_TAGS) as SituationTag[];
