import type { SaveState } from '../storage/state';

/** Accessoires für Trâu. Je Platz trägt er höchstens eines; zu gewinnen sind sie in Truhen. */

export type AccessorySlot = 'head' | 'face' | 'neck' | 'horn';
export type AccessoryId = 'non-la' | 'mu-bao-hiem' | 'kinh-ram' | 'khan-ran' | 'chuong' | 'vong-hoa' | 'hoa-mai' | 'den-long';

export interface Accessory {
  id: AccessoryId;
  name: string;
  slot: AccessorySlot;
}

export const ACCESSORIES: readonly Accessory[] = [
  { id: 'non-la', name: 'Nón lá', slot: 'head' },
  { id: 'mu-bao-hiem', name: 'Roller-Helm', slot: 'head' },
  { id: 'kinh-ram', name: 'Sonnenbrille', slot: 'face' },
  { id: 'khan-ran', name: 'Khăn rằn', slot: 'neck' },
  { id: 'chuong', name: 'Glöckchen', slot: 'neck' },
  { id: 'vong-hoa', name: 'Blumenkette', slot: 'neck' },
  { id: 'hoa-mai', name: 'Mai-Blüte', slot: 'horn' },
  { id: 'den-long', name: 'Laterne', slot: 'horn' },
];

const byId = new Map(ACCESSORIES.map((a) => [a.id, a]));
export const accessory = (id: string) => byId.get(id as AccessoryId);

/** Noch nicht gewonnene Accessoires. */
export const missingAccessories = (save: SaveState) => ACCESSORIES.filter((a) => !save.inventory.accessories.includes(a.id));

/** An- oder ablegen; ein neues Accessoire verdrängt das bisherige auf demselben Platz. */
export function toggleEquip(save: SaveState, id: string): void {
  const item = accessory(id);
  if (!item || !save.inventory.accessories.includes(id)) return;
  const worn = save.inventory.equipped;
  if (worn.includes(id)) {
    save.inventory.equipped = worn.filter((w) => w !== id);
    return;
  }
  save.inventory.equipped = [...worn.filter((w) => accessory(w)?.slot !== item.slot), id];
}
