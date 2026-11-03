# CLAUDE.md – Việt-Trainer v2

PWA zum Vietnamesisch-Lernen für Alex (deutschsprachig, männlicher Lerner, Verlobte aus Đà Nẵng prüft die Natürlichkeit). Soll sich auf dem iPhone wie eine native App anfühlen: Homescreen, Vollbild, offline, Push-Erinnerungen. Live: https://eliminatron-commits.github.io/viet-trainer/ (bis Phase 4 noch die alte v13 aus `main`).

Re-Entry: `PROGRESS.md` (Phase, offene Punkte), `tests.json` (Akzeptanztests aller Phasen), `git log`. Arbeit auf Branch `v2`, Merge nach `main` erst in Phase 4.

## Befehle

Node liegt in `C:\Program Files\nodejs` und ist **nicht** auf dem PATH der Sitzung:
- Bash: `export PATH="/c/Program Files/nodejs:$PATH"` voranstellen
- PowerShell: `$env:Path = "C:\Program Files\nodejs;" + $env:Path`

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Vite mit `--host` → im LAN aufs iPhone: `http://<PC-IP>:5173/viet-trainer/` (Preview-Konfig `viet-dev` in `.claude/launch.json`) |
| `npm run check` | svelte-check (Warnungen = Fehler) + tsc für Skripte/Konfig |
| `npm test` | Vitest (`tests/**/*.test.ts`) |
| `npm run build` | `dist/` inkl. `sw.js` mit Precache (App-Shell, Fonts, alle Audios) |
| `npm run migrate` | Einmal-Migration legacy/prepared → `src/content/*.json` + `public/audio/` (überschreibt!) |

Kein `python` im Bash-Tool aufrufen: Auf diesem Rechner ist `python` ein Microsoft-Store-Stub, der hängt. Die Python-Skripte in `scripts/` (ElevenLabs/Trim) sind Altbestand; neue Audios gibt es nicht (Abo gekündigt).

Stack: Svelte 5 (nur Runes) + Vite 8 + TypeScript **6** (svelte-check unterstützt TS 7 noch nicht), vite-plugin-pwa (injectManifest, `src/sw.ts`), idb-keyval, Vitest, Playwright WebKit (ab Phase 2). Worker unter `worker/` (ab Phase 2, wrangler).

## Ordnerstruktur

```
src/
  content/        types.ts (Inhaltsmodell), *.json (Quelle der Wahrheit), index.ts (typisierter Zugriff, audioUrl)
  lib/
    components/   Card, Button, PillNav, ProgressRing, SoundDisc – Kernkomponenten
    audio/        player.ts – WebAudio-Wiedergabe, iOS-Unlock, Pegel für die Klangscheibe
    storage/      state.ts (Spielstand-Typen, Defaults, normalizeSave), persist.ts (IndexedDB, persist(), Export/Import)
    illustrations/ Szenen als Svelte-SVG
    mascot/       Maskottchen-Entwürfe
    motion.ts     View Transitions + Crossfade-Fallback
    pwa.svelte.ts SW-Registrierung, „Neue Version“-Hinweis
  prototype/      Stil-Prototyp aus Phase 1 (wird in Phase 2 durch echte Screens ersetzt)
  styles/         tokens.css (Design-Tokens), base.css
  sw.ts           Service Worker (→ /viet-trainer/sw.js)
public/audio/     <id>.mp3 für jedes Wort und jeden Satz
scripts/migrate/  curriculum.ts (Etappen-Zuordnung), migrate.ts
tests/            Vitest
legacy/           alte App v13 – nur Migrationsquelle, nicht anfassen
prepared/         vorbereitete Inhalte (w251–w538, s151–s270) – nur Migrationsquelle
```

## Benennung

- Dateien: Svelte-Komponenten `PascalCase.svelte`, Module `kebab-`/`camelCase.ts`, Tests `tests/<modul>.test.ts`.
- Code-Bezeichner Englisch, UI-Texte und Kommentare Deutsch.
- IDs sind heilig: Wörter `w001`…, Sätze `s001`…, zugleich Audio-Dateiname. Etappen `e01`…, Regionen `danang | hoian | hue | hanoi | saigon`.

## Inhalte

- Nach der Migration sind `src/content/*.json` die Quelle der Wahrheit (ein Objekt pro Zeile). `npm run migrate` nur bewusst erneut laufen lassen – es überschreibt Handpflege.
- Neues Wort/neuer Satz: in die JSON anhängen, `public/audio/<id>.mp3` ablegen, `checked:false`. Wort bekommt eine `stage`; ein Satz gehört in die Etappe seines **zuletzt eingeführten Wortes** (Test erzwingt: nie davor). Rollen ebenso.
- `checked:false` = von der Verlobten noch nicht geprüft (Prüfmodus, Phase 3). `pronAi:true` = KI-erstellte Aussprache.
- Etappen-Arten: `pronouns` (Anreden + Rollen-Quiz), `particles` (Wort-`de` ist eine Erklärung statt Übersetzung), `standard`.
- Satzfreigabe: ein Satz ist frei, sobald alle `words` mindestens einmal gesehen wurden.

## Sprachliche Regel (verbindlich)

- Nur echte Alltagssprache, keine Lehrbuch-Floskeln. **„làm ơn“ und „Xin chào“ sind tabu** – auch in UI-Texten, Beispielen und Tests.
- Perspektive männlicher Lerner (nie „chị“ als Selbstbezeichnung). Beziehungspronomen (em/anh/chị/con/cháu/ông/bà/cô/chú) statt „tôi“; „tôi“ nur im Kontext `formal`.
- Die Verlobte (Đà Nẵng) ist die einzige Instanz für Natürlichkeit. Keine neuen Inhalte erfinden.

