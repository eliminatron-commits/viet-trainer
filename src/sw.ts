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
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => LEGACY_CACHE.test(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') void self.skipWaiting();
});
