# Việt-Trainer — Projektstand (Handoff)

PWA zum Vietnamesisch-Lernen (Duolingo-Stil), iOS-Homescreen, vollständig offline.
Vanilla HTML/CSS/JS, kein Build. Deutsche UI. Stand: **v7 live**.

## Live & Deployment
- **Live:** https://eliminatron-commits.github.io/viet-trainer/
- **Repo:** `eliminatron-commits/viet-trainer` (GitHub Pages, Branch `main`, Root, `.nojekyll`)
- **gh CLI:** installiert unter `/c/Program Files/GitHub CLI` → im Bash-Tool `export PATH="/c/Program Files/GitHub CLI:$PATH"`. Angemeldet als `eliminatron-commits`.
- **git-Identität** ist lokal im Repo gesetzt (eliminatron-commits / noreply). Commit/Push funktioniert normal.

### Deploy-Ablauf (WICHTIG — GitHub Pages zickt)
1. Änderungen committen + `git push origin main`.
2. **Bei jeder Datei-Änderung `CACHE`-Variable in `sw.js` hochzählen** (aktuell `viet-trainer-v7`), sonst bekommen installierte iPhones das Update nicht (Service Worker cache-first).
3. GitHub Pages baut automatisch. Verifizieren: `curl -s .../sw.js | grep viet-trainer-v` und Stichprobe `curl -sI .../audio/wXXX.mp3`.
4. **Transienter Fehler „Deployment failed, try again later.":** rein serverseitig, nicht unser Code. Fix = **einen** frischen (ggf. leeren) Commit pushen und **geduldig einen** Build abwarten. NICHT mehrere Pushes schnell hintereinander (kollidieren → beide failen). `gh run rerun` MEIDEN — erzeugt hängende „queued"-Zombie-Runs, die die Pipeline blockieren.

## Audio-Generierung
- **Stimme:** `vi-VN-NamMinhNeural` (männlich, nördlich). Vom Nutzer nach A/B-Vergleich gewählt (gegen HoaiMy und Google-Süd-gTTS). Süd/Da-Nang-Aussprache (`gi`→„j") gibt es in keiner TTS; NamMinh gefiel im Klang am besten.
- **Script:** `scripts/generate_audio.py` (liest Wortliste per Regex aus `js/data.js` → keine doppelte Datenhaltung). Python: `/c/Users/alexr/AppData/Local/Programs/Python/Python312` (edge-tts + gTTS installiert).
- Aufrufe: `python scripts/generate_audio.py --force` (alle neu), `--only w001,w042` (einzelne), `--voice X`.
- Namenskonvention: `audio/<id>.mp3`. Aktuell 250 Dateien (w001–w250).

## Architektur (Module in Ladereihenfolge, `index.html`)
`data.js → level.js → store.js → srs.js → audio.js → quiz.js → ui.js → app.js`
Jede Datei `var VT = window.VT || {}` (nie `const` — klassische Skripte teilen globalen Scope).
- **data.js** — Wortschatz (250 Wörter, 25 Pakete) + `wordById`/`wordsOfPack`. Reine Daten.
- **level.js** — `VT.Level.levelFromXp(xp)` → Rang/Level/Fortschritt. 10 Rang-Titel (🌱 Neuling → 👑 Sprachkönig), Schwellen `[0,100,250,450,700,1000,1350,1750,2200,2700]` dann +600.
- **store.js** — EINZIGES Modul mit localStorage (`vietTrainer.v1`). Felder: `xp, streak{count,lastDay}, daily{day,xp,goalReached}, unlockedPacks, words{id:{box,seen,right,wrong,last}}`. Zentrale `addXp(amount)` (Level-up + Tagesziel + Streak), `dailyProgress()`, `touchStreak()`, `reset()`. DAILY_GOAL=50.
- **srs.js** — Leitner (5 Boxen 0–4). Richtig +1, falsch −1. Gewichtete Auswahl `BOX_WEIGHT=[8,5,3,2,1]`. Mastery = Box≥2 (`MASTERY_BOX`), Freischaltung nächstes Paket ab 8/10 (`MASTERY_COUNT`). `masteryLabel(box)`.
- **audio.js** — MP3 zuerst, Web-Speech-Fallback (vi-VN) bei Fehlen. `unlock()` für iOS (erster Touch). Guard gegen Doppel-Fallback.
- **quiz.js** — Session (10 Aufgaben), 3 Modi `de2vn|vn2de|listen`, 4 Optionen. `finish()` liefert `{correct,total,xpEarned,newlyUnlockedPack,streak,levelUpTo}`.
- **ui.js** — EINZIGES Modul mit DOM. Screens `home|stats|session|result`, Tab-Bar (Lernen/Statistik), Level-Karte, Tagesziel, Abbrechen-Dialog, Konfetti, Toast, geschützter Reset.
- **app.js** — Bootstrap (SW-Registrierung nur über http(s), iOS-Audio-Unlock).

## Features (alle live)
- **250 Wörter, 25 Pakete à 10, ~90 Verben.** Frequenzbasiert (OpenSubtitles-Korpus), Grammatikpartikel bewusst raus. Gestaffelte Freischaltung.
- **3 Quiz-Modi** + Leitner-SRS + Paket-Progression.
- **Auto-Aussprache** bei `vn2de` und `listen` beim Aufgaben-Erscheinen; NICHT bei `de2vn` (würde Lösung verraten).
- **Gamification:** XP→Level/Ränge (Level-up-Feier), Tagesziel 50 XP füttert Streak, Fortschrittsbalken.
- **Abbrechen-Button** (✕) in Session mit Bestätigungsdialog.
- **Geschützter Reset** (⚙️ unten auf Home, 3 s halten).
- **Visuelles Design „Jade-Nacht":** Aurora-Hintergrund, Glas-Karten, Gold-Akzente, Konfetti, Eintritts-Choreografie, `prefers-reduced-motion`. Icons: `icons/icon-{180,192,512}.png` (Platzhalter „VIỆT", könnten später ersetzt werden).

