var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.Store – Persistenz (localStorage). Einziges Modul, das localStorage anfasst.
 *
 * Fortschritts-Datenmodell (Schlüssel "vietTrainer.v1"):
 *   {
 *     version: 1,
 *     xp: 0,                                  // Gesamt-XP
 *     streak: { count: 0, lastDay: null },    // lastDay = "YYYY-MM-DD" (lokales Datum);
 *                                             // Kalendertag-Logik: touchStreak() unten
 *     unlockedPacks: 1,                       // höchste freigeschaltete Paket-Id (1..10)
 *     words: {                                // Leitner-Stand je Wort, nur berührte Wörter
 *       "w001": { box: 0, seen: 0, right: 0, wrong: 0, last: 0 }  // last = Timestamp (ms)
 *     }
 *   }
 *
 * Designentscheidungen:
 *   - Feldweises Laden mit Defaults (wie andere Projekte hier): ein altes oder
 *     beschädigtes Savegame crasht nie, fehlende Felder werden ergänzt.
 *   - Kompakt halten (iOS kann Website-Daten bei Inaktivität räumen; akzeptiertes
 *     Restrisiko lt. Anforderungen) – deshalb nur berührte Wörter im Objekt.
 *   - version für spätere Migrationen reserviert.
 * ============================================================================= */
VT.Store = (function () {
  var KEY = "vietTrainer.v1";
  var state = null;

  function defaults() {
    return {
      version: 1,
      xp: 0,
      streak: { count: 0, lastDay: null },
      unlockedPacks: 1,
      words: {}
    };
  }

  function load() {
    state = defaults();
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* Private Mode o.ä. -> nur In-Memory */ }
    if (!raw) return;
    var d;
    try { d = JSON.parse(raw); } catch (e) { return; }
    if (!d || typeof d !== "object") return;
    if (typeof d.xp === "number" && d.xp >= 0) state.xp = d.xp;
    if (typeof d.unlockedPacks === "number") state.unlockedPacks = Math.min(Math.max(d.unlockedPacks, 1), VT.DATA.packs.length);
    if (d.streak && typeof d.streak === "object") {
      if (typeof d.streak.count === "number" && d.streak.count >= 0) state.streak.count = d.streak.count;
      if (typeof d.streak.lastDay === "string") state.streak.lastDay = d.streak.lastDay;
    }
    if (d.words && typeof d.words === "object") {
      for (var id in d.words) {
        var w = d.words[id];
        if (!w || typeof w !== "object") continue;
        state.words[id] = {
          box: clampBox(w.box),
          seen: num(w.seen), right: num(w.right), wrong: num(w.wrong),
          last: num(w.last)
        };
      }
    }
  }

  function clampBox(b) {
    b = typeof b === "number" ? Math.round(b) : 0;
    return Math.min(Math.max(b, 0), 4); // 5 Leitner-Boxen: 0..4 (siehe VT.SRS)
  }
  function num(v) { return typeof v === "number" && v >= 0 ? v : 0; }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* voll/gesperrt -> still */ }
  }

  // Lernstand eines Worts holen, bei Erstkontakt anlegen (Box 0 = neu).
  function wordState(id) {
    if (!state.words[id]) state.words[id] = { box: 0, seen: 0, right: 0, wrong: 0, last: 0 };
    return state.words[id];
  }

  // "YYYY-MM-DD" im lokalen Zeitzonen-Kalender (kein UTC-Shift, sonst zählt
  // die Streak um Mitternacht herum am falschen Tag).
  function dayStr(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  // Bei abgeschlossener Lern-Session aufrufen: erhöht die Streak einmal pro
  // Kalendertag. Gleicher Tag -> keine Änderung. Genau der Vortag -> +1.
  // Größere Lücke (oder erster Start) -> Streak beginnt neu bei 1.
  function touchStreak() {
    var today = dayStr(new Date());
    var st = state.streak;
    if (st.lastDay === today) return { count: st.count, grew: false };

    var yesterday = dayStr(new Date(Date.now() - 24 * 60 * 60 * 1000));
    st.count = (st.lastDay === yesterday) ? st.count + 1 : 1;
    st.lastDay = today;
    save();
    return { count: st.count, grew: true };
  }

  function reset() { state = defaults(); save(); }

  load();
  return {
    get: function () { return state; }, save: save, wordState: wordState,
    touchStreak: touchStreak, reset: reset, KEY: KEY
  };
})();