## Design-Entscheidungen

- **Ein Stil, durchgehend hell und vietnamesisch** (Alex, 2026-11-03: die drei Vorbilder sind nur Inspiration, der Stil muss in sich konsistent sein): warmes Off-White, flache, kräftige, einfarbige Flächen im Formvokabular der Illustrationen – auch in Hör-Aufgaben. Dort statt Glühkugel die flache Klangscheibe (`SoundDisc`: Sonne mit Hof wie in den Szenen, der Hof wächst per AnalyserNode mit dem Audiopegel). Kein Dunkelmodus, keine Verläufe, kein Glühen, keine Unschärfe.
- Tokens nur aus `src/styles/tokens.css`: Flaggenrot `#DA251D`, Sternengelb `#FFCD00`, Flächen Lotus/Laterne/Meer, Grund warmes Off-White `#FBF5EC`, Text `--ink`. Kontrast WCAG AA (Text `--ink` auf allen Flächen, Weiß nur auf Rot).
- Schrift Be Vietnam Pro, selbst gehostet über `@fontsource` (400/600/800), Headlines ≥ 32 px.
- Karten-Radius 24–32 px, Tap-Ziele ≥ 44 px, schwebende Pill-Navigation unten (Lernpfad, Training, Sprachführer, Profil), Safe-Area über `--safe-top/--safe-bottom`, nur Hochformat.
- Übergänge: `transitionTo()` aus `motion.ts` (View Transitions API, Shared Elements per `view-transition-name`); Fallback Svelte-`crossfade` (`send/receive`), der bei vorhandener View Transition 0 ms dauert. `prefers-reduced-motion` schaltet alles ab.
- **Illustrationen:** eigene flache SVGs, keine Konturen (nur Flächen), ≤ 14 Farben pro Szene als Konstanten-Objekt `C`, Licht von rechts oben (Schattenseite links dunkler), Ferne blasser/kühler, Vordergrund unten groß. Referenz: `MarbleMountains.svelte`.
- Maskottchen: **Wasserbüffel „Trâu“** (Alex, 2026-11-02) – `src/lib/mascot/Buffalo.svelte`: schieferblau, cremefarbene Hörner, Lotus auf dem Kopf, rotes Halstuch mit gelbem Stern. Wächst mit dem Level, Accessoires ab Phase 3. Gleiche Regeln wie Illustrationen. Der Gecko-Entwurf ist verworfen.
- Richtung: mit der Maskottchen-Wahl am Stil-Prototyp aus Phase 1 abgenommen (2026-11-02).

## Technische Entscheidungen

- Audio ausschließlich über WebAudio (`lib/audio/player.ts`): iOS-Unlock beim ersten `pointerdown`, AnalyserNode für die Klangscheibe, keine Range-Requests gegen den SW-Cache (Safari-`<audio>` damit unzuverlässig). Hör-Aufgaben starten Audio automatisch.
- Spielstand = ein Datensatz in IndexedDB (`viet-trainer`/`state`, Schlüssel `save`), bei **jeder** Aktion sofort komplett geschrieben. Neue Felder: nur in `newSave()` ergänzen – `normalizeSave` füllt alte Stände auf. Inkompatible Änderung: `SAVE_VERSION` erhöhen und migrieren.
- Svelte-`$state` liefert Proxies: Inhaltsobjekte nie per Identität (`indexOf`, `===`) vergleichen, sondern per `id`.
- Service Worker liegt unter `/viet-trainer/sw.js` (gleicher Pfad wie v13), löscht alle Caches `viet-trainer-v*` und übernimmt sofort, wenn solche Caches existieren. Sonst: „Neue Version“-Hinweis, Update erst auf Tippen.
- Secrets (VAPID-Keys, Push-Token) nur als wrangler-Secrets bzw. Build-Env – nie in eine Datei im Repo.

## Verbotene Ansätze

- Emoji als Gestaltungsmittel, Stock-/Fremdgrafiken, Nachahmung bekannter Figuren.
- `<audio>`-Elemente für Lerninhalte; `localStorage` für Fortschritt.
- Tests löschen, abschwächen oder hartcodierte Testwerte, um grün zu werden.
- Features/Abstraktionen über den Phasenumfang hinaus (Ideen → `PROGRESS.md`).
- Parallele Bauarbeit über `general-purpose`-Agenten – nur `builder` oder `fliessband`.
- Sprechübungen/Mikrofon, App Store/native Projekte, Accounts/Cloud-Sync, Widgets.

## Subagenten (`.claude/agents/`, ab Phase 2)

| Agent | Modell / Effort | Wofür |
| --- | --- | --- |
| explorer | Haiku 5.5 / medium | Stellen im Code finden, knapp mit Pfaden |
| fliessband | Haiku 5.5 / high | gleichartige Kleinaufgaben nach Muster, parallel |
| zusammenfasser | Haiku 5.5 / medium | lange Logs auf relevante Fehler eindampfen |
| pruefer | Opus 5.5 / medium | unabhängiges Review gegen Akzeptanzkriterien + diese Datei |
| builder | Sonnet 5.5 / high | parallele Standard-Features auf fertiger Architektur |

Urteile trifft die Hauptsitzung; Fließband-Ergebnisse stichprobenartig prüfen und testen.
