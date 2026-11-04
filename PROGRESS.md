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
- **Phase 3/4 – Spielmodi, Belohnungen und Sprachführer: gebaut und geprüft** (2026-11-04, Opus 5.5 hoch). Check, 197 Vitest-Tests, 4 Playwright-WebKit-Tests grün; alle neuen Ansichten in Edge bei 440×956 und 375×667, Tag (12:00) und Nacht (22:00) Bild für Bild angesehen. Auf Alex' iPhone noch nicht getestet.
  - Modi: Paare gegen die Uhr (5 Wörter, 40 s), Satzbau, Hör-Diktat (flache Klangscheibe), Ton-Ninja (Ablenker nur im Ton verschieden, echte Minimalpaare zuerst). Eingemischt in Etappe, Boss (eine Paare-Aufgabe) und Training; Training mit Modus-Wahl.
  - Belohnungen: Truhe beim ersten Sieg je Boss (XP-Boost 2× für 15 min, Streak-Schutz bis 3, Accessoire; makelloser Boss = garantiert Accessoire), 22 Achievements, 3 rotierende Wochen-Challenges (+50 XP), Neuigkeiten als Toast bzw. auf dem Ergebnis. Trâu wächst (Kalb bis Level 4, jung bis 9) und trägt 8 Accessoires (Nón lá, Roller-Helm, Sonnenbrille, Khăn rằn, Glöckchen, Blumenkette, Mai-Blüte, Laterne). Profil zeigt Vorrat, Einkleiden, Woche, Erfolge.
  - Sprachführer: Situationskarten, Suche ohne Akzente, Favoriten. Prüfmodus (Einstellungen): 408 ungeprüfte Einträge, „passt“/„unnatürlich“ + Notiz, JSON-Export.
  - Inhalte: pron für w251–w538 (`pronAi:true`), Situations-Tags für alle Wörter und Sätze (Fließband, stichprobengeprüft).
  - UI-Klänge (WebAudio-Synthese über den Player-Kontext) und Haptik-Tick (iOS-18-switch, Feature-Detection), beide in den Einstellungen abschaltbar. Alte Spielstände bekommen Zähler aus dem Fortschritt nachgetragen.
  - Subagenten: fliessband ×4 (Haiku: pron ×2, Tags Wörter, Tags Sätze), builder ×2 (Sonnet: Spielmodi; Sprachführer + Prüfmodus), pruefer (Opus).
  - pruefer-Review: 1 Mangel (Satzbau bot Synonyme als Ablenker an, z. B. chờ/đợi „warten“, bố/cha „Vater“) und 5 Kleinigkeiten (Garantie der makellosen Truhe ging beim späteren Öffnen verloren; Challenge-XP zählten nicht fürs Tagesziel; erste Aufgabe einer neuen Woche fiel in die Basis; Haptik bei Paaren außerhalb der Geste; Test fürs Nachtragen alter Stände fehlte) – alle behoben, mit Tests (je per Mutation gegengeprüft), Nachprüfung ohne offene Mängel. Eigener Fund vorher: Anrede-Wörter als Satzbau-Ablenker (Hallo. = Chào bà./Chào ông.).
- **Nächste Schritte:** Testkopie ist deployt (2026-11-04, mit Push-Env). Alex testet auf dem iPhone: alle vier Modi, Truhe, Profil, Sprachführer, Prüfmodus-Export (Teilen), Effekt-Klänge und Haptik (Einstellungen zeigen, ob das iPhone sie unterstützt). Danach Phase 4 „Illustrationen, Animationen und Release“ (Opus 5.5, hoch). Hinweis Phase 4: Icon, Übergänge und Regionsszenen sind vorgezogen – dort nur noch Splash und Feinschliff.

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
- Phase 3: Ob iOS die Haptik-Erkennung (`'switch' in HTMLInputElement.prototype`) bestätigt, zeigt erst das iPhone – die Einstellungen melden „nicht verfügbar“, falls nicht. Der Teilen-Zweig des Prüfmodus-Exports ist nur auf dem iPhone prüfbar.
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
