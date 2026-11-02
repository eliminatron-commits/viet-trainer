var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.ReviewQuiz – ENDLOSER Wiederholungsmodus über ALLE gelernten Wörter
 * (seen>0), ohne Paketwahl. Optionaler Filter „nur Verben".
 *
 * Spiegelt VT.Quiz (gleiche Aufgaben-Form {mode,item,options,…}), aber:
 *   - Pool = alle bereits gesehenen Wörter (paketübergreifend), box-gewichtet
 *     (schwache Wörter häufiger). Distraktoren aus dem Pool, bei Bedarf aus dem
 *     Gesamtwortschatz aufgefüllt.
 *   - endlos: isDone() ist immer false; beendet wird nur über „Abbrechen" (✕).
 *   - Antworten aktualisieren die ECHTE Wort-Leitner-Box (VT.SRS.answer) →
 *     Wiederholung verbessert den normalen Lernstand + Statistik.
 * Kein DOM, kein Audio-Aufruf.
 * ============================================================================= */
VT.ReviewQuiz = (function () {
  var XP_PER_CORRECT = 10;
  var MODES = ["de2vn", "vn2de", "listen"];
  var TRIM_AT = 40; // Aufgaben-Array beschneiden, damit es endlos nicht wächst

  var session = null;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function sample(arr, k) { return shuffle(arr.slice()).slice(0, k); }

  // Alle gelernten Wörter (seen>0); optional nur Verben (VT.DATA.isVerb).
  function learnedPool(verbsOnly) {
    var words = VT.Store.get().words;
    return VT.DATA.words.filter(function (w) {
      var st = words[w.id];
      if (!st || st.seen <= 0) return false;
      if (verbsOnly && !VT.DATA.isVerb(w.id)) return false;
      return true;
    });
  }

  // 4 Optionen: Zielwort + 3 Distraktoren, bevorzugt aus dem gelernten Pool,
  // sonst aus dem Gesamtwortschatz aufgefüllt (falls erst wenige gelernt).
  function buildOptions(word, pool) {
    var others = pool.filter(function (w) { return w.id !== word.id; });
    if (others.length < 3) {
      var extra = VT.DATA.words.filter(function (w) {
        return w.id !== word.id && others.indexOf(w) === -1;
      });
      others = others.concat(extra);
    }
    var opts = sample(others, 3);
    opts.push(word);
    return shuffle(opts);
  }

  // Box-gewichtete Auswahl eines Wortes; das zuletzt gezeigte wird vermieden.
  function pickWord(pool, last) {
    var store = VT.Store.get();
    var weighted = pool.map(function (w) {
      var st = store.words[w.id];
      return { item: w, weight: VT.SRS.BOX_WEIGHT[st ? st.box : 0] };
    });
    var cand = weighted.filter(function (e) { return e.item !== last; });
    if (cand.length === 0) cand = weighted;
    return VT.SRS.weightedPick(cand).item;
  }

  function makeTask(last) {
    var word = pickWord(session.pool, last);
    var mode = MODES[session.modeIndex++ % MODES.length];
    return { mode: mode, item: word, options: buildOptions(word, session.pool),
             answered: false, correct: null, chosenId: null };
  }

  function buildSession(opts) {
    opts = opts || {};
    var verbsOnly = !!opts.verbsOnly;
    session = { kind: "review", verbsOnly: verbsOnly, pool: learnedPool(verbsOnly),
                tasks: [], index: 0, answered: 0, correctCount: 0, modeIndex: 0,
                levelUpTo: null, streakInfo: null };
    if (session.pool.length > 0) session.tasks.push(makeTask(null));
    return session;
  }

  function current() { return session && session.tasks[session.index] || null; }

  function answer(optionWordId) {
    var task = current();
    if (!task || task.answered) return null;
    var correct = optionWordId === task.item.id;
    task.answered = true;
    task.correct = correct;
    task.chosenId = optionWordId;
    VT.SRS.answer(task.item.id, correct); // echte Wort-Box + Statistik + save
    session.answered++;
    if (correct) {
      session.correctCount++;
      var res = VT.Store.addXp(XP_PER_CORRECT);
      if (res.leveledUp) session.levelUpTo = res.level;
      if (res.goalJustReached && res.streak) session.streakInfo = res.streak;
    }
    return correct;
  }

  function next() {
    if (!session) return null;
    var last = current() ? current().item : null;
    session.tasks.push(makeTask(last));
    session.index++;
    if (session.index > TRIM_AT) { // altes abschneiden, Speicher begrenzen
      session.tasks = session.tasks.slice(session.index);
      session.index = 0;
    }
    return current();
  }

  function isDone() { return false; } // endlos – Ende nur über Abbrechen

  function finish() {
    if (!session) return null;
    return { kind: "review", verbsOnly: session.verbsOnly,
             total: session.answered, correct: session.correctCount,
             xpEarned: session.correctCount * XP_PER_CORRECT,
             streak: session.streakInfo, levelUpTo: session.levelUpTo };
  }

  function learnedCount(verbsOnly) { return learnedPool(verbsOnly).length; }

  return {
    XP_PER_CORRECT: XP_PER_CORRECT, MODES: MODES,
    buildSession: buildSession, current: current, answer: answer, next: next,
    isDone: isDone, finish: finish, getSession: function () { return session; },
    learnedCount: learnedCount
  };
})();
