/**
 * Update-Suche für den Service Worker. „found“: eine neue Version lädt bzw. wartet – der Hinweis
 * „Neue Version verfügbar“ folgt über onNeedRefresh, sobald sie installiert ist.
 */
export type UpdateResult = 'found' | 'current' | 'offline' | 'unavailable' | 'skipped';

type Registration = Pick<ServiceWorkerRegistration, 'update' | 'installing' | 'waiting'>;

/** Mindestabstand der automatischen Suche (bei jeder Rückkehr in die App). */
export const UPDATE_INTERVAL_MS = 60_000;

export function createUpdateCheck(getRegistration: () => Registration | undefined, now: () => number = Date.now) {
  let last = -Infinity;
  return async (force = false): Promise<UpdateResult> => {
    const reg = getRegistration();
    if (!reg) return 'unavailable';
    if (!force && now() - last < UPDATE_INTERVAL_MS) return 'skipped';
    last = now();
    try {
      await reg.update();
    } catch {
      return 'offline';
    }
    return reg.installing || reg.waiting ? 'found' : 'current';
  };
}
