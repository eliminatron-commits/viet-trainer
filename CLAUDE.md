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
| `node scripts/icons.ts` | App-Icons (`public/icons/*.png`, inkl. maskierbar) aus dem Büffel-SVG über den installierten Edge; `--preview` = Vorschaubogen |

Push-Worker: in `worker/` `npx wrangler deploy` (Alex ist angemeldet; Konto Free-Plan). Secrets `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `PUSH_TOKEN` nur per `wrangler secret put/bulk` über Pipe. Die App braucht beim Build `VITE_PUSH_URL` (`https://viet-trainer-push.alex-rettig.workers.dev`) und `VITE_PUSH_TOKEN` aus der Umgebung – fehlen sie, zeigt die App „nicht eingerichtet“. Achtung: `npx playwright test` baut `dist/` ohne diese Variablen neu.

Testkopie bis Phase 4: Worker `viet-trainer-v2` (nur statische Assets) unter `https://viet-trainer-v2.alex-rettig.workers.dev/viet-trainer/`. Deploy-Ordner außerhalb des Repos mit `wrangler.jsonc` (`assets.directory` → Ordner mit `viet-trainer/` = `dist/` und `_redirects`). `wrangler pages project create` legt seit wrangler 4.15x stattdessen einen Worker an – nicht verwenden.

Kein `python` im Bash-Tool aufrufen: Auf diesem Rechner ist `python` ein Microsoft-Store-Stub, der hängt. Die Python-Skripte in `scripts/` (ElevenLabs/Trim) sind Altbestand; neue Audios gibt es nicht (Abo gekündigt).

Stack: Svelte 5 (nur Runes) + Vite 8 + TypeScript **6** (svelte-check unterstützt TS 7 noch nicht), vite-plugin-pwa (injectManifest, `src/sw.ts`), idb-keyval, Vitest, Playwright WebKit (ab Phase 2). Worker unter `worker/` (ab Phase 2, wrangler).

## Ordnerstruktur

