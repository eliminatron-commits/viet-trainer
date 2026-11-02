import { createStore, get, set, type UseStore } from 'idb-keyval';
import { newSave, normalizeSave, type SaveState } from './state';

const KEY = 'save';

export function openSaveStore(): UseStore {
  return createStore('viet-trainer', 'state');
}

/** Lädt den Spielstand; ohne gespeicherten Stand beginnt ein neuer. */
export async function loadSave(store: UseStore): Promise<SaveState> {
  const raw = await get<unknown>(KEY, store);
  return raw === undefined ? newSave() : normalizeSave(raw);
}

/** Schreibt den kompletten Stand sofort (klein genug, kein Debounce nötig). */
export async function writeSave(state: SaveState, store: UseStore): Promise<void> {
  // JSON-Kopie entfernt Svelte-Proxies, die IndexedDB nicht klonen kann.
  await set(KEY, JSON.parse(JSON.stringify(state)) as SaveState, store);
}

/** Bittet den Browser, den Speicher nicht zu räumen (iOS: wirkt v. a. für installierte Web-Apps). */
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}

export function exportSave(state: SaveState): string {
  return JSON.stringify(state, null, 2);
}

export function importSave(json: string): SaveState {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.');
  }
  return normalizeSave(raw);
}