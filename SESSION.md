# Việt-Trainer — Projektstand (Handoff)

PWA zum Vietnamesisch-Lernen (Duolingo-Stil), iOS-Homescreen, vollständig offline.
Vanilla HTML/CSS/JS, kein Build. Deutsche UI. Stand: **v9** (Rot/Gold-Theme + ElevenLabs-Aussprache).

## Live & Deployment
- **Live:** https://eliminatron-commits.github.io/viet-trainer/
- **Repo:** `eliminatron-commits/viet-trainer` (GitHub Pages, Branch `main`, Root, `.nojekyll`)
- **gh CLI:** installiert unter `/c/Program Files/GitHub CLI` → im Bash-Tool `export PATH="/c/Program Files/GitHub CLI:$PATH"`. Angemeldet als `eliminatron-commits`.
- **git-Identität** ist lokal im Repo gesetzt (eliminatron-commits / noreply). Commit/Push funktioniert normal.

### Deploy-Ablauf (WICHTIG — GitHub Pages zickt)
1. Änderungen committen + `git push origin main`.
2. **Bei jeder Datei-Änderung `CACHE`-Variable in `sw.js` hochzählen** (aktuell `viet-trainer-v9`), sonst bekommen installierte iPhones das Update nicht (Service Worker cache-first).
3. GitHub Pages baut automatisch. Verifizieren: `curl -s .../sw.js | grep viet-trainer-v` und Stichprobe `curl -sI .../audio/wXXX.mp3`.
4. **Transienter Fehler „Deployment failed, try again later.":** rein serverseitig, nicht unser Code. Fix = **einen** frischen (ggf. leeren) Commit pushen und **geduldig einen** Build abwarten. NICHT mehrere Pushes schnell hintereinander (kollidieren → beide failen). `gh run rerun` MEIDEN — erzeugt hängende „queued"-Zombie-Runs, die die Pipeline blockieren.

## Audio-Generierung (ElevenLabs — aktuell)
- **Stimme:** **Thanh Ngọc** (Süd ♀), ElevenLabs-Voice-ID `Na15FlRRkMEDtEW4nVVP`. Von der muttersprachlichen
  Frau (Da Nang) im Audition-Vergleich gewählt.
- **Modell:** `eleven_v3` **mit `language_code:"vi"`** (Sprache ERZWINGEN — sonst rät ElevenLabs bei Einzelwörtern
  falsch, z. B. „em"→„ennng"). `eleven_multilingual_v2` NICHT nutzen (kann Sprache nicht erzwingen).
- **Atem-Trim:** v3 hängt ans Wortende einen kurzen Atemstoß nach ~0,4 s Lücke. `scripts/trim_breath.py`
  erkennt die Lücke (silencedetect −30 dB) und schneidet + Fade-out; mehrsilbige Wörter bleiben heil.
  Braucht portables ffmpeg → `pip install imageio-ffmpeg` (kein System-Install).
- **Script:** `scripts/generate_audio_eleven.py` (liest Wortliste per Regex aus `js/data.js`). Key aus ENV
  `ELEVEN_API_KEY` (nie in Datei). ⚠️ **Bezahlter ElevenLabs-Plan nötig** (Free-Tier sperrt Library-Stimmen per API).
- **Voller Lauf:** `ELEVEN_API_KEY=… python scripts/generate_audio_eleven.py --force`
  → danach `python scripts/trim_breath.py audio audio`.
- **Einzelkorrektur:** `… --only wXXX` → `python scripts/trim_breath.py audio audio` → `CACHE` in sw.js +1 → deploy.
- Alt/ungenutzt: `scripts/generate_audio.py` (edge-tts), `scripts/generate_compare.py` (Stimmen-Audition, FPT/Piper/gTTS).
- Namenskonvention: `audio/<id>.mp3`, 250 Dateien (w001–w250).

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
- **Visuelles Design „Sơn Mài" (Lackrot & Gold, an Vietnam orientiert):** tiefes Lackrot `#1c0707` + roter/goldener
  Aurora-Hintergrund, Glas-Karten mit Goldrändern, Gold als Primär-Akzent (Balken/Buttons/Tab/Level). Grün nur noch
  als „richtig"-Signal. `theme_color`/Manifest = #1c0707. Konfetti, Eintritts-Choreografie, `prefers-reduced-motion`.
  Icons: `icons/icon-{180,192,512}.png` (Platzhalter „VIỆT").

## Testen (Preview-MCP)
- launch.json-Config **`viet` Port 8150** (`preview_start`).
- **Vor jedem Test SW-Cache leeren**, sonst wird veraltetes JS serviert:
  `navigator.serviceWorker.getRegistrations()→unregister`, `caches.keys()→delete`, dann `location.reload()`.
- **`preview_screenshot` hängt in dieser Umgebung zuverlässig** (Tool-Bug) → stattdessen `preview_snapshot`, `preview_inspect`, `preview_eval` nutzen.

## Offene Punkte / nächste Schritte
- **Frau des Nutzers (Muttersprachlerin) prüft die 250 Wörter** in der fertigen App. Aussprache-Korrekturen laufen
  jetzt über ElevenLabs: `ELEVEN_API_KEY=… python scripts/generate_audio_eleven.py --only wXXX` →
  `python scripts/trim_breath.py audio audio` → `CACHE` in `sw.js` +1 → commit/push.
- **ElevenLabs-Abo** kann nach dem v9-Deploy gekündigt werden (MP3s liegen dauerhaft in der App).
- Aussprachehilfen (`pron`) sind nördliche Vereinfachungen; ein paar Homonym-Hilfen kollidieren (z.B. mắt/mặt/mất → „mat") — VN-Schrift ist korrekt, nur die Hilfe grob.
- `rất`/`lắm` waren beide „sehr" → `lắm` auf „total / ganz schön" geändert (Quiz-Ambiguität vermieden). Auf ähnliche Fälle bei Wortänderungen achten.

## Wichtige Entscheidungen (Historie)
- Ursprünglich 100 thematisch-kuratierte Wörter → auf **250 frequenzbasierte** umgestellt, weil Muttersprachlerin „làm ơn" etc. als unüblich markierte. Quelle: hermitdave/FrequencyWords vi (OpenSubtitles).
- XP-Nutzen: Level/Ränge + Tagesziel gewählt (statt nur eins von beiden).
- Kein Backend, kein Account, rein statisch, offline-first.
