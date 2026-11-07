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
- **Phase 4/4 – Illustrationen, Animationen und Release: abgeschlossen** (2026-11-06, Opus 5.5 hoch; live seit 2026-11-05). Icon, Übergänge und Regionsszenen waren vorgezogen. Von Alex auf dem iPhone abgenommen (2026-11-06: „Alles geprüft, passt“).
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
  - Live seit `ae5840c`. Alex sah danach weiter keinen Hinweis. In Playwright-WebKit nachgestellt, mit GitHub-Pages-Headern (`max-age=600`) und Build `7ed930e` als installierter Version:
    - Rückkehr in die offene App: keine Suche, kein Hinweis.
    - Echter Neustart: WebKit holt `sw.js` frisch (ca. 1 s nach dem Start, trotz `max-age`), und der Hinweis erscheint. Der Cache-Verdacht und ein Wettlauf mit workbox-window sind damit widerlegt.
    - Mit `ae5840c` installiert findet schon die Rückkehr die neue Version. Wird die App geschlossen statt aktualisiert, übernimmt die wartende Version beim nächsten Start von selbst.
    - Erste Folgerung „kein echter Neustart“ war falsch: Auch nach iPhone-Neustart kam kein Hinweis (2026-11-06).
  - **Eigentliche Ursache:** Auf Alex' iPhone läuft die installierte **Testkopie** (`viet-trainer-v2.alex-rettig.workers.dev`, siehe P2-06 und „Offene Punkte“). Releases gehen nur nach GitHub Pages, die Testkopie bekommt seit dem Release keine Updates mehr. Der Hinweis kam früher, weil damals auf die Testkopie deployt wurde.
  - Weg für Alex: In der Testkopie „Exportieren (JSON)“ und in „Dateien“ sichern. Dann in Safari `https://eliminatron-commits.github.io/viet-trainer/` öffnen → „Zum Home-Bildschirm“. In der neuen App „Importieren …“ und Erinnerungen neu einschalten. Danach das Testkopie-Icon löschen; ihr Push-Abo verwirft der Worker beim nächsten 404/410 selbst.
  - Erledigt (2026-11-06): Alex hat umgezogen und läuft jetzt auf der echten App. Test-Worker `viet-trainer-v2` auf seinen Wunsch gelöscht (404). Push-Worker und Live-App antworten weiter.
  - Auf dem iPhone bestätigt (2026-11-06, erstes echtes Update auf `beb4f25`): „Neue Version verfügbar“ kam bei der Rückkehr in die App, nach „Aktualisieren“ zeigt die Versionszeile „06.11.2026, 15:19 · beb4f25“.
- **Lernpfad ohne Vignetten (2026-11-06, Alex: „die kleinen symbole und text neben den levels wirkt unausgereift … nicht mehr so clean“):**
  - Der Knoten ist das Symbol, der Titel steht darunter (12 px, beim aktuellen 18 px wegen des Rings). Die Etappen stehen jetzt 28 statt 18 px auseinander, damit jeder Titel klar zu seinem Knoten gehört.
  - `StageVignette.svelte` und `tests/vignette.test.ts` auf Alex' Wunsch gelöscht (2026-11-06). In der Git-Historie bis `beb4f25` erhalten.
  - Geprüft in Edge bei 440×956, Tag und Nacht, offene und gesperrte Region:
    - Alle 33 Titel sind voll deckend. Kontrast mindestens 6,9 : 1 bei Tag und etwa 9 : 1 bei Nacht.
    - Etappe öffnen und schließen klappt, ohne neue Konsolenfehler.
    - check grün, 212 Vitest grün.
- **iPhone-Abnahme (2026-11-06):**
  - P4-01, P4-03 und P4-04 bestanden. Alex hat Qualität, Flugmodus, Erinnerungen morgens und abends und den Fortschritt nach dem Update geprüft: „Alles geprüft, passt“.
  - P4-02 bestanden ohne iPhone-Prüfung. Alex hat kein Icon der alten App mehr. Der Wechsel v13 → v2 ist lokal nachgestellt (siehe oben).
- **Route im Lernpfad (2026-11-06, Alex wählte die Idee aus der Liste):**
  - Von Knoten zu Knoten führt eine gestrichelte S-Kurve (`PathRoute.svelte`, `logic/route.ts`). Sie verbindet die Knotenmitten und setzt unter Knoten und Titeln aus.
  - Der zurückgelegte Weg ist rot, der Weg voraus leise. Jeder Abschnitt setzt sich beim Sichtbarwerden Strich für Strich zusammen. Die Striche zur aktuellen Etappe pulsieren als Welle auf ihren Knoten zu.
  - Die Etappen stehen jetzt 52 statt 28 px auseinander, damit die Route Platz hat.
  - Verworfen: Route vom Titel zum nächsten Knoten. In der knappen Höhe lagen die Striche fast waagerecht und wirkten wie Unterstreichungen.
  - Geprüft in Edge bei 440×956 mit e01–e04 geschafft, Tag und Nacht:
    - offene und gesperrte Region; Aufbau Bild für Bild;
    - Etappe vom Knoten öffnen und zurück, ohne Konsolenfehler;
    - reduzierte Bewegung: alles sofort sichtbar, keine Animation;
    - kein seitliches Scrollen.
  - check grün, 214 Vitest grün (neu: `tests/route.test.ts`, 4 Mutationen machen ihn rot).