## Testen (Preview-MCP)
- launch.json-Config **`viet` Port 8150** (`preview_start`).
- **Vor jedem Test SW-Cache leeren**, sonst wird veraltetes JS serviert:
  `navigator.serviceWorker.getRegistrations()→unregister`, `caches.keys()→delete`, dann `location.reload()`.
- **`preview_screenshot` hängt in dieser Umgebung zuverlässig** (Tool-Bug) → stattdessen `preview_snapshot`, `preview_inspect`, `preview_eval` nutzen.

## Offene Punkte / nächste Schritte
- **Frau des Nutzers (Muttersprachlerin) prüft die 250 Wörter** in der fertigen App. Korrekturen: Eintrag in `data.js` ändern → `python scripts/generate_audio.py --only wXXX` → `CACHE` in `sw.js` +1 → commit/push. Besonders prüfen: `dạ`/`ừ` (natürliches „ja"), Verben-Aufteilung, Zahlen-/Körper-Paket.
- Aussprachehilfen (`pron`) sind nördliche Vereinfachungen; ein paar Homonym-Hilfen kollidieren (z.B. mắt/mặt/mất → „mat") — VN-Schrift ist korrekt, nur die Hilfe grob.
- `rất`/`lắm` waren beide „sehr" → `lắm` auf „total / ganz schön" geändert (Quiz-Ambiguität vermieden). Auf ähnliche Fälle bei Wortänderungen achten.

## Wichtige Entscheidungen (Historie)
- Ursprünglich 100 thematisch-kuratierte Wörter → auf **250 frequenzbasierte** umgestellt, weil Muttersprachlerin „làm ơn" etc. als unüblich markierte. Quelle: hermitdave/FrequencyWords vi (OpenSubtitles).
- XP-Nutzen: Level/Ränge + Tagesziel gewählt (statt nur eins von beiden).
- Kein Backend, kein Account, rein statisch, offline-first.
