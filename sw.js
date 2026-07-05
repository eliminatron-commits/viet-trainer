/* =============================================================================
 * Service Worker – Offline-Fähigkeit.
 *
 * Strategie: Precache der App-Shell (inkl. aller 100 Audio-Dateien) beim
 * Install, Cache-First beim Fetch (statische App ohne Backend -> Cache-First
 * ist korrekt und schnell offline).
 *
 * Die Audio-Liste wird hier per Schleife aus w001..w100 erzeugt statt aus
 * js/data.js importiert: ein `importScripts("js/data.js")` würde scheitern,
 * weil data.js `window` referenziert (im Service-Worker-Kontext undefiniert).
 * Die Anzahl 100 ist durch die Anforderung (100 häufigste Wörter) fixiert;
 * bei einer künftigen Änderung der Wortanzahl in js/data.js muss WORD_COUNT
 * unten mitgeändert werden.
 *
 * CACHE-Version bei jedem Release hochzählen: activate räumt alte Caches weg;
 * auf iOS ist das der zuverlässige Weg, Updates auszuliefern.
 * ============================================================================= */
var CACHE = "viet-trainer-v3";
var WORD_COUNT = 100;

var APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/data.js",
  "./js/store.js",
  "./js/srs.js",
  "./js/audio.js",
  "./js/quiz.js",
  "./js/ui.js",
  "./js/app.js",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

var AUDIO_FILES = [];
for (var i = 1; i <= WORD_COUNT; i++) {
  AUDIO_FILES.push("./audio/w" + String(i).padStart(3, "0") + ".mp3");
}

var PRECACHE = APP_SHELL.concat(AUDIO_FILES);

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      // Nicht vorgecachte GETs (z.B. neue Assets in Dev) durchreichen und
      // fürs nächste Mal mitcachen.
      return fetch(e.request).then(function (res) {
        if (res && res.ok && e.request.url.indexOf("http") === 0) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