- **Phase 5 – Kreativ-Runde: abgeschlossen** (2026-11-07, Opus 5.5 hoch; begonnen 2026-11-06, live seit `ca545f5`). Von Alex auf dem iPhone abgenommen (2026-11-07: „Alles passt“). Alex: „die anderen Bereiche sind eher langweilig … mehr Kreativität mit Animationen, schönem Design so wie im Lernpfad“, und im Profil gebe es zu wenig zu tun. Er hat diese Ideen gewählt, Akzeptanz siehe `tests.json` Phase 5:
  1. Lernpfad: Route (erledigt, P5-01).
  2. Session „Etappe als Reise“: Trâu läuft oben auf einer Route zum Ziel, die Szene der Region baut sich mit dem Fortschritt auf (P5-02).
  3. Session „Lebendige Wörter“: Buchstabe für Buchstabe, Tonzeichen fallen auf ihre Vokale, die Karte dreht sich (P5-03).
  4. Profil „Trâus Hof“: streicheln, füttern, einkleiden, nachts schlafen (P5-04).
  5. Profil „Reisepass“: Erfolge als Stempel, Souvenirs je Region (P5-05).
  6. Training „Reisfeld“: eine Reispflanze je gelernter Einheit (P5-06).
  7. Training „Modus-Karussell“ (P5-07).
  8. Sprachführer „Orte statt Kacheln“ (P5-08).
  9. Gesamtprüfung (P5-09).
  10. Satzlupe und Wortkarte (P5-11, Alex’ Wunsch vom 2026-11-07, vor der Abnahme eingeschoben).
  - Reihenfolge: Session, Profil, Training, Sprachführer. Jeder Bereich wird bei 440×956 Tag und Nacht Bild für Bild geprüft und Alex gezeigt, bevor der nächste beginnt.
  - **Punkt 2 erledigt (2026-11-06):** `play/Journey.svelte` ersetzt den Fortschrittsbalken und ist selbst die `progressbar`.
    - Szene der Region als Band (84 px, auf kleinen iPhones 64 px) unter flachem Nebel. Der Nebel weicht mit Trâu zurück.
    - Weg aus 22 Strichen (erreicht rot) zum Hero-Objekt der Region. Trâu (50 px) geht nach jeder gelösten Aufgabe weiter: hüpfend bei richtig, mit hängendem Kopf bei falsch.
    - Schließen und Boss-Leben als Glasknöpfe auf der Szene. Ein neuer Trainingsblock startet eine neue Reise.
    - Geprüft in Edge bei 440×956 (Tag und Nacht) und 375×667: Start, richtig, falsch, Boss mit Leben, Öffnen als Kreis. Keine Konsolenfehler, kein seitliches Scrollen. check, 214 Vitest und Playwright 7/7 grün.
  - **Punkt 3 erledigt (2026-11-06):** `play/IntroCard.svelte` mit `glyphs()` in `logic/tones.ts`. Diese Datei war schon da (Ton-Ninja) und wurde nur ergänzt.
    - Buchstaben erscheinen im Takt von 55 ms, zuerst ohne Ton. Jedes Tonzeichen fällt als rote Fläche (eigene Formen für sắc, huyền, hỏi, ngã, nặng), liegt 460 ms und verschmilzt mit der Schrift.
    - Danach dreht sich die Karte: vorn Gelb mit dem Wort, hinten Weiß mit der Übersetzung. Der Dreh-Knopf dreht zurück.
    - Geprüft:
      - Temporäres Labor mit allen Tönen zu festen Zeiten, Tag und Nacht. Die Tonzeichen landen auf dem echten Akzent, auch über ê, unter â und bei i (punktloses ı). Das Endbild zeigt die reine Schrift. Das Labor ist danach wieder gelöscht.
      - Session in Edge Bild für Bild; reduzierte Bewegung zeigt direkt die Rückseite.
      - check grün, 216 Vitest grün (neu: `tests/tones.test.ts`, 2 Mutationen machen ihn rot).
      - Playwright 7/7 grün. Ein Lauf vorher war „Fortschritt sichern“ einmal rot; die Meldung ist nicht erhalten. Danach war der Test viermal grün, darunter ein ganzer Lauf. Ursache unbekannt: Bei erneutem Rot zuerst die Fehlermeldung sichern.
  - Live seit `f7c4319`. Alex hat Route, Reise und Lebendige Wörter auf dem iPhone abgenommen (2026-11-06: „sieht gut aus“).
  - **Punkt 4 erledigt (2026-11-06), Trâus Hof** (`profile/TrauYard.svelte`, `illustrations/YardScene.svelte`, `logic/yard.ts`):
    - Szene mit Stelzenhaus, Reisterrassen, Bananenstaude und Heuhaufen. Nachts leuchten die Fenster, Glühwürmchen fliegen.
    - Neue Stimmungen für Trâu: `sleep` und `eat`.
    - Streicheln bringt Herzen. Nachts schläft Trâu (Zzz) und wacht beim Antippen kurz auf.
    - Füttern: Gras gibt es einmal am Tag nach erreichtem Tagesziel, im neuen Spielstandfeld `yard` (alte Stände werden ergänzt).
    - Die Kleiderkiste liegt jetzt direkt unter dem Hof, damit man Trâu beim Anziehen sieht; darunter folgt das Level.
  - **Punkt 5 erledigt (2026-11-06), Reisepass** (`profile/Passport.svelte`, `logic/passport.ts`), ersetzt die Erfolgsliste:
    - Einband, dann Personalien und Souvenirs, dann vier Stempelseiten.
    - Blättern dreht die Seiten um den Rücken. Stempel knallen beim Aufschlagen aufs Papier; angetippt erklären sie sich.
    - Alex' Einwand (2026-11-06): „das hast du gut lesbar genannt?? … so dass es in der form sitzt“. „LOSGEFAHREN“ ragte über den Ring, und ich hatte das nachts trotzdem lesbar genannt.
      - Behoben: Titel und Datum sitzen als Block mittig, die Schrift folgt dem längsten Wort und der Stempelbreite, Titel aus drei Wörtern werden kleiner, das Rechteck ist höher.
      - Gemessen: alle 22 Stempel bei 440 und 375 px, Tag und Nacht, gerade gestellt gegen die innerste Fläche jeder Form, mit 4 Einheiten Luft. Die Gegenprobe mit zu großer Schrift fällt durch.
  - Geprüft in Edge bei 440×956 und 375×667, Tag und Nacht:
    - Hof: Gras, Füttern, Streicheln, Schlafen, Wecken, Anziehen.
    - Pass: Einband, Blättern Bild für Bild, Wischen, Stempel antippen.
    - Keine Konsolenfehler, kein seitliches Scrollen.
    - check grün, 223 Vitest grün (neu: `tests/yard.test.ts` mit 3 Mutationen, `tests/passport.test.ts`).
  - Alex hat Hof und Reisepass auf dem iPhone abgenommen (2026-11-06: „Passt so, weiter“).
  - **Punkt 6 erledigt (2026-11-06), Reisfeld** (`training/RiceField.svelte`, `logic/field.ts`). Zählkarte und „Gemischt“ sind jetzt eine Karte „Dein Reisfeld“: Szene, Zahl, „x durstig · y reif“, Info-Feld, „Nur Verben“, Knopf („Feld gießen“, solange etwas fällig ist, sonst „Training starten“).
    - Je gelernter Einheit eine Reispflanze, Wuchs nach SRS-Box (Setzling bis reif mit goldener Rispe). Fällige Pflanzen sind fahl und lassen Blätter und Rispen hängen.
    - Die Pflanzen sind nach Wuchs sortiert (vorne Setzlinge, hinten das goldene Band) und stehen immer über das ganze Feld in vollen, versetzten Reihen; die Dichte passt sich der Anzahl an, auch wenn alles gelernt ist. Dadurch ziehen Pflanzen zwischen Besuchen um – bewusst, der erste Entwurf in Lernreihenfolge wirkte halb leer und bunt durcheinander.
    - Kommt man zurück, zieht das Gießen als Welle von links nach rechts übers Feld: Tropfen fallen als Striche in jede gegossene Pflanze, sie richtet sich federnd auf und wächst, neue Setzlinge sprießen; das Info-Feld meldet „Seit deinem letzten Blick: n neu gepflanzt · n gegossen · n gewachsen“. Der Vergleichsstand liegt nur im Speicher (nach einem Neustart keine Animation).
    - Antippen: die Pflanze hüpft, das Info-Feld zeigt Wort, Übersetzung und Zustand („durstig seit gestern“, „reif · in 6 Tagen wieder gießen“); Wasser zieht Ringe. Leben: Böen laufen als Welle (`loop-gust`), Wasser glitzert, nachts Glühwürmchen.
    - Geprüft in Edge bei 440×956 (Tag und Nacht) und 375×667: Ruhe, Aufbau, Antippen, Nur Verben, Gießen in Echtzeit per CDP-Screencast; reduzierte Bewegung zeigt sofort den Endstand ohne Tropfen, die Meldung bleibt. Keine Konsolenfehler, kein seitliches Scrollen. Bei 375×667 liegt der Knopf unter der Falz (Seite scrollt), bei 440×956 nicht.
    - check grün, 230 Vitest grün (neu: `tests/field.test.ts`, 6 Mutationen machen ihn rot), Playwright 7/7 grün.
  - Live seit `321aad4`.
  - **Punkt 7 erledigt (2026-11-06), Modus-Karussell** (`training/ModeCarousel.svelte`, `training/ModeMotif.svelte`, `training/motion-loop.ts`, `logic/carousel.ts`), ersetzt die vier Modus-Karten:
    - Karten zum Wischen mit Einrasten in der Mitte, Nachbarn lugen hervor, Punkte darunter. Nur die mittlere Karte lebt; Antippen einer Nachbarkarte holt sie in die Mitte, Antippen der mittleren startet. Nach der Übung steht das Karussell wieder auf derselben Karte.
    - Motive: Paare leuchten auf, schnappen zusammen und verblassen, unten läuft die Zeit ab. Satzbau-Kacheln springen aus der Streuung in die Satzleiste. Beim Hör-Diktat pulsiert die Klangscheibe, die Wörter erscheinen einzeln. Beim Ton-Ninja fliegen Tonzeichen kreiselnd aufs a.
    - Die Motive zeigen nur Gelerntes (kurze Wörter, zwei verschiedene kurze Sätze); ohne passenden Inhalt bleiben die Kacheln leer. Gesperrte Karten und reduzierte Bewegung zeigen eine ruhige Pose.
    - Start: Die Karte wächst per `morph-open` zum Vollbild, die Übung geht in der Kartenfarbe auf (Schleier blendet aus). Der erste Versuch ohne Schleier wirkte matschig (halbdurchsichtige orange Karte über heller Session).
    - Gefunden und behoben: Beim Wechsel lagen zwei Tonzeichen kurz übereinander und bildeten ein rotes X (wie „falsch“). Jetzt fliegt das vorige los, sobald das nächste startet; gemessen über die ganze Schleife keine Überdeckung, die alte Zeitfolge fällt bei derselben Messung durch.
    - Geprüft in Edge bei 440×956 (Tag und Nacht) und 375×667: jede Karte Bild für Bild (Web-Animations-Zeit fest gesetzt), Wachsen in Echtzeit per CDP-Screencast, Rückkehr, Einrasten beim Wischen, leerer Spielstand, reduzierte Bewegung (Motive stehen, kein Übergang, kein Schleier). Keine Konsolenfehler, kein seitliches Scrollen.
    - check grün, 233 Vitest grün (neu: `tests/carousel.test.ts`, 6 Mutationen machen ihn rot), Playwright 7/7 grün (Trainingstest holt die Karte erst per Punkt in die Mitte).
  - Live seit `1de5465`.
  - **Punkt 8 erledigt (2026-11-06), Sprachführer „Orte statt Kacheln“** (`illustrations/places/*`, `illustrations/PlaceScene.svelte`, `logic/places.ts`, `screens/SituationScreen.svelte`, dazu `components/EntryList.svelte` und `components/SearchField.svelte` aus dem Sprachführer herausgelöst):
    - Jede der zehn Situationen ist ein eigener lebender Ort, randlos oben in ihrer Kachel (wie die Regionskarten): Garküche mit dampfender Phở, Wohnhaus mit wehender Wäsche, Taxi in der Stadt, Obststand, zwei Leute beim Eistee mit abwechselnden Sprechblasen, Zug an der Küste, Hängematte mit Ventilator, Lotusteich, Apotheke mit pulsierendem Kreuz, Laptop mit tippenden Zeilen. Jeder Ort bei Tag und Nacht (Nachtlichter, Mond), höchstens 14 Farben.
    - Neue Schleifen in `scene.css`: `loop-steam`, `loop-talk`, `loop-type`, `loop-pass` (Durchfahrt; ruhend steht der Zug ganz im Bild, damit er bei reduzierter Bewegung nicht fehlt).
    - Antippen: Die Kachel wächst per `morph-open` zur Situation als Vollbild (eigener Bildschirm `situation` wie die Etappe, ohne Navigation): oben baut sich der Ort auf, darunter Titel, Suche in der Situation und die Einträge. Zurück schrumpft sie in ihre Kachel, der Scrollstand der Übersicht bleibt.
    - Gefunden und behoben: Mangos verschwammen zu einem gelben Fleck (jetzt mit Schattenseite), Fransen der Hängematte wirkten wie Flammen (entfernt), der Dampf der Tasse lief in die Uhr, das Apothekenschild wurde bei 375 oben angeschnitten.
    - Kontrast: `--ink-muted` erreicht auf den Kartenfarben nicht überall AA (gemessen: Meer bei Tag 4,32, nachts Laterne 3,84, Meer 4,12, Gelb 3,75). Die neuen Texte auf Kartenflächen nutzen darum `--ink`. **Für P5-09:** dasselbe Muster steckt schon in Etappe und Weiter-Karte (Kicker).
    - Geprüft in Edge: jeder Ort im temporären Labor bei 400×260 zu festen Zeiten (Aufbau und Ruhe, Tag und Nacht, Labor danach gelöscht); in der App bei 440×956 (Tag und Nacht, mit Safe-Area 59 px) und 375×667; Öffnen und Zurück in Echtzeit per CDP-Screencast; reduzierte Bewegung (keine laufende Animation, Orte fertig, kein Übergang); Namen der Kacheln einzeilig ohne Überlauf (gemessen, mit Gegenprobe). Keine Konsolenfehler, kein seitliches Scrollen.
    - check grün, 237 Vitest grün (neu: `tests/places.test.ts`: Farben der Nachbarn, Paletten Tag/Nacht; 4 Mutationen machen ihn rot), Playwright 7/7 grün (Sprachführer- und Sicherungstest gehen jetzt über „Zurück“ aus der Situation).
  - Live seit `a9287b1`.
  - Alex (2026-11-07): „Das Taxi fährt rückwärts im Bild“. Die Karosserie zeigte mit der langen Motorhaube nach links, während Scheinwerfer, Fahrbahn und Räder nach rechts fuhren. Behoben: Karosserie gespiegelt, Lichter vorn bzw. hinten, Räder versetzt.
  - **Punkt 9 erledigt (2026-11-07), Gesamtprüfung P5-09:**
    - `pruefer` (Opus 5.5) über ganz Phase 5 und alle Ansichten. Dazu eine eigene Gesamtmessung in Edge über jede Ansicht: Lernpfad leer und mit Fortschritt, Etappe, jede Aufgabenart samt richtig und falsch, Ergebnis, Boss mit Truhe, Training mit jedem Modus, Sprachführer, Suche, Favoriten, Situation, Profil, Reisepass, Truhe, Einstellungen, Prüfmodus, Satzlupe, Wortkarte. Gemessen bei Tag und Nacht, bei 440 und 375 px.
    - Messverfahren:
      - Kontrast per Pixel: Text unsichtbar machen (nur die Glyphen), Hintergrund hinter jeder Zeile abtasten.
      - Tap-Ziele, laufende Animationen bei reduzierter Bewegung und `scrollWidth`.
    - Gefunden und behoben:
      - **Kontrast:** `--ink-muted` lag auf Meer (Tag) und nachts auf Laterne, Meer und Gelb unter AA; nachts lag auch `--ink` auf den `-soft`-Tönen darunter (Wort-Chips der Etappe, gewählte Paar-Kachel, angezogenes Accessoire). Grün auf Grün (`--ok` auf `--ok-soft`) lag bei 3,48, `--ink-3` als Text bei 1,9 bis 3,8 (Reisepass, gesperrtes Accessoire).
      - Lösung über die Tokens: `--ink-muted` kräftiger (Tag 0,82, Nacht 0,95), nachts sind die `-soft`-Töne dunkler als ihre Fläche, `--ok` bei Tag dunkler. Text in `--ink-3` wurde `--ink-2`; offene Stempel verblassen nur noch im Umriss. Der Sperrgrund im Karussell ist lesbar.
      - **Tap-Ziele:** Die Punkte des Karussells waren 32 px breit, jetzt 44.
      - **Reduzierte Bewegung:** Ohne View Transitions (reduzierte Bewegung, ältere Browser) stellten Lernpfad und Sprachführer nach „Zurück“ den Scrollstand nicht wieder her, weil `data-vt` dann nie gesetzt wird. Jetzt merkt sich `transitionTo` die Art des Wechsels auch ohne Übergang (`arrivingBy()`). Außerdem wartet das Ende der Paare bei reduzierter Bewegung nicht mehr 700 ms.
      - **Seitliches Scrollen:** Der Sternenregen nahe am rechten Rand machte die Runde 453 px breit (bei 375). Jetzt schneidet `main.play` waagerecht ab (`overflow-x: clip`); gemessen 375, die Gegenprobe ohne Fix ergibt 453.
      - **Klein:** feste Farben im Gras (jetzt Tag/Nacht-Palette) und im Lernpfad (`--yellow-deep`). Mondspiegelung und Glühwürmchen kommen als gemeinsame Himmelsfarben aus `Sky.svelte` (`MOON_SHINE`, `FIREFLY`).
    - Ergebnis der Messung: Alle Texte erreichen AA bei Tag und Nacht. Darunter liegen nur deaktivierte Bedienelemente (nach WCAG ausgenommen: Prüfen vor dem Legen, Bosskampf vor dem Lernen, Einsetzen ohne Boost, Export ohne Urteil, Haptik in Edge, beantwortete Optionen, gesperrte Knoten). Dazu kamen drei Messartefakte: Text unter der festen Navigation, im Blatt hinausgescrollter Text, die gekürzte dritte Zeile der Sammelmeldung; nachgesehen.
    - Alle Tap-Ziele messen mindestens 44 px; das Häkchen „Nur Verben“ liegt in einem 44 px hohen Label. Bei reduzierter Bewegung läuft keine Animation (nur die Breite des Paare-Timers springt sekündlich). Keine Ansicht scrollt seitlich, keine Konsolenfehler.
  - **Punkt 10 erledigt (2026-11-07), Satzlupe und Wortkarte** (`lib/lookup/*`, `logic/gloss.ts`, `components/LivingWord.svelte` und `components/ToneMark.svelte` aus der Einführungskarte herausgelöst – bildgleich geprüft, Bilder ab 300 ms pixelgleich). Alex: „bei den ganzen Sätzen/Wörtern … drauf klicken können und jedes Wort einzeln auch erklärt bekommen. Sei kreativ“.
    - Antippen von Vietnamesisch öffnet ein Blatt von unten: Sprachführer-Einträge (Hinweis im Zähler), „Wort für Wort“ bzw. „Zum Wort“ unter der Lösung in der Runde (erst nach der Antwort), gesehene Wort-Chips der Etappe.
    - **Satzlupe:** Satz im Band der Regionsfarbe mit Gespräch (Kontext) und Anhören, darunter jedes Wort als Kachel mit Erklärung. Die Kacheln fallen nacheinander aus dem Satz. Anreden zeigen ihre Rolle im Gespräch („em“ = ich, „anh“ = du, roter Punkt); Silben ohne Wort im Wortschatz bleiben grau.
    - **Wortkarte:** Das Wort baut sich lebendig auf (Tonzeichen fallen), dazu Aussprache und Bedeutung. Aus einem Satz heraus steht die Rolle dabei („„ich“ – du sprichst zu älterem Mann“). Jeder Ton erscheint mit seinem Vokal und rotem Zeichen (Name und Schreibung, keine Tonverläufe wegen der Dialekte). „Dein Stand“ zeigt eine Reispflanze wie im Reisfeld, dazu bis zu drei weitere Sätze mit dem Wort (öffnen ihre Satzlupe) und Merken.
    - Antippen spielt immer das Audio. Das Blatt hat feste Höhe und einen eigenen Verlauf: Zurück, Schließen, Escape, der Fokus bleibt im Blatt und kehrt zurück.
    - Inhalte nur aus dem Bestand: 94,8 % aller Silben der 270 Sätze gehören zu Wörtern im Wortschatz, und jede Vokabel eines Satzes wird gefunden (Test).
    - Gefunden und behoben:
      - Der rote Rollenpunkt überdeckte Buchstaben, ngang zeigte einen leeren Kreis.
      - Das Blatt sprang beim Wechsel zwischen Satz und Wort in der Höhe und blinkte beim Wechsel kurz leer.
      - Die Tonzeichen am Vokal saßen zu hoch bzw. der Punkt im a; jetzt stehen sie wie in der Schrift daneben.
      - Die Lupe in der Rückmeldung quetschte die Lösung bei 375.
    - Geprüft in Edge bei 440×956 (Tag und Nacht, Safe-Area 59) und 375×667:
      - Öffnen und Wortwechsel Bild für Bild (feste Animationszeiten), der ganze Ablauf in Echtzeit per CDP-Screencast.
      - Gesamtmessung ohne Befund (Kontrast, Tap-Ziele, kein Überlauf).
  - check grün, 245 Vitest grün (neu: `tests/gloss.test.ts`, 5 Mutationen machen ihn rot), Playwright 9/9 grün. Neu: Satzlupe, Scrollstand ohne Übergänge (rot mit dem alten Code), Lupe in jedem Trainingsmodus.
  - Live seit `ca545f5` (2026-11-07).
