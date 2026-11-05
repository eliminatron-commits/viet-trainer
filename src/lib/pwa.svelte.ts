import { registerSW } from 'virtual:pwa-register';
import { createUpdateCheck, type UpdateResult } from './update';

/** „Neue Version“-Hinweis: der SW wartet, bis Alex tippt. */
export const pwa = $state({ needRefresh: false });

let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
let registration: ServiceWorkerRegistration | undefined;
const check = createUpdateCheck(() => registration);

let reloading = false;
function reload(): void {
  if (reloading) return;
  reloading = true;
  location.reload();
}

export function initPwa(): void {
  if (import.meta.env.DEV) return;
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      pwa.needRefresh = true;
    },
    onNeedReload: reload,
    onRegisteredSW(_url, r) {
      registration = r;
    },
  });
  // iOS holt die installierte App aus dem Hintergrund, ohne sie neu zu laden – dann fragt der Browser nie nach
  // einer neuen Version. Deshalb bei jeder Rückkehr selbst nachsehen (höchstens einmal pro Minute).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void check();
  });
}

/** „Nach Updates suchen“ in den Einstellungen: sofort, ohne Mindestabstand. */
export function checkForUpdate(): Promise<UpdateResult> {
  return check(true);
}

export function applyUpdate(): void {
  // workbox-window lädt nach der Übernahme nur neu, wenn schon beim Öffnen ein SW die Seite steuerte –
  // nach der allerersten Installation nicht. Deshalb selbst neu laden, sobald die neue Version übernimmt.
  navigator.serviceWorker?.addEventListener('controllerchange', reload, { once: true });
  void updateSW?.(true);
}
