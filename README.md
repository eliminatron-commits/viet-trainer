# Việt-Trainer

PWA zum Lernen der 100 häufigsten vietnamesischen Wörter im Duolingo-Stil.
Vanilla HTML/CSS/JS, kein Build-Schritt, kein Backend – läuft komplett offline
vom iPhone-Homescreen.

## Auf dem iPhone installieren

1. Diesen Ordner (`viet-trainer/`) auf einen beliebigen statischen Webserver
   legen (siehe unten) und die URL in **Safari** auf dem iPhone öffnen.
   *Wichtig:* Für den Service Worker und die Installation muss die Seite über
   **https://** oder ein lokales Netzwerk (`http://<Rechner-IP>:<Port>`)
   erreichbar sein – ein direktes `file://`-Öffnen auf dem iPhone reicht für
   die Installation **nicht**, da Safari Service Worker unter `file://` nicht
   registriert.
2. In Safari auf **Teilen** (Quadrat mit Pfeil) tippen → **Zum Home-Bildschirm**.
3. App-Icon auf dem Homescreen öffnen. Sie startet im Standalone-Modus (ohne
   Safari-Adressleiste).
4. Beim ersten Öffnen lädt die App alle Assets inkl. der 100 Audio-Dateien
   einmalig herunter (Service-Worker-Precache). Danach funktioniert sie
   **vollständig offline**, auch im Flugmodus.

Zum lokalen Testen am PC/Mac genügt jeder einfache Static-File-Server im
`viet-trainer/`-Ordner, z. B.:

```bash
# Python (falls vorhanden)
python -m http.server 8150

# oder Node
npx serve -l 8150
```

Dann `http://<Rechner-IP>:8150` auf dem iPhone im selben WLAN öffnen.

> In diesem Repository liegt zusätzlich `.claude/launch.json` mit einer
> PowerShell-basierten Server-Konfiguration (`viet`, Port 8150) für die
> Entwicklung ohne Node/Python – siehe das Haupt-`CLAUDE.md`.

## Audio neu generieren

Die 100 MP3s in `audio/` wurden mit [edge-tts](https://github.com/rany2/edge-tts)
und der vietnamesischen Neural-Stimme `vi-VN-HoaiMyNeural` erzeugt.

```bash
pip install edge-tts
python scripts/generate_audio.py            # nur fehlende Dateien erzeugen
python scripts/generate_audio.py --force    # alle 100 neu erzeugen
python scripts/generate_audio.py --only w001,w042   # gezielt einzelne Wörter
python scripts/generate_audio.py --voice vi-VN-NamMinhNeural  # andere Stimme
```

Das Script liest die Wortliste direkt aus [`js/data.js`](js/data.js) (per
Regex auf `id`/`vn`-Felder) – es gibt keine zweite, separat zu pflegende
Wortliste. Wer den Wortschatz ändert oder erweitert, muss danach nur das
Script erneut laufen lassen.

**Nach jeder Audio-Änderung:** die `CACHE`-Version in [`sw.js`](sw.js) um
eins erhöhen (z. B. `viet-trainer-v2` → `v3`), sonst liefert der
Service-Worker-Cache auf bereits installierten Geräten weiter die alten
Dateien aus.

## Projektstruktur

```
viet-trainer/
├── index.html              App-Shell, iOS-Metatags, Skript-Ladereihenfolge
├── manifest.webmanifest     Web App Manifest (Android/Chrome; iOS nutzt
│                            zusätzlich die apple-touch-icon-Metatags)
├── sw.js                    Service Worker: Precache + Cache-First-Fetch
├── icons/                   Homescreen-Icons (180/192/512 px)
├── css/style.css            Mobile-first Styling, Animationen
├── audio/                   100 generierte MP3s (w001.mp3 … w100.mp3)
├── scripts/generate_audio.py  edge-tts-Generierungsscript
└── js/
    ├── data.js              Wortschatz + Pakete (Daten, keine Logik)
    ├── store.js              localStorage-Persistenz, Streak-Tageslogik
    ├── srs.js                Leitner-SRS (5 Boxen, gewichtete Auswahl,
    │                         Paket-Freischaltung)
    ├── audio.js              Audio-Wiedergabe (MP3 + Web-Speech-Fallback)
    ├── quiz.js                Quiz-Engine (Sessions, 3 Modi, Auswertung)
    ├── ui.js                  Screens & DOM-Rendering (Home/Session/Ergebnis)
    └── app.js                 Bootstrap (SW-Registrierung, iOS-Audio-Unlock)
```

Modulgrenzen: nur `store.js` fasst `localStorage` an, nur `ui.js` das DOM;
`srs.js`/`quiz.js` sind reine Logik ohne Seiteneffekte auf UI oder Storage
außerhalb von `VT.Store`.

## Bekannte Grenzen (bewusste Nicht-Ziele)

- Kein Account, keine Cloud-Synchronisation – Fortschritt lebt ausschließlich
  in `localStorage` dieses einen Browsers/Geräts.
- Löschen der Safari-Website-Daten löscht den Fortschritt unwiderruflich.
- iOS kann `localStorage` bei sehr langer Nichtnutzung räumen (kein
  Export/Import vorgesehen, siehe Anforderungen).