- **Phase 6 – Ideen-Runde (ab 2026-11-07, Opus 5.5 hoch).** Alex hat aus acht Vorschlägen alle gewählt (2026-11-07). Akzeptanz siehe `tests.json` Phase 6. Alles nur aus vorhandenen Inhalten; keine neuen vietnamesischen Texte.
  1. Reisfeld als Werkzeug (P6-01) und Tagebuch im Spielstand (P6-02) – zusammen live, damit das Tagebuch früh zu zählen beginnt.
  2. Lückensatz (P6-03).
  3. Roller-Sprint (P6-04).
  4. Laternen-Kalender (P6-05).
  5. Wochenrückblick (P6-06).
  6. Trâus Tagesblick (P6-07).
  7. Reise zur nächsten Region (P6-08).
  8. Ton-Zwillinge (P6-09) – nur, wenn Alex die Bedeutungs-Variante will.
  9. Gesamtprüfung (P6-10), danach Abnahme (P6-11).
  - Jeder Punkt wird bei 440×956 und 375×667, Tag und Nacht, Bild für Bild und in Echtzeit geprüft und Alex gezeigt; live erst auf sein Wort.
  - Entscheidungen beim Planen:
    - „Ton-Zwillinge“ gibt es im Kern schon als Ton-Ninja (Schreibung mit dem richtigen Ton wählen). Neu wäre nur die Variante „Bedeutung wählen“ zwischen echten Ton-Zwillingen (66 Gruppen im Wortschatz). Darum steht der Punkt am Ende und wartet auf Alex.
    - „Feld gießen“ startete bisher das endlose gemischte Training (fällige zuerst). Neu ist es eine Gießrunde aus genau den durstigen Einheiten, die endet, wenn alle gegossen sind; ohne durstige Pflanzen bleibt „Training starten“ wie bisher.
    - Das Tagebuch zählt ab dem Update. Frühere Tage lassen sich nicht sicher rekonstruieren: Der Spielstand speichert keine Tage, und die Serie überbrückt Lücken mit dem Streak-Schutz. Darum bleibt der Kalender vor dem Update leer, statt zu raten.
    - Am ersten Tag einer neuen Woche ersetzt der Wochenrückblick den Tagesblick; dessen Punkte stehen dann auf der letzten Seite.
    - Die Reise gibt es zwischen den Regionen (vier Fahrten). Ein Finale nach Sài Gòn gehört nicht dazu (Idee).
  - **Punkt 1 erledigt (2026-11-07), Reisfeld als Werkzeug (P6-01) und Tagebuch (P6-02):**
    - „Feld gießen“ ist jetzt eine Gießrunde aus genau den durstigen Einheiten (`buildWateringBatch`): jede einmal, die ältesten zuerst, in Blöcken zu 12 (jeder Block eine neue Reise). Jede Antwort plant neu ein (richtig: später, falsch: morgen), deshalb endet die Runde, wenn nichts mehr fällig ist. Das Ergebnis heißt „Feld gegossen“ mit „Weiter trainieren“ (gewöhnliches Training); wer vorher schließt, sieht „Gießen unterbrochen“ mit „Weiter gießen“.
    - Eine angetippte Pflanze spielt ihr Wort bzw. ihren Satz (bei Rollen das Anredewort). Die gelbe runde Lupe rechts im Info-Feld öffnet Wortkarte bzw. Satzlupe. Abweichung von der Ideenbeschreibung: Das Blatt öffnet nicht direkt beim Antippen, sonst käme es beim Durchtippen des Felds jedes Mal hoch.
    - Tagebuch `save.days` (`logic/diary.ts`): je Tag XP, Aufgaben, richtige, neue Wörter, Runden, Tagesziel, Streak-Schutz. Gebucht in `recordSeen`, `recordTask`, Rundenende und Boss-Sieg, Challenge-XP über `settle`; überbrückte Tage markiert `begin`. Ältere Stände bekommen ein leeres Tagebuch, unbrauchbare Einträge fallen weg.
    - Gefunden und behoben:
      - Nachts hob sich der erste Lupenknopf (Fläche `--surface`) kaum vom Info-Feld (`--paper-2`) ab; jetzt gelb wie die Zweitknöpfe.
      - Der Knopf unter dem Text ließ beim ersten Antippen alles darunter um 32 px springen. Jetzt sitzt die Lupe rechts, und das Info-Feld hat drei Zeilen Mindesthöhe (gemessen: 440 bleibt bei 81 px; bei 375 wächst es nur bei langen Sätzen um eine Zeile, wie vorher).
    - Geprüft in Edge bei 440×956 (Safe-Area 59) und 375×667, Tag und Nacht: Feld mit angetippter Pflanze, Wortkarte, Aufgabe der Gießrunde, „Feld gegossen“, Rückkehr mit Gießwelle, „Gießen unterbrochen“. Keine Konsolenfehler, kein seitliches Scrollen.
    - check grün, 253 Vitest grün (neu: `tests/diary.test.ts`, Gießrunde in `tests/session.test.ts`; 7 von 8 Mutationen machen sie rot, die achte – Tagebuch-Eintrag nach dem Anlegen nicht neu gelesen – ist in Svelte 5 harmlos und bleibt als Absicherung), Playwright 11/11 grün (neu: `tests/e2e/field.spec.ts`, Gegenprobe ohne Gießrunde rot).
    - Live seit `d1a89bd` (2026-11-07); das Tagebuch zählt ab diesem Tag.
  - **Punkt 2 erledigt (2026-11-07), Lückensatz (P6-03):**
    - Neue Übung `gap`: ein gelernter Satz mit einer Lücke, darunter die Übersetzung und (wie im Satzbau) der Kontext; das fehlende Wort aus vier Kacheln wählen. Nach der Antwort steht das richtige Wort grün in der Lücke, die falsch getippte Kachel ist rot, dann spielt der ganze Satz (vorher kein Audio – geprüft: erst 198 ms nach der Antwort). „Wort für Wort“ öffnet die Satzlupe.
    - Im Modus-Karussell als zweite Karte (Lotus, zwischen Paaren und Satzbau – vom Schwierigkeitsgrad her zwischen Wort-Quiz und Satzbau). Motiv: in der Satzleiste klafft eine Lücke, die richtige Kachel springt hinein, die anderen treten zurück. Im gemischten Quiz (Etappe, Boss, Training, Gießrunde) kommt der Lückensatz bei schon gelernten Sätzen dazu (Gewicht 2).
    - Eindeutigkeit: Lücke nur bei echten Wörtern aus `sentence.words`, die im Satz einmal vorkommen; keine Anreden (die Übersetzung verliert, wen man anspricht) und keine Partikel. Ablenker: keine gleiche oder enthaltene Bedeutung, keine Bedeutung in der Übersetzung (auch gebeugt: „warten“ in „Ich warte“), nichts aus dem Satz, und keins aus dem **Wortfeld** der Lücke (`NEAR`, z. B. cần/phải/nên, thấy/xem/nhìn/trông, yêu/thương/thích, sợ/lo). Die Wortfelder sind nur ein Ausschluss, kein angezeigter Inhalt; die Verlobte kann weitere Fälle nennen.
    - Gefunden und behoben:
      - Satzleiste des Motivs war gelb (Grundregel des Satzbaus überschrieb die Farbe).
      - Bei falscher Antwort stand das richtige Wort rot in der Lücke – las sich wie „falsch“; jetzt immer grün.
      - Motiv zu klein mit leerem Band unten; vergrößert. Gemessen: die Kachel landet auf 0,5 px genau in der Lücke; breitester möglicher Satz 83 von 86 cqw, breiteste Kachelreihe 87,6 von 90 cqw.
      - Lücke wuchs beim Füllen am Satzanfang (Großschreibung breiter); die Schreibung im Satz zählt jetzt mit – Breite vorher und nachher gleich (gemessen).
      - Verfügbarkeit kostete beim ersten Öffnen des Trainings 95 ms (alle Sätze gelernt) und hätte den Tab-Wechsel ruckeln lassen; jetzt 23 ms (Prüfung ohne Mischen, Schreibungen vorab).
    - Bekannt, wie bei allen Auswahl-Aufgaben: Bei 375×667 deckt die Rückmeldungsleiste die untere Kachelreihe; die Lösung steht hier zusätzlich in der Lücke.
    - Geprüft in Edge bei 440×956 (Safe-Area 59) und 375×667, Tag und Nacht: Motiv Bild für Bild (0–5000 ms), Aufgabe, richtig, falsch; Echtzeit per CDP-Screencast (Motiv, Karte wächst in die Übung, Lücke füllt sich). Keine Konsolenfehler, kein seitliches Scrollen.
    - check grün, 261 Vitest grün (Lückensatz über alle 270 Sätze und mehrere Seeds; 8 von 8 Mutationen machen die Tests rot), Playwright 12/12 grün (neu: `tests/e2e/gap.spec.ts`, Gegenprobe mit leerer Lücke rot).
