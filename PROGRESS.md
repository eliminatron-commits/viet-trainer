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
- **Phase 5 – Kreativ-Runde (ab 2026-11-06, Opus 5.5 hoch).** Alex: „die anderen Bereiche sind eher langweilig … mehr Kreativität mit Animationen, schönem Design so wie im Lernpfad“, und im Profil gebe es zu wenig zu tun. Er hat diese Ideen gewählt, Akzeptanz siehe `tests.json` Phase 5:
  1. Lernpfad: Route (erledigt, P5-01).
  2. Session „Etappe als Reise“: Trâu läuft oben auf einer Route zum Ziel, die Szene der Region baut sich mit dem Fortschritt auf (P5-02).
  3. Session „Lebendige Wörter“: Buchstabe für Buchstabe, Tonzeichen fallen auf ihre Vokale, die Karte dreht sich (P5-03).
  4. Profil „Trâus Hof“: streicheln, füttern, einkleiden, nachts schlafen (P5-04).
  5. Profil „Reisepass“: Erfolge als Stempel, Souvenirs je Region (P5-05).
  6. Training „Reisfeld“: eine Reispflanze je gelernter Einheit (P5-06).
  7. Training „Modus-Karussell“ (P5-07).
  8. Sprachführer „Orte statt Kacheln“ (P5-08).
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
- **Nächste Schritte:** Alex das Reisfeld zeigen, danach Phase 5 Punkt 7 (Modus-Karussell im Training). Sonst offen: P1-06 (Prototyp im LAN, `pending-alex`).

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
