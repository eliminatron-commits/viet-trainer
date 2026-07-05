var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.UI – Screens & DOM-Rendering. Einziges Modul, das ins DOM schreibt.
 *
 * Screen-Muster: VT.UI.show("home" | "session" | "result", params) leert
 * #screen und rendert neu (kein Router/History – App läuft standalone, Zurück
 * regelt die UI selbst).
 *
 * Screens: Home (Start + Paketübersicht in einem, Duolingo-Stil), Session
 * (eine Aufgabe je Ansicht, 3 Modi), Ergebnis (Score + XP + ggf. Paket-Feier).
 * Gamification-Feedback (HUD-Pulse bei XP/Streak-Zuwachs, Freischalt-Banner)
 * ist rein visuell und ändert keine Logik – die liegt in VT.Quiz/VT.SRS/VT.Store.
 * ============================================================================= */
VT.UI = (function () {
  var root = null;
  var lastXp = null, lastStreak = null; // für Pulse-Animation bei Zuwachs

  function init() {
    root = document.getElementById("screen");
    lastXp = VT.Store.get().xp;
    lastStreak = VT.Store.get().streak.count;

    // Untere Tab-Navigation verdrahten (Home/Statistik).
    var tabs = document.querySelectorAll("#tabbar .tab");
    Array.prototype.forEach.call(tabs, function (t) {
      t.addEventListener("click", function () { show(t.getAttribute("data-tab")); });
    });

    updateHud();
    show("home");
  }

  // HUD (Kopfzeile) aktualisieren; pulst kurz, wenn XP/Streak seit dem letzten
  // Aufruf gestiegen sind (visuelles Erfolgs-Feedback ohne Layout-Sprung).
  function updateHud() {
    var s = VT.Store.get();
    var xpEl = document.getElementById("hud-xp");
    var streakEl = document.getElementById("hud-streak");
    xpEl.textContent = "⭐ " + s.xp + " XP";
    streakEl.textContent = "🔥 " + s.streak.count;

    if (lastXp !== null && s.xp > lastXp) pulse(xpEl);
    if (lastStreak !== null && s.streak.count > lastStreak) pulse(streakEl);
    lastXp = s.xp;
    lastStreak = s.streak.count;
  }

  function pulse(elm) {
    elm.classList.remove("hud-pulse"); // Reflow erzwingen -> Animation kann erneut starten
    void elm.offsetWidth;
    elm.classList.add("hud-pulse");
  }

  function show(name, params) {
    root.innerHTML = "";
    if (name === "home") renderHome();
    else if (name === "stats") renderStats();
    else if (name === "session") renderSession();
    else if (name === "result") renderResult(params);
    stagger(root);
    updateTabbar(name);
    root.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // Eintritts-Choreografie: die rise-in-Animation der Screen-Kinder (CSS)
  // zeitlich staffeln, damit der Screen "aufgebaut" wirkt statt zu ploppen.
  function stagger(container) {
    var kids = container.children;
    for (var i = 0; i < kids.length; i++) {
      kids[i].style.animationDelay = Math.min(i * 45, 400) + "ms";
    }
  }

  // Tab-Bar nur auf den Haupt-Screens zeigen (nicht während Session/Ergebnis)
  // und den aktiven Reiter markieren.
  function updateTabbar(name) {
    var isMain = (name === "home" || name === "stats");
    document.body.classList.toggle("show-tabbar", isMain);
    var tabs = document.querySelectorAll("#tabbar .tab");
    Array.prototype.forEach.call(tabs, function (t) {
      t.classList.toggle("active", t.getAttribute("data-tab") === name);
    });
  }

  // --- Home: Gesamtfortschritt + Paketliste ---------------------------------
  function renderHome() {
    var s = VT.Store.get();
    var masteredTotal = 0;
    VT.DATA.packs.forEach(function (p) { masteredTotal += VT.SRS.packMastery(p.id); });

    var head = el("div", "card home-head");
    head.innerHTML =
      "<h1>Việt-Trainer</h1>" +
      "<p class='home-sub'>" + masteredTotal + " von " + VT.DATA.words.length + " Wörtern gelernt</p>" +
      progressBar(masteredTotal, VT.DATA.words.length, "big");
    root.appendChild(head);

    var list = el("div", "pack-list");
    VT.DATA.packs.forEach(function (p) {
      var unlocked = VT.SRS.isPackUnlocked(p.id);
      var mastered = VT.SRS.packMastery(p.id);
      var complete = mastered >= 10;
      var btn = el("button", "pack-row" + (unlocked ? "" : " locked") + (complete ? " complete" : ""));
      btn.type = "button";
      btn.disabled = !unlocked;
      btn.innerHTML =
        "<span class='pack-icon'>" + (unlocked ? p.icon : "🔒") + "</span>" +
        "<span class='pack-body'>" +
          "<span class='pack-name'>" + p.id + ". " + p.name + (complete ? " ✓" : "") + "</span>" +
          "<span class='pack-sub'>" + (unlocked
            ? (mastered + " / 10 beherrscht")
            : ("frei ab " + VT.SRS.MASTERY_COUNT + "/10 in Paket " + (p.id - 1))) + "</span>" +
          progressBar(mastered, 10) +
        "</span>" +
        (unlocked ? "<span class='pack-arrow'>›</span>" : "");
      if (unlocked) btn.addEventListener("click", function () { startSession(p.id); });
      list.appendChild(btn);
    });
    root.appendChild(list);

    root.appendChild(renderSettings());
  }

  // --- Einstellungen: geschützter Reset (3 Sekunden halten) -------------------
  // Bewusst unten auf dem Home-Screen statt prominent, und nur per
  // Halten-zum-Bestätigen auslösbar – ein einzelner (versehentlicher)
  // Tap kann nie etwas löschen.
  function renderSettings() {
    var card = el("div", "card settings-card");
    card.innerHTML =
      "<div class='settings-title'>⚙️ Einstellungen</div>" +
      "<p class='settings-hint'>Setzt die App auf Anfang zurück: XP, Streak, " +
      "Lernstand aller Wörter und freigeschaltete Pakete werden endgültig gelöscht.</p>";

    var hold = el("button", "danger-hold");
    hold.type = "button";
    hold.innerHTML =
      "<span class='dh-label'>🗑️ Fortschritt zurücksetzen</span>" +
      "<span class='dh-sub'>zum Bestätigen 3 Sekunden gedrückt halten</span>";
    wireHold(hold, 3000, function () {
      VT.Store.reset();
      lastXp = 0; lastStreak = 0;
      updateHud();
      toast("Fortschritt gelöscht – neuer Anfang! 🌱");
      show("home");
    });
    card.appendChild(hold);
    return card;
  }

  // Halten-zum-Bestätigen: Timer startet bei pointerdown, jede Unterbrechung
  // (loslassen, Finger wegziehen, Scroll-Abbruch) bricht ab. Der CSS-Füllbalken
  // (.holding) macht den Fortschritt sichtbar.
  function wireHold(btn, ms, onConfirm) {
    var timer = null;
    function start(ev) {
      ev.preventDefault();
      if (timer) return;
      btn.classList.add("holding");
      timer = setTimeout(function () { cancel(); onConfirm(); }, ms);
    }
    function cancel() {
      if (timer) { clearTimeout(timer); timer = null; }
      btn.classList.remove("holding");
    }
    btn.addEventListener("pointerdown", start);
    btn.addEventListener("pointerup", cancel);
    btn.addEventListener("pointercancel", cancel);
    btn.addEventListener("pointerleave", cancel);
    btn.addEventListener("contextmenu", function (ev) { ev.preventDefault(); }); // iOS-Langdruck-Menü unterdrücken
  }

  function startSession(packId) {
    VT.Quiz.buildSession(packId);
    show("session");
  }

  // --- Statistik: alle kennengelernten Wörter mit Beherrschungsgrad ----------
  function renderStats() {
    var s = VT.Store.get();
    var learned = VT.DATA.words.filter(function (w) {
      var st = s.words[w.id];
      return st && st.seen > 0;
    });

    var head = el("div", "card stats-head");
    if (learned.length === 0) {
      head.innerHTML =
        "<h1>Statistik</h1>" +
        "<p>Noch keine Wörter gelernt. Starte eine Übung im Reiter „Lernen“ – " +
        "danach siehst du hier für jedes Wort, wie gut du es schon beherrschst.</p>";
      root.appendChild(head);
      return;
    }

    // Zusammenfassung: gelernte Wörter, sicher beherrschte, Gesamt-Trefferquote.
    var totalSeen = 0, totalRight = 0, mastered = 0;
    learned.forEach(function (w) {
      var st = s.words[w.id];
      totalSeen += st.seen; totalRight += st.right;
      if (st.box >= VT.SRS.MASTERY_BOX) mastered++;
    });
    var avgRate = totalSeen > 0 ? Math.round(100 * totalRight / totalSeen) : 0;
    head.innerHTML =
      "<h1>Statistik</h1>" +
      "<p class='home-sub'>" + learned.length + " Wörter kennengelernt · " + mastered + " sicher beherrscht</p>" +
      "<p>Gesamt-Trefferquote: " + avgRate + "%</p>";
    root.appendChild(head);

    // Schwächste Wörter zuerst (niedrige Box, dann niedrige Trefferquote),
    // damit der Lerner sofort sieht, woran er arbeiten sollte.
    var sorted = learned.slice().sort(function (a, b) {
      var sa = s.words[a.id], sb = s.words[b.id];
      if (sa.box !== sb.box) return sa.box - sb.box;
      return (sa.right / sa.seen) - (sb.right / sb.seen);
    });

    sorted.forEach(function (w) {
      var st = s.words[w.id];
      var rate = st.seen > 0 ? Math.round(100 * st.right / st.seen) : 0;
      var row = el("div", "stat-row");
      var main = el("div", "stat-main");
      main.innerHTML =
        "<div class='stat-word'><b>" + w.vn + "</b> — " + w.de + "</div>" +
        "<div class='stat-detail'>" + st.seen + "× gesehen · " + st.right + "× richtig · " + rate + "% Quote</div>" +
        "<div class='stat-mastery-label'>" + VT.SRS.masteryLabel(st.box) + "</div>" +
        progressBar(st.box, VT.SRS.BOX_MAX);
      row.appendChild(main);
      row.appendChild(audioButton(w, "🔊"));
      root.appendChild(row);
    });
  }

  // --- Session: eine Aufgabe rendern ----------------------------------------
  function renderSession() {
    var task = VT.Quiz.current();
    if (!task) { show("home"); return; }
    var sess = VT.Quiz.getSession();

    var bar = el("div", "card session-head");
    bar.innerHTML =
      "<div class='session-progress'>Aufgabe " + (sess.index + 1) + " / " + sess.tasks.length + "</div>" +
      progressBar(sess.index, sess.tasks.length);
    root.appendChild(bar);

    var q = el("div", "card question");
    q.appendChild(renderPrompt(task));
    root.appendChild(q);

    var opts = el("div", "options");
    task.options.forEach(function (w, i) {
      var b = el("button", "option");
      b.type = "button";
      b.textContent = optionLabel(task.mode, w);
      b.style.animationDelay = (160 + i * 60) + "ms"; // Optionen einzeln einsteigen lassen
      b.addEventListener("click", function () { onAnswer(task, w, opts); });
      opts.appendChild(b);
    });
    root.appendChild(opts);

    // Bei Hör- und VN->DE-Aufgaben das Wort direkt automatisch vorsprechen.
    // NICHT bei DE->VN: dort stehen die vietnamesischen Wörter als Optionen,
    // die Aussprache würde die Lösung verraten. Kleiner Delay, damit das Audio
    // nach der Eintritts-Animation kommt; das geteilte <audio>-Element wurde
    // beim ersten Touch entsperrt, daher ist der Timeout iOS-sicher.
    if (task.mode !== "de2vn") {
      setTimeout(function () {
        if (VT.Quiz.current() === task && !task.answered) VT.Audio.play(task.word);
      }, 400);
    }
  }

  // Frage-Bereich je Modus (mit Audio-Button, wo Vietnamesisch/Audio dran ist).
  function renderPrompt(task) {
    var wrap = el("div", "prompt");
    if (task.mode === "de2vn") {
      wrap.innerHTML = "<div class='prompt-label'>Wie heißt das auf Vietnamesisch?</div>" +
                       "<div class='prompt-main'>" + task.word.de + "</div>";
    } else if (task.mode === "vn2de") {
      wrap.innerHTML = "<div class='prompt-label'>Was bedeutet das?</div>" +
                       "<div class='prompt-main'>" + task.word.vn + "</div>";
      wrap.appendChild(audioButton(task.word, "🔊 anhören"));
    } else { // listen
      wrap.innerHTML = "<div class='prompt-label'>Hör zu und wähle das richtige Wort</div>";
      wrap.appendChild(audioButton(task.word, "🔊 abspielen", true));
    }
    return wrap;
  }

  function optionLabel(mode, w) {
    return mode === "vn2de" ? w.de : w.vn;
  }

  function onAnswer(task, chosen, optsEl) {
    if (task.answered) return;
    var correct = VT.Quiz.answer(chosen.id);
    VT.Audio.play(task.word); // beim Antworten automatisch die korrekte Aussprache abspielen
    updateHud();

    var buttons = optsEl.querySelectorAll(".option");
    var correctBtn = null;
    task.options.forEach(function (w, i) {
      var b = buttons[i];
      b.disabled = true;
      if (w.id === task.word.id) { b.classList.add("correct"); correctBtn = b; }
      else if (w.id === chosen.id) b.classList.add("wrong");
    });

    // Kleiner Konfetti-Burst aus der richtigen Antwort heraus.
    if (correct && correctBtn) {
      var r = correctBtn.getBoundingClientRect();
      confettiBurst(r.left + r.width / 2, r.top + r.height / 2, 16);
    }

    renderFeedback(task, correct);
  }

  // Feedback-Leiste mit korrekter Lösung + Audio + Weiter-Button.
  function renderFeedback(task, correct) {
    var fb = el("div", "feedback " + (correct ? "ok" : "no"));
    var sol = el("div", "solution");
    sol.innerHTML =
      "<div class='fb-title'>" + (correct ? "Richtig! 🎉" : "Nicht ganz.") + "</div>" +
      "<div class='fb-word'><b>" + task.word.vn + "</b> — " + task.word.de +
      " <span class='fb-pron'>[" + task.word.pron + "]</span></div>";
    sol.appendChild(audioButton(task.word, "🔊"));
    fb.appendChild(sol);

    var nextBtn = el("button", "next-btn");
    nextBtn.type = "button";
    nextBtn.textContent = "Weiter";
    nextBtn.addEventListener("click", function () {
      VT.Quiz.next();
      if (VT.Quiz.isDone()) {
        var summary = VT.Quiz.finish();
        updateHud();
        show("result", summary);
      } else {
        show("session");
      }
    });
    fb.appendChild(nextBtn);
    root.appendChild(fb);
    nextBtn.scrollIntoView({ block: "nearest" });
  }

  // --- Ergebnis ---------------------------------------------------------------
  function renderResult(summary) {
    var total = summary ? summary.total : 0;
    var correct = summary ? summary.correct : 0;
    var pct = total > 0 ? Math.round(100 * correct / total) : 0;
    var stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0;

    var card = el("div", "card result");
    card.innerHTML =
      "<div class='result-stars'>" + starRow(stars) + "</div>" +
      "<h1>" + resultHeadline(pct) + "</h1>" +
      "<div class='result-score'>" + correct + " / " + total + " richtig (" + pct + "%)</div>" +
      "<div class='result-xp'>+" + (summary ? summary.xpEarned : 0) + " XP</div>";
    root.appendChild(card);

    // Konfetti-Feier bei guter Session (100%: doppelte Salve).
    if (pct >= 70) {
      setTimeout(function () { confettiBurst(window.innerWidth / 2, 150, pct === 100 ? 42 : 24); }, 300);
      if (pct === 100) {
        setTimeout(function () { confettiBurst(window.innerWidth / 2 - 80, 220, 20); }, 650);
        setTimeout(function () { confettiBurst(window.innerWidth / 2 + 80, 220, 20); }, 850);
      }
    }

    if (summary && summary.streak && summary.streak.grew) {
      var streakCard = el("div", "card streak-banner");
      streakCard.innerHTML =
        "<span class='streak-flame'>🔥</span>" +
        "<span>" + summary.streak.count + "-Tage-Streak! Weiter so.</span>";
      root.appendChild(streakCard);
    }

    if (summary && summary.newlyUnlockedPack) {
      var pack = VT.DATA.packs.filter(function (p) { return p.id === summary.newlyUnlockedPack; })[0];
      if (pack) {
        var unlockCard = el("div", "card unlock-banner");
        unlockCard.innerHTML =
          "<span class='unlock-icon'>" + pack.icon + "</span>" +
          "<span class='unlock-text'><b>Neues Paket freigeschaltet!</b><br>" + pack.id + ". " + pack.name + "</span>";
        root.appendChild(unlockCard);
      }
    }

    var again = el("button", "primary-btn");
    again.type = "button";
    again.textContent = "Nochmal üben";
    again.addEventListener("click", function () { startSession(summary.packId); });
    root.appendChild(again);

    var homeBtn = el("button", "secondary-btn");
    homeBtn.type = "button";
    homeBtn.textContent = "Zur Übersicht";
    homeBtn.addEventListener("click", function () { show("home"); });
    root.appendChild(homeBtn);
  }

  function resultHeadline(pct) {
    if (pct === 100) return "Perfekt! 🏆";
    if (pct >= 70) return "Gut gemacht!";
    if (pct >= 40) return "Nicht schlecht.";
    return "Dranbleiben!";
  }
  function starRow(n) {
    var out = "";
    for (var i = 0; i < 3; i++) out += "<span class='star" + (i < n ? " filled" : "") + "'>★</span>";
    return out;
  }

  // --- kleine DOM-Helfer ------------------------------------------------------
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  // Konfetti-Burst an Bildschirmposition (x, y): kurzlebige DOM-Partikel in der
  // #fx-Ebene, Flugbahn per CSS-Variablen, räumen sich selbst wieder weg.
  var CONFETTI_COLORS = ["#2ee87e", "#ffd447", "#7fe3ff", "#ff9ff3", "#a4ffcd"];
  function confettiBurst(x, y, count) {
    var fx = document.getElementById("fx");
    if (!fx) return;
    for (var i = 0; i < count; i++) {
      var p = el("i", "confetti");
      var ang = Math.random() * Math.PI * 2;
      var dist = 60 + Math.random() * 100;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      p.style.setProperty("--dx", (Math.cos(ang) * dist) + "px");
      p.style.setProperty("--dy", (Math.sin(ang) * dist - 50) + "px"); // leicht nach oben gewölbt
      p.style.setProperty("--r", (Math.random() * 540 - 270) + "deg");
      p.style.animationDuration = (600 + Math.random() * 500) + "ms";
      fx.appendChild(p);
      (function (elm) { setTimeout(function () { elm.remove(); }, 1300); })(p);
    }
  }

  // Kurze Bestätigungs-Einblendung am unteren Rand.
  function toast(msg) {
    var t = el("div", "toast");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("show"); }, 20);
    setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.remove(); }, 350);
    }, 2400);
  }

  function audioButton(word, label, big) {
    var b = el("button", "audio-btn" + (big ? " big" : ""));
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", function (ev) { ev.stopPropagation(); VT.Audio.play(word); });
    return b;
  }

  function progressBar(value, max, size) {
    var pct = max > 0 ? Math.round(100 * Math.min(value, max) / max) : 0;
    return "<div class='pbar" + (size ? " " + size : "") + "'><div class='pbar-fill' style='width:" + pct + "%'></div></div>";
  }

  return { init: init, show: show, updateHud: updateHud };
})();
