# Việt-Trainer

Vietnamesisch lernen auf dem iPhone, wie eine native App: vom Homescreen, im Vollbild, komplett offline,
mit Erinnerungen am Morgen und am Abend. Deutschsprachige Oberfläche, Alltagssprache aus Đà Nẵng.

**Live:** https://eliminatron-commits.github.io/viet-trainer/

## Was drin ist

- **Lernpfad als Reise durch Vietnam:** 5 Regionen (Đà Nẵng → Hội An → Huế → Hà Nội → Sài Gòn), 33 Etappen,
  jede endet mit einem Bosskampf. 538 Wörter, 270 Sätze, Anrede-Rollen – alle mit Audio.
- **Wiederholung:** Leitner-System mit 5 Boxen (1/2/4/8/16 Tage), fällige Einheiten mischen sich in jede Runde.
- **Spielmodi:** Übersetzen in beide Richtungen, Hören, Anreden, Paare gegen die Uhr, Satzbau, Hör-Diktat,
  Ton-Ninja; freies Training mit Moduswahl.
- **Belohnungen:** XP, Level, Tagesziel und Serie (mit Streak-Schutz), Truhen nach Bosskämpfen, 22 Erfolge,
  3 Wochen-Challenges und der Wasserbüffel Trâu, der mit dem Level wächst und Accessoires trägt.
- **Sprachführer** nach Situationen, durchsuchbar (auch ohne Akzente), mit Favoriten.
- **Prüfmodus** für die Muttersprachlerin: ungeprüfte Inhalte anhören, „passt“ oder „unnatürlich“ mit Notiz,
  Ergebnis als JSON exportieren.
- **Tag und Nacht:** automatisch nach Uhrzeit (Nacht 20–9 Uhr) oder fest einstellbar, alle Szenen auch nachts.
- **Fortschritt** liegt nur auf dem Gerät (IndexedDB), jede Aktion wird sofort gespeichert; Export/Import als JSON.

## Auf dem iPhone installieren

1. Die Live-URL in **Safari** öffnen.
2. **Teilen** → **Zum Home-Bildschirm**.
3. Die App vom Homescreen starten. Beim ersten Start lädt sie alle Inhalte samt Audios (~9 MB) einmalig;
   danach läuft sie auch im Flugmodus.
4. Für Erinnerungen: in der App unter **Profil → Einstellungen** Mitteilungen erlauben (nur aus der
   installierten App möglich, iOS 16.4+).

Wer noch die alte Version (v13) installiert hat, bekommt v2 beim nächsten Öffnen automatisch. Das neue Icon
übernimmt iOS erst, wenn man die App einmal neu zum Home-Bildschirm hinzufügt.

## Entwicklung

Svelte 5 + Vite + TypeScript, PWA mit eigenem Service Worker, Push über einen Cloudflare Worker (`worker/`).
Befehle, Konventionen und Designregeln stehen in [`CLAUDE.md`](CLAUDE.md), der Projektstand in
[`PROGRESS.md`](PROGRESS.md) und [`SESSION.md`](SESSION.md).

```bash
npm install
npm run dev      # Entwicklungsserver, im LAN erreichbar
npm run check    # Typecheck
npm test         # Vitest
npx playwright test   # E2E (WebKit, iPhone-Viewport)
```

**Deploy:** Jeder Push auf `main` baut und veröffentlicht die App über GitHub Actions
(`.github/workflows/pages.yml`).

Die alte Vanilla-JS-App (v13) liegt nur noch als Quelle in `legacy/`.
