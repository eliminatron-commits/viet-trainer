import type { RegionId } from '../content/types';

/**
 * Reise zur nächsten Region – einmal in App.svelte (`components/Trip.svelte`). Öffnet nach dem Boss, der eine Region
 * abschließt (Ergebnis der Runde), oder aus dem Reisepass (`replay`: Souvenir angetippt). Beim Schließen kehrt der
 * Fokus zum auslösenden Element zurück.
 */
export const trip = $state<{ from: RegionId | null; replay: boolean }>({ from: null, replay: false });

let opener: HTMLElement | null = null;

/** `origin`: das angetippte Element (Safari fokussiert Knöpfe beim Antippen nicht – sonst ginge der Fokus verloren). */
export function openTrip(from: RegionId, replay = false, origin?: HTMLElement): void {
  const active = document.activeElement;
  opener = origin ?? (active instanceof HTMLElement && active !== document.body ? active : null);
  trip.from = from;
  trip.replay = replay;
}

export function closeTrip(): void {
  if (!trip.from) return;
  trip.from = null;
  trip.replay = false;
  if (opener?.isConnected) opener.focus({ preventScroll: true });
  opener = null;
}
