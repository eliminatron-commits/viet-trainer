/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

const LEGACY_CACHE = /^viet-trainer-v\d+$/;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('install', (event) => {
  // Läuft noch die alte App (v1–v13, cache-first), sofort übernehmen statt auf ihr Schließen zu warten.
  event.waitUntil(
    caches.keys().then((keys) => {
      if (keys.some((k) => LEGACY_CACHE.test(k))) return self.skipWaiting();
    }),
  );
});

self.addEventListener('activate', (event) => {
  const cleanup = (async () => {
    const legacy = (await caches.keys()).filter((k) => LEGACY_CACHE.test(k));
    await Promise.all(legacy.map((k) => caches.delete(k)));
    await self.clients.claim();
    return legacy.length > 0;
  })();
  event.waitUntil(cleanup);
  // Offene Fenster zeigen nach der Ablösung noch die alte App: einmal neu laden, damit sie sofort v2 zeigen.
  // Bewusst außerhalb von waitUntil – die Navigation wartet auf den aktiven SW, das Aktivieren nicht auf sie.
  void cleanup.then(async (replacedLegacy) => {
    if (!replacedLegacy) return;
    const windows = await self.clients.matchAll({ type: 'window' });
    await Promise.all(windows.map((w) => ('navigate' in w ? w.navigate(w.url).catch(() => null) : null)));
  });
});

self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') void self.skipWaiting();
});

// Erinnerungen vom Push-Worker. iOS verlangt zu jedem Push eine sichtbare Benachrichtigung.
self.addEventListener('push', (event) => {
  let msg = { title: 'Việt-Trainer', body: '' };
  try {
    msg = { ...msg, ...(event.data?.json() as Partial<typeof msg>) };
  } catch {
    msg.body = event.data?.text() ?? '';
  }
  event.waitUntil(
    self.registration.showNotification(msg.title, {
      body: msg.body,
      icon: `${self.registration.scope}icons/icon-192.png`,
      tag: 'reminder',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list[0];
      return open ? open.focus() : self.clients.openWindow(self.registration.scope);
    }),
  );
});
