var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.SRS – Leitner-System (reine Logik über VT.Store, kein DOM, kein Audio).
 *
 * 5 Boxen (0..4):
 *   Box 0 = neu/nicht gekonnt … Box 4 = sicher beherrscht.
 *   Richtig beantwortet  -> Box +1 (max 4)
 *   Falsch beantwortet   -> Box -1 (min 0)   [Anforderung: senken, nicht Reset]
 *
 * Aufgabenauswahl: gewichtete Zufallsauswahl – niedrige Box = hohes Gewicht,
 * dadurch erscheinen falsch beantwortete Wörter häufiger (BOX_WEIGHT unten).
 *
 * Paket-Freischaltung: Paket N+1 wird frei, wenn im Paket N mindestens
 * MASTERY_COUNT von 10 Wörtern Box >= MASTERY_BOX erreicht haben.
 *
 * Vollständige Implementierung der Auswahl-/Freischaltlogik: Phase 3.
 * ============================================================================= */
VT.SRS = (function () {
  var BOX_MAX = 4;
  var BOX_WEIGHT = [8, 5, 3, 2, 1]; // Auswahlgewicht je Box 0..4
  var MASTERY_BOX = 2;              // ab dieser Box zählt ein Wort als "beherrscht"
  var MASTERY_COUNT = 8;            // so viele von 10 Wörtern schalten das nächste Paket frei

  // Klartext-Beherrschungsstufe je Box – für die Statistik-Anzeige.
  var MASTERY_LABELS = ["Anfänger", "Lernphase", "Bekannt", "Sicher", "Gemeistert"];
  function masteryLabel(box) {
    var i = Math.min(Math.max(box | 0, 0), MASTERY_LABELS.length - 1);
    return MASTERY_LABELS[i];
  }

  // Antwort verbuchen: Box bewegen, Statistik zählen, speichern.
  function answer(wordId, correct) {
    var w = VT.Store.wordState(wordId);
    w.seen++;
    if (correct) { w.right++; w.box = Math.min(w.box + 1, BOX_MAX); }
    else         { w.wrong++; w.box = Math.max(w.box - 1, 0); }
    w.last = Date.now();
    VT.Store.save();
    return w.box;
  }

  // Anzahl beherrschter Wörter (Box >= MASTERY_BOX) eines Pakets.
  function packMastery(packId) {
    var words = VT.DATA.wordsOfPack(packId), n = 0;
    for (var i = 0; i < words.length; i++) {
      var s = VT.Store.get().words[words[i].id];
      if (s && s.box >= MASTERY_BOX) n++;
    }
    return n;
  }

  function isPackUnlocked(packId) {
    return packId <= VT.Store.get().unlockedPacks;
  }

  // Prüft nach einer Session, ob das nächste Paket freigeschaltet wird. (Phase 3)
  function checkUnlock() {
    var s = VT.Store.get();
    while (s.unlockedPacks < VT.DATA.packs.length &&
           packMastery(s.unlockedPacks) >= MASTERY_COUNT) {
      s.unlockedPacks++;
      VT.Store.save();
    }
  }

  // Eine gewichtete Zufallsauswahl aus [{item, weight}, …].
  function weightedPick(entries) {
    var total = 0, i;
    for (i = 0; i < entries.length; i++) total += entries[i].weight;
    var r = Math.random() * total;
    for (i = 0; i < entries.length; i++) {
      r -= entries[i].weight;
      if (r < 0) return entries[i];
    }
    return entries[entries.length - 1];
  }

  // Auswahl von n Aufgaben-Wörtern aus einem Paket für eine Session.
  // Box-Stand steuert die Auswahl: niedrige Box = hohes Gewicht (BOX_WEIGHT),
  // dadurch erscheinen neue und falsch beantwortete Wörter häufiger.
  // Ziehen MIT Zurücklegen (Paket hat nur 10 Wörter, Session ~10 Aufgaben) –
  // aber ohne direkte Wiederholung und mit Obergrenze je Wort, damit die
  // Session abwechslungsreich bleibt und alle Wörter Chancen bekommen.
  function pickWords(packId, n) {
    var words = VT.DATA.wordsOfPack(packId);
    if (words.length === 0) return [];
    var store = VT.Store.get();
    var weighted = words.map(function (w) {
      var s = store.words[w.id];
      var box = s ? s.box : 0; // unbekannt/neu = Box 0 = höchstes Gewicht
      return { item: w, weight: BOX_WEIGHT[box] };
    });

    var picks = [], counts = {}, last = null;
    var maxPer = Math.max(2, Math.ceil(n / words.length) + 1);
    for (var i = 0; i < n; i++) {
      var pool = weighted.filter(function (e) {
        return e.item !== last && (counts[e.item.id] || 0) < maxPer;
      });
      if (pool.length === 0) pool = weighted.filter(function (e) { return e.item !== last; });
      if (pool.length === 0) pool = weighted;
      var chosen = weightedPick(pool).item;
      picks.push(chosen);
      counts[chosen.id] = (counts[chosen.id] || 0) + 1;
      last = chosen;
    }
    return picks;
  }

  return {
    BOX_MAX: BOX_MAX, BOX_WEIGHT: BOX_WEIGHT,
    MASTERY_BOX: MASTERY_BOX, MASTERY_COUNT: MASTERY_COUNT,
    answer: answer, pickWords: pickWords, masteryLabel: masteryLabel,
    packMastery: packMastery, isPackUnlocked: isPackUnlocked, checkUnlock: checkUnlock
  };
})();
