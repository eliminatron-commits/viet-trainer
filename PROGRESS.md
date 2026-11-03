# PROGRESS – Việt-Trainer v2

## Stand

- **Phase 1/4 – Fundament, Inhalte und Design-System: abgeschlossen** (2026-11-02). Typecheck, 18 Vitest-Tests, Build grün. Alex hat den **Wasserbüffel (Trâu)** als Maskottchen gewählt, Richtung damit abgenommen (in `CLAUDE.md` festgehalten). P1-06 (Prototyp im LAN auf dem iPhone) nicht von Alex bestätigt – beim ersten iPhone-Test in Phase 2 nachholen.
- **Phase 2/4 – Kernlogik und Erinnerungen: in Arbeit** (Opus 5.5, hoch). Zwischenstand 2026-11-03:
  - Fertig und grün: Logik (`src/lib/logic/`: srs, path, session, rewards), Screens (`src/screens/`: Lernpfad, Etappe, Play mit Intro/Quiz/Hören/Rollen/Boss/Training, Training, Profil, Einstellungen mit Push-Status, Zeiten, Export/Import), Push-Client (`src/lib/push.svelte.ts`), SW-Push-Handler, Worker (`worker/`: schedule.ts + index.ts, typgeprüft, noch nicht deployt). 100 Vitest-Tests (P2-01–P2-04, P2-07-Logik), Playwright WebKit P2-05 grün.
  - Stil (Alex): durchgehend hell, Hör-Aufgaben mit flacher Klangscheibe statt dunkler Glühkugel (CLAUDE.md). Prototyp und Gecko gelöscht (freigegeben).
  - **Nächste Schritte:** 1) Alex: `cd worker && npx wrangler login`. 2) KV anlegen (id in `worker/wrangler.jsonc` statt KV_ID_NACH_WRANGLER_LOGIN), VAPID-Keys + PUSH_TOKEN per `wrangler secret put` (nie in Dateien), Worker deployen (freigegeben). 3) App mit VITE_PUSH_URL/VITE_PUSH_TOKEN aus der Umgebung bauen, Testkopie auf Cloudflare Pages `viet-trainer-v2` deployen (freigegeben), auf dem iPhone installieren, Push aktivieren, Test-Push (P2-06) + P1-06. 4) Phasenabschluss.

## Phase 1 – Ergebnis

- Branch `v2`; alte App in `legacy/`; `prepared/` eingecheckt.
- Inhalte: 538 Wörter, 270 Sätze, 10 Rollen, 9 Satzkontexte → `src/content/*.json`; 808 MP3s → `public/audio/`.
- Lernpfad: 5 Regionen, 33 Etappen (`scripts/migrate/curriculum.ts`); Etappe 1 „Ich & du“ und 7 „Familie & Anreden“ sind Pronomen-Etappen, 16 „Kleine Wörter, große Wirkung“ die Partikel-Etappe.
- Speicher: IndexedDB über idb-keyval, `persist()`, Export/Import, `normalizeSave`.
- Design: Tokens, Card/Button/PillNav/ProgressRing/GlowOrb, Illustration Marmorberge, Maskottchen-Entwürfe, Prototyp in `src/prototype/`.
- PWA-Gerüst: `src/sw.ts` (Precache inkl. Audio, löscht `viet-trainer-v*`), Manifest, „Neue Version“-Hinweis.

## Offene Punkte / Abweichungen

- Partikel-Etappe: `de` der Partikel ist noch der Text aus `prepared/words-ext.js` (teils Übersetzung, teils Erklärung) – bei Bedarf in Phase 3 mit dem Prüfmodus nachschärfen.
- Satz-Verteilung je Etappe ungleich (1–22), weil Sätze automatisch in die Etappe ihres letzten Wortes fallen. Für Sessions unkritisch (Wiederholungen mischen ein).
- App-Icon: vorerst die alten PNGs (`public/icons/`), neues Icon in Phase 4.
- Playwright-WebKit unter Windows (WinCairo) stürzt bei View Transitions auf Quiz-Aufgaben ab → E2E läuft ohne View Transitions; Übergänge auf dem iPhone prüfen.
- npm audit: 11 Meldungen (low/moderate) in Build-Abhängigkeiten von vite-plugin-pwa/workbox-build, nicht in der ausgelieferten App.
- Push-Token steckt im ausgelieferten JS (Build-Env) – schützt nur gegen Zufallszugriffe.

## Ideen außerhalb des Umfangs

- Lernpfad mit gezeichneter Route zwischen den Etappen-Knoten.
