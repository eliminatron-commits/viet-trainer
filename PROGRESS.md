# PROGRESS – Việt-Trainer v2

## Stand

- **Phase 1/4 – Fundament, Inhalte und Design-System:** technisch fertig (Typecheck, 18 Vitest-Tests, Build grün). **Wartet auf Alex:** Prototyp auf dem iPhone ansehen, Richtung freigeben, Maskottchen wählen (Gecko oder Wasserbüffel) → Wahl in `CLAUDE.md` eintragen, dann Commit „Phase 1: …“ abschließen.
- Nächste Phase: 2/4 – Kernlogik und Erinnerungen (Opus 5.5, hoch). Vorher Sitzung neu starten, damit die Subagenten geladen werden.

## Phase 1 – Ergebnis

- Branch `v2`; alte App in `legacy/`; `prepared/` eingecheckt.
- Inhalte: 538 Wörter, 270 Sätze, 10 Rollen, 9 Satzkontexte → `src/content/*.json`; 808 MP3s → `public/audio/`.
- Lernpfad: 5 Regionen, 33 Etappen (`scripts/migrate/curriculum.ts`); Etappe 1 „Ich & du“ und 7 „Familie & Anreden“ sind Pronomen-Etappen, 16 „Kleine Wörter, große Wirkung“ die Partikel-Etappe.
- Speicher: IndexedDB über idb-keyval, `persist()`, Export/Import, `normalizeSave`.
- Design: Tokens, Card/Button/PillNav/ProgressRing/GlowOrb, Illustration Marmorberge, Maskottchen-Entwürfe, Prototyp in `src/prototype/`.
- PWA-Gerüst: `src/sw.ts` (Precache inkl. Audio, löscht `viet-trainer-v*`), Manifest, „Neue Version“-Hinweis.

## Offene Punkte / Abweichungen

- Partikel-Etappe: `de` der Partikel ist noch der Text aus `prepared/words-ext.js` (teils Übersetzung, teils Erklärung) – bei Bedarf in Phase 3 mit dem Prüfmodus nachschärfen.
- Satz-Verteilung je Etappe ungleich (1–22), weil Sätze automatisch in die Etappe ihres letzten Wortes fallen. Für Sessions unkritisch (Wiederholungen mischen ein).
- App-Icon: vorerst die alten PNGs (`public/icons/`), neues Icon in Phase 4.
- Playwright noch nicht installiert (ab Phase 2).
- `HANDOFF.md` (alt, v10) liegt untracked im Repo – nicht von mir, nicht angefasst.

## Ideen außerhalb des Umfangs

- Lernpfad mit gezeichneter Route zwischen den Etappen-Knoten.
