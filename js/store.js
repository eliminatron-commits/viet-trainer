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

  var DAILY_GOAL = 50; // XP-Tagesziel (= 5 richtige Antworten); füttert die Streak

  function defaults() {
    return {
      version: 1,
      xp: 0,
      streak: { count: 0, lastDay: null },
      daily: { day: null, xp: 0, goalReached: false }, // Tages-XP für Ziel + Streak
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
    if (d.daily && typeof d.daily === "object") {
      if (typeof d.daily.day === "string") state.daily.day = d.daily.day;
      state.daily.xp = num(d.daily.xp);
      state.daily.goalReached = !!d.daily.goalReached;
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

  // Heutigen Tages-Fortschritt lesen, ohne den State zu verändern (die UI ruft
  // das beim Rendern; der eigentliche Reset auf 0 passiert erst in addXp).
  function dailyProgress() {
    var today = dayStr(new Date());
    if (state.daily.day !== today) return { xp: 0, goal: DAILY_GOAL, reached: false };
    return { xp: state.daily.xp, goal: DAILY_GOAL, reached: state.daily.goalReached };
  }

  // Zentrale XP-Vergabe: erhöht Gesamt- und Tages-XP, erkennt Level-up und
  // füttert beim Erreichen des Tagesziels die Streak (einmal pro Tag).
  // Rückgabe bündelt alles, was die UI für Feiern braucht.
  function addXp(amount) {
    var lvlBefore = VT.Level.levelFromXp(state.xp).level;
    state.xp += amount;
    var lvlAfter = VT.Level.levelFromXp(state.xp).level;

    var today = dayStr(new Date());
    if (state.daily.day !== today) state.daily = { day: today, xp: 0, goalReached: false };
    state.daily.xp += amount;

    var goalJustReached = false, streakInfo = null;
    if (!state.daily.goalReached && state.daily.xp >= DAILY_GOAL) {
      state.daily.goalReached = true;
      goalJustReached = true;
      streakInfo = touchStreak(); // Streak zählt genau dann, wenn das Tagesziel fällt
    }
    save();
    return {
      totalXp: state.xp,
      leveledUp: lvlAfter > lvlBefore, level: lvlAfter,
      dailyXp: state.daily.xp, dailyGoal: DAILY_GOAL,
      goalJustReached: goalJustReached, streak: streakInfo
    };
  }

  function reset() { state = defaults(); save(); }

  load();
  return {
    get: function () { return state; }, save: save, wordState: wordState,
    touchStreak: touchStreak, addXp: addXp, dailyProgress: dailyProgress,
    DAILY_GOAL: DAILY_GOAL, reset: reset, KEY: KEY
  };
})();