```
src/
  content/        types.ts (Inhaltsmodell), *.json (Quelle der Wahrheit), index.ts (typisierter Zugriff, audioUrl)
  lib/
    components/   Card, Button, PillNav, ProgressRing, SoundDisc – Kernkomponenten; RewardIcon, ChestReveal (Truhe öffnen), NewsToast (Erfolge/Challenges)
    audio/        player.ts – WebAudio-Wiedergabe, iOS-Unlock und Selbstheilung, Pegel für die Klangscheibe
    storage/      state.ts (Spielstand-Typen, Defaults, normalizeSave), persist.ts (IndexedDB, persist(), Export/Import)
    illustrations/ Scene (Rahmen: Aufbau + Schleifen), fünf Orts-Szenen (MarbleMountains = Đà Nẵng, HoiAn, Hue, Hanoi, Saigon),
                  RegionScene (Szene je Region), RegionHero (Hero-Objekt je Region + REGION_TONE)
    logic/        srs, path (Freischaltung), session (Aufgaben-Mix, alle Modi), rewards (XP/Level/Serie, Streak-Schutz, XP-Boost, Wachstum),
                  stats (TaskResult, Zähler), achievements, challenges (Wochen), chest (Truhen), accessories, phrasebook (Suche),
                  review (Prüfmodus-Export), theme (Tag/Nacht nach Uhrzeit) – reine Funktionen
    mascot/       Buffalo.svelte (Trâu: growth, wear), Trau.svelte (Büffel nach Spielstand), Accessory/AccessoryIcon (Accessoires)
    motion.ts     View Transitions (transitionTo, Tippunkt für reveal, arrivingByTab)
    ripple.ts     Tipp-Welle für Knöpfe und Karten
    game.svelte.ts globaler Spielstand + Aktionen (recordTask, Boss/Truhe, Favoriten, Prüfurteile, Neuigkeiten);
                  push.svelte.ts Push-Client; theme.svelte.ts Tag/Nacht (data-theme, Wechsel-Timer)
    feedback.ts   UI-Klänge (WebAudio-Synthese über den Kontext aus player.ts) und Haptik-Tick (iOS-18-switch-Trick)
    pwa.svelte.ts SW-Registrierung, „Neue Version“-Hinweis
  screens/        Lernpfad, Etappe, Training (Modus-Wahl), Sprachführer, Profil, Einstellungen, Prüfmodus; play/ = Session/Boss/Training mit allen Modi
  styles/         tokens.css (Design-Tokens), base.css (Übergänge, Tipp-Welle, Ankunft), scene.css (Bewegung der Szenen)
  sw.ts           Service Worker (→ /viet-trainer/sw.js) inkl. push/notificationclick
public/audio/     <id>.mp3 für jedes Wort und jeden Satz
scripts/migrate/  curriculum.ts (Etappen-Zuordnung), migrate.ts
tests/            Vitest; tests/e2e/ Playwright
worker/           Push-Worker „viet-trainer-push“ (eigenes package.json): schedule.ts (Berlin-Zeit, fällige Erinnerungen), index.ts (Routen + Cron)
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

- **Ein Stil, vietnamesisch, bei Tag und bei Nacht** (Alex, 2026-11-03: die drei Vorbilder sind nur Inspiration, der Stil muss in sich konsistent sein; 2026-11-04: Nachtmodus gewünscht): flache, kräftige, einfarbige Flächen im Formvokabular der Illustrationen – auch in Hör-Aufgaben. Dort statt Glühkugel die flache Klangscheibe (`SoundDisc`: Sonne mit Hof wie in den Szenen, der Hof wächst per AnalyserNode mit dem Audiopegel). Keine Verläufe, keine Unschärfe; innerhalb eines Modus nie hell und dunkel mischen.
- **Tag/Nacht:** `data-theme` am Wurzelelement (`theme.svelte.ts`). Automatik: Nacht von 20:00 bis 8:59 Uhr Ortszeit (`logic/theme.ts`), wechselt auch bei offener App (Timer, beim Zurückkehren aus dem Hintergrund neu geprüft); in den Einstellungen fest „Tag“ oder „Nacht“ wählbar, „Automatisch“ stellt die Zeiten wieder her (`settings.theme`, Standard `auto`). Der Wechsel wächst als Kreis (`theme`-Motion: vom Tippunkt bzw. vom Himmel oben rechts). Nachts: Grund Nachtblau, Schrift Mondlicht-Creme, Kartenflächen gedämpft dunkel; Rot und Gelb bleiben leuchtende Akzente (Text auf Gelb immer `--on-yellow`). Lichter (Laternen, Fenster, Mond) leuchten als flache Lichthöfe (`Glow.svelte`: durchscheinende Scheiben, pulsierend) – das ist das einzige „Glühen“. iOS-Statusleiste: `meta theme-color` wird mitgeschaltet.
- Tokens nur aus `src/styles/tokens.css` (Tag unter `:root`, Nacht unter `:root[data-theme='dark']`, gleiche Namen): Flaggenrot `#DA251D`, Sternengelb `#FFCD00`, Flächen Lotus/Laterne/Meer, Grund warmes Off-White `#FBF5EC` bzw. Nachtblau `#131A2E`, Text `--ink`. Semantisch statt fest: weiße Flächen `--surface`, gelbe Kartenfläche `--tone-yellow`, Text auf Gelb `--on-yellow`, gedämpfter Text `--ink-muted`, Navigation `--nav-bg/--nav-fg`, Inaktiv `--disabled-bg/--disabled-ink` – keine `#fff` oder festen Tintenfarben in Komponenten. Kontrast WCAG AA bei Tag und Nacht (Text `--ink` auf allen Flächen, Weiß nur auf Rot).
- Schrift Be Vietnam Pro, selbst gehostet über `@fontsource` (400/600/800), Headlines ≥ 32 px.
- Karten-Radius 24–32 px, Tap-Ziele ≥ 44 px, schwebende Pill-Navigation unten (Lernpfad, Training, Sprachführer, Profil), Safe-Area über `--safe-top/--safe-bottom`, nur Hochformat.
- Übergänge (Vorbild: Alex' Kajak-App `beispiel design1.mp4` – das Objekt ist der Star, Szenen bauen sich auf): `transitionTo(update, motion)` aus `motion.ts` (View Transitions API), Choreografie in `base.css` unter `:root[data-vt=…]`. Ein Bewegungsvokabular: `morph-open`/`morph-close` = Etappenkarte (Weiter-Karte oder der getippte Pfad-Knoten – genau **ein** Element heißt `stage-card`, sonst bricht die Transition ab) wächst wie ein Fenster zum Vollbild (Bilder nie skaliert, `object-fit: none`; die große Ansicht ist immer die deckende Basis; der Ort baut sich im wachsenden Fenster auf); dabei fliegt das Hero-Objekt der Region (`stage-hero`) schräg von der Karte aufrecht und groß an die Unterkante der Szene (Federkurve, das große scharfe Bild trägt den Flug); Titel kreuzblenden kurz. Ohne Gegenstück (Knoten) erscheinen bzw. gehen Hero und Titel per `:only-child`-Regel. Zurück stellt der Lernpfad seinen Scrollstand im `onMount` wieder her, damit die Etappe in ihren Knoten schrumpft. `tab-next`/`tab-prev` = Seiten gleiten in Tab-Richtung (gelbe Pille fließt per `flex-grow`, lebendes Bild der Leiste), die neue Seite steigt gestaffelt nach (`arrive`). `push`/`pop` = Unterseite schiebt sich von rechts herein (Einstellungen). `reveal` = Session öffnet sich als Kreis vom Tippunkt, `sheet-down` = Session sinkt als Blatt hinunter. Dazu: Tipp-Welle auf allen Knöpfen und Karten (`ripple.ts`), Sternenregen (Flaggenstern gelb/rot) bei richtiger Antwort, Ergebnis mit sich aufbauendem Ort, jubelndem Büffel und hochzählenden XP. Aufgabenwechsel in der Session: Aufgabe gleitet von rechts, Antworten folgen. Shared Elements (Inline-`view-transition-name`) wirken nur bei `morph-*`. Hinter allen Ebenen liegt Papier. Ohne View Transitions wechselt die Ansicht sofort (kein Fallback). `prefers-reduced-motion` schaltet alles ab (Übergänge, Schleifen, Verzögerungen). Scrollen gehört **in** das Update (vor den neuen Schnappschuss), nie danach – sonst springt die Seite; ebenso keine Svelte-Outros an ganzen Ansichten (ihr verspätetes Entfernen verschiebt den Scrollstand). Übergänge in Edge per Playwright mit iPhone-Standalone-Maßen (440×956, Safe-Area per `--safe-top`-Override) Bild für Bild und per CDP-Screencast in Echtzeit prüfen, bevor Alex sie sieht (WebKit unter Windows stürzt bei View Transitions ab).
- Safe Area: Inhalt läuft unter Uhr/Dynamic Island. Die feste Fläche `.statusbar` (App.svelte) deckt sie in `--paper` ab; Kopfzeilen beginnen bei `--safe-top + 20px`. Wichtiges (Weiter-Karte) muss ohne Scrollen sichtbar sein – kein automatisches Scrollen.
- **Illustrationen:** eigene flache SVGs, keine Konturen (nur Flächen), ≤ 14 Farben pro Szene als Konstanten-Objekt `C`, Licht von rechts oben (Schattenseite links dunkler), Ferne blasser/kühler, Vordergrund unten groß. Referenz: `MarbleMountains.svelte`. Jede Region hat ihre Szene (Đà Nẵng Marmorberge, Hội An Laternen-Altstadt, Huế Thiên-Mụ-Pagode mit Drachenboot, Hà Nội Röhrenhäuser mit Rollern, Sài Gòn Skyline am Fluss), ihre Kartenfarbe (`REGION_TONE`) und ihr Hero-Objekt (Korbboot, Laterne, Nón lá, Roller mit Blumenkorb, Eiskaffee mit Phin). **Orte leben** (`Scene.svelte` + `styles/scene.css`): beim ersten Sichtbarwerden baut sich die Szene gestaffelt auf (`.in in-rise|drop|left|right|pop|fade|grow`, Verzögerung `--e` in ms), danach Schleifen (`.loop-bob|drift|breathe|shimmer|sway|cross|flap|wave|ring|spin|drip`, Dauer `--t`, Versatz `--d`); außerhalb des Bildschirms pausiert. Eintritt und Schleife nie am selben Element (beide nutzen `transform`) – Gruppen verschachteln; Gleitwege so groß, dass vor dem Eintritt nichts am Rand hervorlugt.  **Jede Szene gibt es bei Tag und bei Nacht:** Paletten `DAY`/`NIGHT` mit gleichen Schlüsseln (`C = theme.dark ? NIGHT : DAY`; Schlüssel nach Bedeutung, z. B. `win` = Fensterinneres: tags dunkel, nachts erleuchtet), Himmel über `Sky.svelte` (Sonne bzw. Mond mit flachen Höfen und funkelnden Sternen an derselben Stelle), Nachtlichter mit `Glow.svelte`, Spiegelungen als zitternde Lichtbänder; nachts keine Vögel. Hero-Objekte ebenso (Laterne leuchtet, Roller mit Licht). Neue Szenen im temporären Labor einzeln Bild für Bild prüfen (Seite mit der Szene bei 400×260, alle Animationen zu festen Zeiten anhalten, Tag und Nacht; in der App per fester Uhr `page.clock.setFixedTime`).
- Maskottchen: **Wasserbüffel „Trâu“** (Alex, 2026-11-02) – `src/lib/mascot/Buffalo.svelte`: schieferblau, cremefarbene Hörner, Lotus auf dem Kopf, rotes Halstuch mit gelbem Stern. Lebt dauerhaft (Atmen, Blinzeln, Ohrenzucken, Blick, Lotus wiegt sich) und hat Stimmungen `mood`: `happy` (Hüpfer mit Stauchen/Strecken, ^^-Augen, Lächeln – richtige Antwort, Tagesziel erreicht), `sad` (Kopf und Ohren hängen, Brauen – falsche Antwort, Boss verloren), `cheer` (Doppelhüpfer, Lotus dreht sich – Ergebnis); `tappable` im Profil. Animationen nur als CSS an SVG-Gruppen (`transform-box: view-box`). App-Icon = sein Kopf vor gelber Sonne auf Flaggenrot (`scripts/icons.ts`). Wächst mit dem Level (`growthOf`: Kalb bis Level 4 mit Hornstummeln und kleinerem Körper, jung bis 9, dann ausgewachsen) und trägt Accessoires aus Truhen (je Platz Kopf/Gesicht/Hals/Horn eines; Kopfbedeckung ersetzt den Lotus, Khăn rằn das rote Halstuch). Wachstum und Accessoires sitzen in inneren Gruppen mit SVG-`transform`, damit sie die CSS-Bewegungen nicht überschreiben. In der App immer `Trau.svelte` (liest Level und Accessoires aus dem Spielstand); `Buffalo.svelte` selbst bleibt ohne Spielstand (Icon-Skript). Gleiche Regeln wie Illustrationen. Der Gecko-Entwurf ist verworfen.
- Richtung: mit der Maskottchen-Wahl am Stil-Prototyp aus Phase 1 abgenommen (2026-11-02).

## Technische Entscheidungen

- Audio ausschließlich über WebAudio (`lib/audio/player.ts`): Audio-Session `playback` (sonst schaltet der Stummschalter ab), Unlock bei jeder Geste (iOS zählt erst touchend/click), AnalyserNode für die Klangscheibe, keine Range-Requests gegen den SW-Cache (Safari-`<audio>` damit unzuverlässig). Hör-Aufgaben starten Audio automatisch.
- **Audio-Selbstheilung – nie entfernen** (Ton war auf Alex' iPhone zweimal weg: iOS liefert nach Sperre/App-Wechsel/Anruf Kontexte, die „interrupted“ sind oder „running“ melden, aber eine stehende Uhr haben; `resume()` hängt dann): Kontext beim Wechsel in den Hintergrund schließen, die nächste Geste baut einen frischen; unterbrochene Kontexte und stehende Audio-Uhr → Neubau bei der nächsten Geste; `resume()` und Abspielen nur mit Zeitlimit; bleibt der Ton blockiert, Hinweis „Der Ton hängt“ (App.svelte), dessen Tippen das verpasste Audio nachspielt. Abgesichert durch `tests/player.test.ts` (nachgebauter iOS-Kontext, jeder Mechanismus hat einen Test, der ohne ihn rot wird). Ton-Test und Diagnosezeile (Zustand, Neustarts, letzte Störung) in den Einstellungen – meldet Alex wieder Stille, zuerst diese Zeile erfragen.
- **Belohnungen (Phase 3):** Jede Aufgabe läuft über `recordTask(TaskResult)` (SRS je Einheit, Zähler in `save.stats`, XP mit Boost, Tagesziel); danach prüft `settle` Achievements und Wochen-Challenges und legt Neuigkeiten in `game.news` (außerhalb einer Session als Toast, in der Session sammelt das Ergebnis sie ein). Truhe nur beim ersten Sieg über einen Boss; makelloser Boss garantiert ein fehlendes Accessoire. Streak-Schutz wirkt automatisch beim Tageswechsel. Challenges zählen ab Wochenbeginn (Montag) per Basiswert.
- UI-Klänge nur per WebAudio-Synthese über `uiContext()` aus player.ts (kein eigener Kontext – sonst greift die Selbstheilung nicht), abschaltbar (`settings.sound`). Haptik nur per Feature-Detection (`'switch' in HTMLInputElement.prototype`), abschaltbar (`settings.haptics`).
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
