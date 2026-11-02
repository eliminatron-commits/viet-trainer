var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.SentenceQuiz – Satz-Quiz-Engine (Reiter „Sätze"). Spiegelt VT.Quiz, aber
 * über VT.SENTENCES + VT.Store.sentenceState. Kein DOM, kein Audio-Aufruf.
 *
 * Aufgaben-Form (wie VT.Quiz, damit die UI beide gleich rendert):
 *   { mode: "de2vn"|"vn2de"|"listen", item: <Satz {id,vn,de}>, options:[Satz x4],
 *     answered, correct, chosenId }
 *   - "listen" zeigt bei Sätzen als Optionen die DEUTSCHE Bedeutung (hören → Sinn wählen).
 *
 * Verfügbarkeit: ein Satz ist wählbar, sobald ALLE seine `words` (Vokabel-IDs)
 * mindestens einmal gesehen wurden (seen>0). Füll-/Verbindungswörter, die nicht
 * im Wortschatz stehen, gehören nicht in `words` und blockieren daher nie.
 * ============================================================================= */
VT.SentenceQuiz = (function () {
  var SESSION_SIZE = 10;
  var XP_PER_CORRECT = 10;
  var MODES = ["de2vn", "vn2de", "listen"];

  var session = null;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function sample(arr, k) { return shuffle(arr.slice()).slice(0, k); }

  // Sind alle Vokabeln eines Satzes schon gesehen? (Freigabe-Kriterium)
  function isAvailable(sentence) {
    var words = VT.Store.get().words;
    for (var i = 0; i < sentence.words.length; i++) {
      var st = words[sentence.words[i]];
      if (!st || st.seen <= 0) return false;
    }
    return true;
  }

  // Alle aktuell verfügbaren Sätze, leichteste zuerst (kleinster Max-Wort-Paket).
  function available() {
    return VT.SENTENCES.sentences.filter(isAvailable).sort(function (a, b) {
      return maxPack(a) - maxPack(b);
    });
  }
  function maxPack(sentence) {
    var mx = 0;
    sentence.words.forEach(function (id) {
      var w = VT.DATA.wordById(id);
      if (w && w.pack > mx) mx = w.pack;
    });
    return mx;
  }

  // 4 Optionen: Zielsatz + 3 Distraktoren aus dem verfügbaren Pool.
  function buildOptions(sentence, pool) {
    var others = pool.filter(function (s) { return s.id !== sentence.id; });
    var opts = sample(others, 3);
    opts.push(sentence);
    return shuffle(opts);
  }

  function makeTask(mode, sentence, pool) {
    return {
      mode: mode, item: sentence, options: buildOptions(sentence, pool),
      answered: false, correct: null, chosenId: null
    };
  }

  // Box-gewichtete Auswahl aus dem verfügbaren Pool (neue/schwache Sätze häufiger),
  // analog VT.SRS.pickWords: kein direktes Wiederholen, Obergrenze je Satz.
  function pickSentences(pool, n) {
    if (pool.length === 0) return [];
    var store = VT.Store.get();
    var weighted = pool.map(function (s) {
      var st = store.sentences[s.id];
      return { item: s, weight: VT.SRS.BOX_WEIGHT[st ? st.box : 0] };
    });
    var picks = [], counts = {}, last = null;
    var maxPer = Math.max(2, Math.ceil(n / pool.length) + 1);
    for (var i = 0; i < n; i++) {
      var p = weighted.filter(function (e) {
        return e.item !== last && (counts[e.item.id] || 0) < maxPer;
      });
      if (p.length === 0) p = weighted.filter(function (e) { return e.item !== last; });
      if (p.length === 0) p = weighted;
      var chosen = VT.SRS.weightedPick(p).item;
      picks.push(chosen);
      counts[chosen.id] = (counts[chosen.id] || 0) + 1;
      last = chosen;
    }
    return picks;
  }

  function buildSession() {
    var pool = available();
    var picks = pickSentences(pool, SESSION_SIZE);
    var tasks = picks.map(function (s, i) { return makeTask(MODES[i % MODES.length], s, pool); });
    shuffle(tasks);
    session = { kind: "sentence", tasks: tasks, index: 0, correctCount: 0,
                levelUpTo: null, streakInfo: null };
    return session;
  }

  function current() { return session && session.tasks[session.index] || null; }

  function answer(optionId) {
    var task = current();
    if (!task || task.answered) return null;
    var correct = optionId === task.item.id;
    task.answered = true;
    task.correct = correct;
    task.chosenId = optionId;
    VT.SRS.moveBox(VT.Store.sentenceState(task.item.id), correct); // Box +/-1, Statistik
    VT.Store.save();
    if (correct) {
      session.correctCount++;
      var res = VT.Store.addXp(XP_PER_CORRECT); // geteilte XP/Level/Streak-Logik
      if (res.leveledUp) session.levelUpTo = res.level;
      if (res.goalJustReached && res.streak) session.streakInfo = res.streak;
    }
    return correct;
  }

  function next() { if (session) session.index++; return current(); }
  function isDone() { return !session || session.index >= session.tasks.length; }

  function finish() {
    if (!session) return null;
    return {
      kind: "sentence",
      total: session.tasks.length,
      correct: session.correctCount,
      xpEarned: session.correctCount * XP_PER_CORRECT,
      streak: session.streakInfo,
      levelUpTo: session.levelUpTo
    };
  }

  // Anzahl gemeisterter Sätze (Box >= MASTERY_BOX) – für die Home-Anzeige.
  function masteredCount() {
    var s = VT.Store.get().sentences, n = 0;
    for (var id in s) { if (s[id].box >= VT.SRS.MASTERY_BOX) n++; }
    return n;
  }

  return {
    SESSION_SIZE: SESSION_SIZE, XP_PER_CORRECT: XP_PER_CORRECT, MODES: MODES,
    available: available, buildSession: buildSession, current: current,
    answer: answer, next: next, isDone: isDone, finish: finish,
    getSession: function () { return session; }, masteredCount: masteredCount
  };
})();
