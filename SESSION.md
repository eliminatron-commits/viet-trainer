# Việt-Trainer — Projektstand (Handoff)

PWA zum Vietnamesisch-Lernen für Alex, iPhone-Homescreen, vollständig offline. Stand: **v2** (Svelte 5, Neubau in
4 Phasen, abgeschlossen 2026-11). Konventionen und Entscheidungen: `CLAUDE.md`; Phasen, Abweichungen und offene
Punkte: `PROGRESS.md`; Akzeptanztests: `tests.json`.

## Live & Deployment

- **Live:** https://eliminatron-commits.github.io/viet-trainer/ — Repo `eliminatron-commits/viet-trainer` (öffentlich).
- **Deploy:** GitHub Actions (`.github/workflows/pages.yml`), Pages-Quelle muss „GitHub Actions“ sein (bis zum
  Release noch „Branch main“ – Umstellung und Secret siehe `PROGRESS.md`, Nächste Schritte). Jeder Push auf `main`:
  `npm ci` → `npm run check` → `npm test` → `npm run build` → Pages. Kein Cache-Hochzählen mehr nötig: der
  Precache-Manifest im SW ändert sich mit jedem Build, installierte Apps zeigen dann „Neue Version“.
- **Secret:** `VITE_PUSH_TOKEN` (Repo-Secret, gleiches Token wie `PUSH_TOKEN` im Worker). Fehlt es, zeigt die App
  „nicht eingerichtet“. Die Worker-URL steht offen im Workflow.
- **gh CLI:** `/c/Program Files/GitHub CLI` → im Bash-Tool `export PATH="/c/Program Files/GitHub CLI:$PATH"`,
  angemeldet als `eliminatron-commits`.
- **Push-Worker** `viet-trainer-push` (Cloudflare Free-Plan): in `worker/` `npx wrangler deploy`. Secrets
  `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `PUSH_TOKEN` nur per `wrangler secret put`. Cron alle 5 min, KV `STATE`.
- **Ablösung v13:** Der neue SW liegt unter demselben Pfad (`/viet-trainer/sw.js`). Findet er alte Caches
  `viet-trainer-v*`, übernimmt er sofort, löscht sie und lädt offene Fenster der alten App einmal neu.

## Inhalte & Audio

- Quelle der Wahrheit: `src/content/*.json` (538 Wörter, 270 Sätze, Rollen, 33 Etappen, 5 Regionen),
  Audio `public/audio/<id>.mp3`. Regeln für neue Inhalte: `CLAUDE.md`, Abschnitt Inhalte.
- Neue Audios gibt es nicht mehr (ElevenLabs-Abo gekündigt). Die Python-Skripte in `scripts/` sind Altbestand.
- `checked:false` = von der Verlobten noch ungeprüft. Sie beurteilt im **Prüfmodus** (Einstellungen) und exportiert
  JSON; Korrekturen daraus fließen per Claude Code in die JSON-Dateien.

## Testen

- `npm run check`, `npm test` (Vitest), `npx playwright test` (WebKit; baut `dist/` ohne Push-Env neu).
- Übergänge und Szenen in Edge per Playwright in iPhone-Maßen prüfen (WebKit unter Windows stürzt bei View
  Transitions ab), danach auf dem iPhone bestätigen lassen.

## Offene Punkte

- Prüfung aller `checked:false`-Inhalte und der KI-Aussprache (`pronAi`) durch die Verlobte.
- Ideen außerhalb des Umfangs: `PROGRESS.md`.
