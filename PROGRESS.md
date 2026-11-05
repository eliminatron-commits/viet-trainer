# PROGRESS – Việt-Trainer v2

## Stand

- **Phase 1/4 – Fundament, Inhalte und Design-System: abgeschlossen** (2026-11-02). Typecheck, 18 Vitest-Tests, Build grün. Alex hat den **Wasserbüffel (Trâu)** als Maskottchen gewählt, Richtung damit abgenommen (in `CLAUDE.md` festgehalten). P1-06 (Prototyp im LAN auf dem iPhone) nicht von Alex bestätigt – beim ersten iPhone-Test in Phase 2 nachholen.
- **Phase 2/4 – Kernlogik und Erinnerungen: abgeschlossen** (2026-11-03, Opus 5.5 hoch). Check, 100 Vitest-Tests, Playwright WebKit (Etappe 1 bis Boss), Build und Worker-Typecheck grün; Test-Push auf Alex' iPhone angekommen; P2-07 live geprüft (Abendzeit im KV kurz auf 20:50, Ziel erfüllt → kein Push; Gegenprobe Ziel offen → Push 21:00 angekommen; Zustand danach zurückgesetzt). Layout-Fix (Weiter-Karte oben, Statusleisten-Fläche) in iPhone-Maßen geprüft, Von Alex auf dem iPhone bestätigt (2026-11-04).
- **Design-Block (vorgezogen aus Phase 4, Alex 2026-11-03): umgesetzt, von Alex auf dem iPhone abgenommen (2026-11-04).** Neues App-Icon (Büffelkopf vor Sonne auf Flaggenrot, `scripts/icons.ts`), Büffel lebt und reagiert (Leerlauf, happy/sad/cheer, im Antwortbalken und auf dem Ergebnis), Bewegungsvokabular für alle Ansichtswechsel (Karte wächst, Tabs gleiten, Pille fließt, Einstellungen schieben, Session als Blatt), Aufgabenwechsel und Etappen-Inhalte animiert. Alle Wechsel in Pro-Max-Maßen Bild für Bild und in Echtzeit geprüft.
- **Audio-Selbstheilung (2026-11-04):** Ton war auf dem iPhone ein zweites Mal plötzlich weg (iOS-Kontext nach Sperre/App-Wechsel unterbrochen bzw. „running“ mit stehender Uhr, `resume()` hängt). Player schließt den Kontext im Hintergrund, ersetzt gestörte Kontexte bei der nächsten Geste, wartet nie ohne Zeitlimit und zeigt sonst den Hinweis „Der Ton hängt“ (Tippen spielt nach). 10 Tests mit nachgebautem iOS-Kontext (`tests/player.test.ts`), jeder Mechanismus per Mutation gegengeprüft; in Edge mit eingefrorener Audio-Uhr in Einstellungen und Session durchgespielt. Ton-Test und Diagnosezeile in den Einstellungen. Von Alex auf dem iPhone bestätigt (2026-11-04).
- **Lebendige Orte und Kajak-Übergänge (2026-11-04, Alex: „mehr Animationen, wie im Surfbrett-Beispiel, die Orte sollen Animationen haben“):** Vorbild ist Alex' `beispiel design1.mp4` (Kajak-Verleih). Alle fünf Regionen haben eine Szene, die sich beim Sichtbarwerden aufbaut und danach lebt (Hội An, Huế, Hà Nội, Sài Gòn neu; Đà Nẵng animiert), dazu Kartenfarbe und Hero-Objekt je Region. Die Weiter-Karte trägt das Hero-Objekt schräg; beim Öffnen fliegt es aufrecht in die Etappe, die mit Szenen-Band oben beginnt. Auch vom Pfad-Knoten aus wächst die Etappe, und zurück schrumpft sie in den Knoten (Scrollstand bleibt). Die Session öffnet sich als Kreis vom Tippunkt. Neu sind außerdem Tipp-Welle, Sternenregen bei richtiger Antwort, Ergebnis mit Szene und hochzählenden XP sowie gestaffelte Ankunft bei Tab-Wechseln. Toter Crossfade-Fallback entfernt. Geprüft: alle Szenen Bild für Bild, alle Übergänge Bild für Bild und per CDP-Screencast in Echtzeit, alle Regionen in drei iPhone-Größen und reduzierte Bewegung. Check, 110 Tests und E2E grün. Von Alex auf dem iPhone abgenommen (2026-11-04).
- **Tag und Nacht (2026-11-04, Alex: „Darkmode, die Szenen bei Nacht, Nacht 20–9 Uhr, in den Einstellungen hart schaltbar, Standardzeiten wiederherstellbar“):**
  - Automatik wechselt um 20:00 und 9:00 Uhr, auch bei offener App.
  - In den Einstellungen gibt es „Automatisch / Tag / Nacht“; „Automatisch“ stellt die Zeiten wieder her. Die Wahl liegt im Spielstand und übersteht Neuladen.
  - Der Wechsel wächst als Kreis vom Tippunkt bzw. vom Himmel.
  - Nachts: alle Tokens nachtblau mit gedämpften Kartenflächen.
  - Fünf Nachtszenen:
    - Đà Nẵng: Mondpfad, Fischerlaterne, erleuchtete Pagode, Lichter der Stadt.
    - Hội An: leuchtende Laternen, erleuchtete Läden, Spiegelungen, Blütenkerzen.
    - Huế: Mondschein mit Lichtsäule, angestrahlte Pagode, Drachenboot mit Laternen, Glühwürmchen.
    - Hà Nội: Fenster, Straßenlaternen, Scheinwerfer.
    - Sài Gòn: City-Skyline, bunte Spiegelungen, blinkende Warnlichter.
  - Hero-Laterne leuchtet, der Roller hat Licht.
  - Geprüft:
    - Szenen Tag und Nacht Bild für Bild (Tag unverändert).
    - App mit fester Uhr 12:00 und 22:00: alle Ansichten, Umschalten, Neuladen, Automatik, Übergänge nachts.
    - Alle Regionen nachts in Pro-Max-Maßen, WebKit-Rauchtest nachts.
    - 114 Tests und E2E grün.
  - Von Alex auf dem iPhone abgenommen (2026-11-04: „iPhone-Test ist gut, sieht gut aus“).