- **Nächste Schritte:** Alex Punkt 2 zeigen; live erst auf sein Wort. Danach Punkt 3 (Roller-Sprint, P6-04). Sonst offen: P1-06 (Prototyp im LAN, `pending-alex`).

## Phase 2 – Ergebnis

- Logik in `src/lib/logic/` (srs, path, session, rewards), Screens in `src/screens/` (Lernpfad, Etappe, Play mit Intro/Quiz/Hören/Rollen/Boss/Training, Training, Profil, Einstellungen mit Push-Status, Zeiten, Test-Push, Export/Import).
- Push: Worker `viet-trainer-push` (Cloudflare Free-Plan, KV `STATE`, Cron alle 5 min, VAPID/Token als Secrets), Client `src/lib/push.svelte.ts`, SW-Handler. Die Testkopie (`viet-trainer-v2`, Workers Static Assets) ist seit 2026-11-06 gelöscht.
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
- P1-06 (LAN-Dev-Server auf dem iPhone) nie separat bestätigt; die installierte Testkopie lief bis 2026-11-06 auf Alex' iPhone (Push, Audio, Vollbild) – der LAN-Weg selbst ist ungeprüft.
- Push-Token und VAPID-Keys existieren nur als wrangler-Secrets; für spätere Builds liegt das Token außerhalb des Repos in der Sitzungs-Scratchpad-Datei `push.env`. Geht es verloren: neues Token erzeugen, per `wrangler secret put PUSH_TOKEN` setzen, App neu bauen.
- npm audit: 11 Meldungen (low/moderate) in Build-Abhängigkeiten von vite-plugin-pwa/workbox-build, nicht in der ausgelieferten App.
- Push-Token steckt im ausgelieferten JS (Build-Env) – schützt nur gegen Zufallszugriffe.

## Ideen außerhalb des Umfangs

- (keine offen)
