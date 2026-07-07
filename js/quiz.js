var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.Quiz – Quiz-Engine (Sessions, Aufgaben, Auswertung). Kein DOM, kein Audio-
 * Aufruf – die UI (Phase 4) rendert Aufgaben und meldet Antworten zurück.
 *
 * Aufgaben-Datenmodell (von buildSession erzeugt):
 *   {
 *     mode: "de2vn" | "vn2de" | "listen",  // MC Deutsch->Viet., Viet.->Deutsch, Hörverständnis
 *     item: <Wort-Objekt>,                 // das abgefragte Item (= korrekte Lösung); {id,vn,de,pron?}
 *                                          // (gleiche Form wie Satz-Aufgaben in VT.SentenceQuiz)
 *     options: [<Wort-Objekt> x4],         // 4 Antwortoptionen, gemischt, enthält item
 *     answered: false, correct: null,      // wird durch answer() gesetzt
 *     chosenId: null                       // vom Nutzer gewählte Options-id
 *   }
 *   - "listen": UI spielt word-Audio, Optionen zeigen das vietnamesische Wort.
 *   - "de2vn": Frage zeigt word.de, Optionen zeigen w.vn.
 *   - "vn2de": Frage zeigt word.vn (+Audio), Optionen zeigen w.de.
 *   - Optionen sind ganze Wort-Objekte, damit die UI je Modus das passende
 *     Feld (de/vn) anzeigen kann und Audio je Option möglich ist.
 *
 * Session: SESSION_SIZE Aufgaben über die per VT.SRS.pickWords gewählten Wörter,
 * Modi gleichmäßig rotiert und in der Reihenfolge gemischt. XP_PER_CORRECT wird
 * bei richtiger Antwort gutgeschrieben; finish() prüft die Paket-Freischaltung.
 * ============================================================================= */
VT.Quiz = (function () {
  var SESSION_SIZE = 10;
  var XP_PER_CORRECT = 10;
  var MODES = ["de2vn", "vn2de", "listen"];

  var session = null; // { packId, tasks: [], index: 0, correctCount: 0 }

  // --- kleine, modul-private Zufallshelfer -----------------------------------
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function sample(arr, k) {
    return shuffle(arr.slice()).slice(0, k);
  }

  // 4 Optionen bauen: das Zielwort + 3 Distraktoren. Distraktoren bevorzugt aus
  // demselben Paket (kohärenter), bei Bedarf global aufgefüllt.
  function buildOptions(word, packId) {
    var pool = VT.DATA.wordsOfPack(packId).filter(function (w) { return w.id !== word.id; });
    if (pool.length < 3) {
      var extra = VT.DATA.words.filter(function (w) {
        return w.id !== word.id && pool.indexOf(w) === -1;
      });
      pool = pool.concat(extra);
    }
    var options = sample(pool, 3);
    options.push(word);
    return shuffle(options);
  }

  function makeTask(mode, word, packId) {
    return {
      mode: mode, item: word, options: buildOptions(word, packId),
      answered: false, correct: null, chosenId: null
    };
  }

  // Session für ein Paket aufbauen: SRS wählt die Wörter, Modi rotieren,
  // Reihenfolge wird gemischt.
  function buildSession(packId) {
    var words = VT.SRS.pickWords(packId, SESSION_SIZE);
    var tasks = words.map(function (w, i) {
      return makeTask(MODES[i % MODES.length], w, packId);
    });
    shuffle(tasks);
    session = { packId: packId, tasks: tasks, index: 0, correctCount: 0,
                levelUpTo: null, streakInfo: null };
    return session;
  }

  function current() { return session && session.tasks[session.index] || null; }

  // Antwort auswerten: verbucht Leitner-Box (VT.SRS), XP bei Richtig, speichert.
  // Rückgabe: true/false (richtig/falsch) oder null, wenn keine offene Aufgabe.
  function answer(optionWordId) {
    var task = current();
    if (!task || task.answered) return null;
    var correct = optionWordId === task.item.id;
    task.answered = true;
    task.correct = correct;
    task.chosenId = optionWordId;
    VT.SRS.answer(task.item.id, correct); // Box +/-1, Statistik, save
    if (correct) {
      session.correctCount++;
      // Zentrale XP-Vergabe: verbucht Gesamt-/Tages-XP, Level, Streak-Ziel.
      var res = VT.Store.addXp(XP_PER_CORRECT);
      if (res.leveledUp) session.levelUpTo = res.level;
      if (res.goalJustReached && res.streak) session.streakInfo = res.streak;
    }
    return correct;
  }

  function next() { if (session) session.index++; return current(); }
  function isDone() { return !session || session.index >= session.tasks.length; }

  // Session abschließen: Paket-Freischaltung prüfen, Zusammenfassung liefern.
  // Streak & Level-up wurden bereits während der Antworten (VT.Store.addXp)
  // erkannt und in der Session gesammelt.
  function finish() {
    if (!session) return null;
    var unlockedBefore = VT.Store.get().unlockedPacks;
    VT.SRS.checkUnlock();
    var unlockedAfter = VT.Store.get().unlockedPacks;
    return {
      packId: session.packId,
      total: session.tasks.length,
      correct: session.correctCount,
      xpEarned: session.correctCount * XP_PER_CORRECT,
      newlyUnlockedPack: unlockedAfter > unlockedBefore ? unlockedAfter : null,
      streak: session.streakInfo,        // nur gesetzt, wenn heute das Tagesziel fiel
      levelUpTo: session.levelUpTo        // nur gesetzt, wenn ein Level-up passierte
    };
  }

  return {
    SESSION_SIZE: SESSION_SIZE, XP_PER_CORRECT: XP_PER_CORRECT, MODES: MODES,
    buildSession: buildSession, current: current, answer: answer, next: next,
    isDone: isDone, finish: finish, getSession: function () { return session; }
  };
})();