- **Phase 3/4 – Spielmodi, Belohnungen und Sprachführer: abgeschlossen** (2026-11-04, Opus 5.5 hoch). Check, 197 Vitest-Tests, 4 Playwright-WebKit-Tests grün; alle neuen Ansichten in Edge bei 440×956 und 375×667, Tag (12:00) und Nacht (22:00) Bild für Bild angesehen. Von Alex auf dem iPhone abgenommen (2026-11-04: „Alles passt“).
  - Modi: Paare gegen die Uhr (5 Wörter, 40 s), Satzbau, Hör-Diktat (flache Klangscheibe), Ton-Ninja (Ablenker nur im Ton verschieden, echte Minimalpaare zuerst). Eingemischt in Etappe, Boss (eine Paare-Aufgabe) und Training; Training mit Modus-Wahl.
  - Belohnungen: Truhe beim ersten Sieg je Boss (XP-Boost 2× für 15 min, Streak-Schutz bis 3, Accessoire; makelloser Boss = garantiert Accessoire), 22 Achievements, 3 rotierende Wochen-Challenges (+50 XP), Neuigkeiten als Toast bzw. auf dem Ergebnis. Trâu wächst (Kalb bis Level 4, jung bis 9) und trägt 8 Accessoires (Nón lá, Roller-Helm, Sonnenbrille, Khăn rằn, Glöckchen, Blumenkette, Mai-Blüte, Laterne). Profil zeigt Vorrat, Einkleiden, Woche, Erfolge.
  - Sprachführer: Situationskarten, Suche ohne Akzente, Favoriten. Prüfmodus (Einstellungen): 408 ungeprüfte Einträge, „passt“/„unnatürlich“ + Notiz, JSON-Export.
  - Inhalte: pron für w251–w538 (`pronAi:true`), Situations-Tags für alle Wörter und Sätze (Fließband, stichprobengeprüft).
  - UI-Klänge (WebAudio-Synthese über den Player-Kontext) und Haptik-Tick (iOS-18-switch, Feature-Detection), beide in den Einstellungen abschaltbar. Alte Spielstände bekommen Zähler aus dem Fortschritt nachgetragen.
  - Subagenten: fliessband ×4 (Haiku: pron ×2, Tags Wörter, Tags Sätze), builder ×2 (Sonnet: Spielmodi; Sprachführer + Prüfmodus), pruefer (Opus).
  - pruefer-Review: 1 Mangel (Satzbau bot Synonyme als Ablenker an, z. B. chờ/đợi „warten“, bố/cha „Vater“) und 5 Kleinigkeiten (Garantie der makellosen Truhe ging beim späteren Öffnen verloren; Challenge-XP zählten nicht fürs Tagesziel; erste Aufgabe einer neuen Woche fiel in die Basis; Haptik bei Paaren außerhalb der Geste; Test fürs Nachtragen alter Stände fehlte) – alle behoben, mit Tests (je per Mutation gegengeprüft), Nachprüfung ohne offene Mängel. Eigener Fund vorher: Anrede-Wörter als Satzbau-Ablenker (Hallo. = Chào bà./Chào ông.).
