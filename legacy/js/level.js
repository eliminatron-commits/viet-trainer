var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.Level – XP -> Level & Rang-Titel (reine Logik, kein DOM, kein Storage).
 *
 * XP geben dem Lernen ein langfristiges Ziel: gesammelte XP lassen den Rang
 * aufsteigen. Frühe Level kommen schnell (Motivation), spätere langsamer.
 *
 * Schwellen (kumulative Gesamt-XP für den Levelbeginn):
 *   THRESHOLDS[0..9] fest, danach linear +STEP je weiteres Level.
 * ============================================================================= */
VT.Level = (function () {
  var THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
  var STEP = 600; // XP je Level jenseits der Tabelle

  // Rang-Titel = kleine "Lernreise". Ab Level 10 bleibt der Titel und die
  // Stufe wird hochgezählt (siehe title()).
  var RANKS = [
    { icon: "🌱", name: "Neuling" },
    { icon: "🌾", name: "Reiskorn" },
    { icon: "🛵", name: "Straßenreisender" },
    { icon: "🍜", name: "Garküchen-Gast" },
    { icon: "🗣️", name: "Plaudertasche" },
    { icon: "🏮", name: "Marktkenner" },
    { icon: "⛩️", name: "Tempelwanderer" },
    { icon: "🐉", name: "Drachenschüler" },
    { icon: "🌟", name: "Wortmeister" },
    { icon: "👑", name: "Sprachkönig" }
  ];

  // Gesamt-XP, ab der ein bestimmtes Level beginnt (level ist 1-basiert).
  function thresholdFor(level) {
    if (level <= THRESHOLDS.length) return THRESHOLDS[level - 1];
    return THRESHOLDS[THRESHOLDS.length - 1] + (level - THRESHOLDS.length) * STEP;
  }

  function rankFor(level) {
    if (level <= RANKS.length) return RANKS[level - 1];
    // Jenseits der Tabelle: höchster Rang mit Stufenzahl.
    var top = RANKS[RANKS.length - 1];
    return { icon: top.icon, name: top.name + " " + (level - RANKS.length + 1) };
  }

  // Vollständige Level-Info zu einem XP-Stand.
  function levelFromXp(xp) {
    xp = Math.max(0, xp | 0);
    var level = 1;
    while (thresholdFor(level + 1) <= xp) level++;
    var cur = thresholdFor(level);
    var next = thresholdFor(level + 1);
    var rank = rankFor(level);
    return {
      level: level,
      icon: rank.icon,
      name: rank.name,
      curThreshold: cur,       // XP-Stand bei Levelbeginn
      nextThreshold: next,     // XP-Stand fürs nächste Level
      intoLevel: xp - cur,     // XP innerhalb des aktuellen Levels
      levelSpan: next - cur,   // XP-Breite des aktuellen Levels
      xpToNext: next - xp,     // fehlende XP bis zum nächsten Level
      progress: (xp - cur) / (next - cur) // 0..1
    };
  }

  return { levelFromXp: levelFromXp, thresholdFor: thresholdFor };
})();
