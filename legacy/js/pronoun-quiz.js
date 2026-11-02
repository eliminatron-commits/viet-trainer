var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.PronounQuiz – Engine für den Übungsblock „Anreden & Pronomen".
 * Spiegelt VT.Quiz/VT.SentenceQuiz (gleiche Aufgaben-Form, damit die UI sie teilt).
 * Kein DOM, kein Audio-Aufruf.
 *
 * Lernbare Einheiten: je Rolle eine „self"-Aufgabe (wie nenne ich mich?) und – wenn
 * die Rolle ein Anrede-Pronomen hat – eine „addr"-Aufgabe (wie rede ich an?).
 * Key im Store = "<rolleId>:self" bzw. "<rolleId>:addr".
 *
 * Aufgaben-Form:
 *   { mode:"self"|"addr", role, item:<Wort {id,vn,de}>, options:[Wort x4],
 *     answered, correct, chosenId }
 *   - item = das KORREKTE Pronomen-Wort (aus VT.DATA), liefert Gloss + Audio.
 *   - Optionen tragen die vietnamesischen Pronomen (Auswahl per de2vn-Logik).
 * ============================================================================= */
VT.PronounQuiz = (function () {
  var SESSION_SIZE = 10;
  var XP_PER_CORRECT = 10;
  var MASTERY_BOX = 2; // wie VT.SRS.MASTERY_BOX (Box>=2 = sicher)

  var session = null;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function sample(arr, k) { return shuffle(arr.slice()).slice(0, k); }

  function word(id) { return VT.DATA.wordById(id); }
  function keyOf(role, mode) { return role.id + ":" + mode; }

  // Alle lernbaren Einheiten (role, mode). "addr" nur, wenn die Rolle eins hat.
  function units() {
    var out = [];
    VT.PRONOUNS.roles.forEach(function (r) {
      out.push({ role: r, mode: "self" });
      if (r.addr) out.push({ role: r, mode: "addr" });
    });
    return out;
  }

  // Distraktor-Pool je Modus: die Menge aller vorkommenden Pronomen dieses Typs.
  function pool(mode) {
    var ids = {};
    VT.PRONOUNS.roles.forEach(function (r) {
      var id = mode === "self" ? r.self : r.addr;
      if (id) ids[id] = true;
    });
    return Object.keys(ids).map(word);
  }

  // 4 Optionen: korrektes Pronomen + 3 Distraktoren aus dem passenden Pool.
  function buildOptions(correct, mode) {
    var others = pool(mode).filter(function (w) { return w.id !== correct.id; });
    var opts = sample(others, 3);
    opts.push(correct);
    return shuffle(opts);
  }

  function makeTask(unit) {
    var id = unit.mode === "self" ? unit.role.self : unit.role.addr;
    var correct = word(id);
    return {
      mode: unit.mode, role: unit.role, item: correct,
      options: buildOptions(correct, unit.mode),
      answered: false, correct: null, chosenId: null
    };
  }

  // Box-gewichtete Auswahl (neue/schwache Anreden häufiger), analog SentenceQuiz.
  function pickUnits(all, n) {
    if (all.length === 0) return [];
    var store = VT.Store.get();
    var weighted = all.map(function (u) {
      var st = store.pronouns[keyOf(u.role, u.mode)];
      return { item: u, weight: VT.SRS.BOX_WEIGHT[st ? st.box : 0] };
    });
    var picks = [], counts = {}, last = null;
    var maxPer = Math.max(1, Math.ceil(n / all.length));
    for (var i = 0; i < n; i++) {
      var cand = weighted.filter(function (e) {
        var k = keyOf(e.item.role, e.item.mode);
        return e.item !== last && (counts[k] || 0) < maxPer;
      });
      if (cand.length === 0) cand = weighted.filter(function (e) { return e.item !== last; });
      if (cand.length === 0) cand = weighted;
      var chosen = VT.SRS.weightedPick(cand).item;
      var ck = keyOf(chosen.role, chosen.mode);
      picks.push(chosen);
      counts[ck] = (counts[ck] || 0) + 1;
      last = chosen;
    }
    return picks;
  }

  function buildSession() {
    var picks = pickUnits(units(), SESSION_SIZE);
    var tasks = picks.map(makeTask);
    session = { kind: "pronoun", tasks: tasks, index: 0, correctCount: 0,
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
    VT.SRS.moveBox(VT.Store.pronounState(keyOf(task.role, task.mode)), correct);
    VT.Store.save();
    if (correct) {
      session.correctCount++;
      var res = VT.Store.addXp(XP_PER_CORRECT);
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
      kind: "pronoun",
      total: session.tasks.length,
      correct: session.correctCount,
      xpEarned: session.correctCount * XP_PER_CORRECT,
      streak: session.streakInfo,
      levelUpTo: session.levelUpTo
    };
  }

  function totalUnits() { return units().length; }
  function masteredCount() {
    var p = VT.Store.get().pronouns, n = 0;
    for (var k in p) { if (p[k].box >= MASTERY_BOX) n++; }
    return n;
  }

  return {
    SESSION_SIZE: SESSION_SIZE, XP_PER_CORRECT: XP_PER_CORRECT,
    buildSession: buildSession, current: current, answer: answer,
    next: next, isDone: isDone, finish: finish,
    getSession: function () { return session; },
    totalUnits: totalUnits, masteredCount: masteredCount
  };
})();