- **Phase 4/4 – Illustrationen, Animationen und Release: live seit 2026-11-05, iPhone-Abnahme ausstehend** (2026-11-04, Opus 5.5 hoch). Icon, Übergänge und Regionsszenen waren vorgezogen.
  - Etappen-Vignetten: 33 flache Motive (`StageVignette.svelte`) neben den Pfad-Knoten mit Titel; gesperrt grau, die aktuelle wiegt sich. Alle Motive bei Tag und Nacht groß und in Pfadgröße angesehen, Pfad in Pro-Max- und SE-Maßen.
  - Splash: 12 iOS-Startbilder (gleiche Komposition wie das Icon, `scripts/icons.ts`), nicht im Precache. Inline-Skript setzt nachts vor dem ersten Bild das Nachtthema.
  - Ablösung v13: Der SW lädt offene Fenster der alten App nach dem Übernehmen einmal neu. Lokal nachgestellt (v13 aus `main` installiert → Server auf `dist/` → Update): v2 erscheint nach ~3 s von selbst, `viet-trainer-v13` gelöscht, alte start_url und Audios offline. Dabei gefunden und behoben: Neuladen innerhalb von `waitUntil` blockierte sich selbst.
  - Qualität (Edge, Produktions-Build, 440×956, CPU ×4): Warmstart FCP ~330 ms, CLS 0, Scrollen des Pfads Median 8 ms/Bild (p95 17 ms), keine Tap-Ziele < 44 px auf 9 Ansichten.
  - Tests: 204 Vitest (neu: Vignetten, Startbilder, Nachtskript), 7 Playwright WebKit (neu: App-Kill mitten in der Session, Export/Import, Offline mit allen 808 Audios); neue Tests per Mutation gegengeprüft.
  - Deploy: `.github/workflows/pages.yml` (check, test, build → Pages). README und SESSION.md auf v2.
  - Subagenten: pruefer (Opus). Befunde: Release-Voraussetzungen in GitHub fehlen noch (siehe unten), PROGRESS nicht nachgeführt, Titel gesperrter Vignetten unter AA-Kontrast bei Tag → behoben (`--ink-muted`).
  - Nachprüfung nach dem Release (2026-11-05): Befund 1 und 2 erledigt. Befund 3 war nur in offenen Regionen behoben, denn `.region.locked { opacity: 0.6 }` drückte in gesperrten Regionen alle Texte unter AA: Vignetten-Titel tags ~2,8 : 1 und nachts ~4,1 : 1, Kicker und Untertitel der Regionskarte ebenso.
    - Behoben: Gedämpft werden nur noch Szene und Knoten. Die Kartenfläche verblasst über eine Papier-Lasur (`color-mix`, entspricht 60 % Deckkraft), die Schrift bleibt voll deckend.
    - Gemessen: alle 39 Texte in gesperrten Regionen, tags mindestens 5,6 : 1 und nachts mindestens 5,64 : 1.
    - Die Nachprüfung durch den pruefer ergab keine offenen Mängel mehr → P4-06 bestanden.
- **Release (2026-11-05, Alex: „Ja, Release“):**
  - Repo-Secret `VITE_PUSH_TOKEN` per Pipe gesetzt.
  - Pages-Quelle von „Branch main“ (legacy) auf „GitHub Actions“ umgestellt, vor dem Push.
  - `main` per Fast-Forward auf `v2` (`47e803e`) gesetzt und gepusht. `v2` liegt weiter nur lokal.
  - Workflow `Pages` grün: check, test, build, deploy.
  - Live geprüft:
    - `index.html` ist gebaut, mit 12 Startbild-Links und Nachtskript.
    - `sw.js` hat 830 Precache-Einträge, davon 826 eindeutig: Icons und Manifest stehen doppelt, workbox legt sie trotzdem nur einmal ab. Darunter sind 808 Audios.
    - Alle 842 Precache- und Startbild-URLs antworten mit 200.
    - Push-URL und Token stecken im Bundle. Die Einstellungen zeigen „Nur aus der installierten App“ statt „nicht eingerichtet“.
    - In Edge mit 440×956 startet die App mit sich aufbauender Szene. Der SW installiert alle 826 Dateien, wird aktiv und kontrolliert die Seite.
- **Update-Hinweis und Versionszeile (2026-11-05, Alex: „ich sehe nirgends die app version. und ich habe keine update benachrichtigung bekommen“):**
  - Ursache: iOS holt die installierte App aus dem Hintergrund, ohne sie neu zu laden. Der Browser sucht dann nie nach einem neuen `sw.js`, der Hinweis kam nur nach komplettem Schließen und Neustart.
  - Behoben:
    - Die App sucht bei jeder Rückkehr selbst (`visibilitychange`, höchstens einmal pro Minute, `lib/update.ts`).
    - Neuer Abschnitt „App“ in den Einstellungen: Versionszeile (Version · Build-Zeit · Commit, `__APP_BUILD__`) und „Nach Updates suchen“. Liegt schon eine neue Version bereit, ersetzt „Neue Version bereit – oben auf „Aktualisieren“ tippen.“ jede ältere Meldung.
    - „Aktualisieren“ lädt jetzt selbst neu, sobald die neue Version übernimmt. workbox-window tut das nur, wenn beim Öffnen schon ein SW die Seite steuerte, also nicht nach der allerersten Installation.
  - Geprüft:
    - check grün, 212 Vitest grün (neu: `tests/update.test.ts`).
    - 5 Mutationen machen die neuen Tests rot: kein Mindestabstand, Knopf ohne Vorrang, `waiting` ignoriert, kein offline-Fang, kein Zeitstempel.
    - Produktions-Vorschau in Edge mit 440×956:
      - Erstinstallation und neuer Build im Hintergrund: der Knopf findet ihn, Hinweis oben, „Aktualisieren“ lädt das neue Bundle.
      - Gesteuert geöffnet: simulierte Rückkehr → ein Update-Aufruf → Hinweis → Neuladen.
      - Innerhalb einer Minute nach der Suche per Knopf überspringt die Rückkehr die Suche.
      - Tag und Nacht ohne Konsolenfehler.
  - Für Alex einmalig: Die zuletzt live gegangene Version (`7ed930e`) kennt die Suche bei Rückkehr noch nicht. Nach dem nächsten Deploy die App einmal ganz schließen und neu öffnen; ab dann reicht die Rückkehr in die App.
- **Nächste Schritte:**
  1. Alex' iPhone-Abnahme, danach `tests.json` nachführen:
     - P4-01: Qualität.
     - P4-02: Die installierte v13 wird von selbst zu v2. Das neue Icon kommt erst nach erneutem „Zum Home-Bildschirm“.
     - P4-03: Flugmodus.
     - P4-04: Definition of Done inklusive Push morgens und abends.
  2. Optional, nur nach Rückfrage: Test-Worker `viet-trainer-v2` löschen. Er wird nicht mehr gebraucht.

## Phase 2 – Ergebnis

- Logik in `src/lib/logic/` (srs, path, session, rewards), Screens in `src/screens/` (Lernpfad, Etappe, Play mit Intro/Quiz/Hören/Rollen/Boss/Training, Training, Profil, Einstellungen mit Push-Status, Zeiten, Test-Push, Export/Import).
- Push: Worker `viet-trainer-push` (Cloudflare Free-Plan, KV `STATE`, Cron alle 5 min, VAPID/Token als Secrets), Client `src/lib/push.svelte.ts`, SW-Handler. Testkopie unter `https://viet-trainer-v2.alex-rettig.workers.dev/viet-trainer/` (Workers Static Assets statt Pages, weil wrangler Pages-Projekte nicht mehr anlegt).
- Stil (Alex): durchgehend hell, Hör-Aufgaben mit flacher Klangscheibe (CLAUDE.md). Prototyp und Gecko gelöscht.
- iPhone-Befunde behoben: Audio stumm (iOS-Stummschalter → Audio Session `playback`; Unlock bei touchend/click statt nur pointerdown), Lernpfad sprang nach Übergängen und lag unter der Statusleiste (Weiter-Karte nach oben, kein Auto-Scroll, Statusleisten-Fläche, Shared-Element-Morph nur Lernpfad ↔ Etappe).

## Phase 1 – Ergebnis

- Branch `v2`; alte App in `legacy/`; `prepared/` eingecheckt.
- Inhalte: 538 Wörter, 270 Sätze, 10 Rollen, 9 Satzkontexte → `src/content/*.json`; 808 MP3s → `public/audio/`.
- Lernpfad: 5 Regionen, 33 Etappen (`scripts/migrate/curriculum.ts`); Etappe 1 „Ich & du“ und 7 „Familie & Anreden“ sind Pronomen-Etappen, 16 „Kleine Wörter, große Wirkung“ die Partikel-Etappe.
- Speicher: IndexedDB über idb-keyval, `persist()`, Export/Import, `normalizeSave`.
- Design: Tokens, Card/Button/PillNav/ProgressRing/GlowOrb, Illustration Marmorberge, Maskottchen-Entwürfe, Prototyp in `src/prototype/`.
- PWA-Gerüst: `src/sw.ts` (Precache inkl. Audio, löscht `viet-trainer-v*`), Manifest, „Neue Version“-Hinweis.

## Offene Punkte / Abweichungen

- Phase 3: Die KI-Aussprache (w251–w538) und die Situations-Tags sind ungeprüft – die Verlobte sieht pron im Prüfmodus. Tag „smalltalk“ ist bei Wörtern sehr häufig (Sammeltag für Verben/Partikel), „familie“ bei Sätzen oft Zweittag (sozialer Kontext).
- Phase 3: Satzbau zeigt bei Sätzen mit Kontext die Anrede („zu alter Frau (Oma)“), weil die deutsche Übersetzung sie nicht enthält; Anrede-/Pronomenwörter sind als Ablenker ausgeschlossen.

- Partikel-Etappe: `de` der Partikel ist noch der Text aus `prepared/words-ext.js` (teils Übersetzung, teils Erklärung) – bei Bedarf in Phase 3 mit dem Prüfmodus nachschärfen.
- Satz-Verteilung je Etappe ungleich (1–22), weil Sätze automatisch in die Etappe ihres letzten Wortes fallen. Für Sessions unkritisch (Wiederholungen mischen ein).
- Altes Homescreen-Icon: iOS übernimmt ein neues Icon erst, wenn die App neu zum Home-Bildschirm hinzugefügt wird.
- Playwright-WebKit unter Windows (WinCairo) stürzt bei View Transitions auf Quiz-Aufgaben ab → E2E läuft ohne View Transitions; Übergänge per Edge-Playwright in iPhone-Maßen prüfen (CLAUDE.md) und auf dem iPhone bestätigen lassen.
- P1-06 (LAN-Dev-Server auf dem iPhone) nie separat bestätigt; die installierte Testkopie läuft auf Alex' iPhone (Push, Audio, Vollbild) – der LAN-Weg selbst ist ungeprüft.
- Push-Token und VAPID-Keys existieren nur als wrangler-Secrets; für spätere Builds liegt das Token außerhalb des Repos in der Sitzungs-Scratchpad-Datei `push.env`. Geht es verloren: neues Token erzeugen, per `wrangler secret put PUSH_TOKEN` setzen, App neu bauen.
- npm audit: 11 Meldungen (low/moderate) in Build-Abhängigkeiten von vite-plugin-pwa/workbox-build, nicht in der ausgelieferten App.
- Push-Token steckt im ausgelieferten JS (Build-Env) – schützt nur gegen Zufallszugriffe.

## Ideen außerhalb des Umfangs

- Lernpfad mit gezeichneter Route zwischen den Etappen-Knoten.
