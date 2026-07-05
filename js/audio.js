var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.Audio – Aussprache abspielen.
 *
 * Strategie (Phase 2 baut sie voll aus):
 *   1. MP3 "audio/<wort.id>.mp3" (edge-tts, vi-VN-Neural-Stimme) über ein
 *      wiederverwendetes <audio>-Element abspielen.
 *   2. Fallback: Web Speech API (speechSynthesis, lang "vi-VN"), falls die
 *      Datei fehlt oder nicht lädt.
 *
 * iOS-Eigenheit: Audio darf erst nach einer User-Interaktion starten.
 * unlock() wird von VT.App beim ersten Touch/Click aufgerufen und spielt das
 * stumme Element einmal an, damit spätere play()-Aufrufe erlaubt sind.
 * ============================================================================= */
VT.Audio = (function () {
  var el = null;        // ein wiederverwendetes <audio>-Element
  var unlocked = false;

  function ensureEl() {
    if (!el) { el = document.createElement("audio"); el.preload = "auto"; }
    return el;
  }

  // Beim ersten User-Tap aufrufen (iOS-Autoplay-Sperre lösen).
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    var a = ensureEl();
    a.muted = true;
    var p = a.play();
    if (p && p.catch) p.catch(function () {});
    a.pause(); a.muted = false;
  }

  // Aussprache eines Wort-Objekts ({id, vn}) abspielen. MP3 zuerst, TTS-Fallback.
  function play(word) {
    if (!word) return;
    var a = ensureEl();
    // onerror (Datei fehlt/defekt) und play().catch (z.B. Autoplay blockiert)
    // koennen fuer denselben Versuch beide feuern; Guard verhindert Doppel-TTS.
    var fellBack = false;
    var fallback = function () { if (fellBack) return; fellBack = true; speak(word.vn); };
    a.onerror = null;
    a.src = "audio/" + word.id + ".mp3";
    a.onerror = fallback;
    var p = a.play();
    if (p && p.catch) p.catch(fallback);
  }

  // Fallback: Web Speech API mit vietnamesischer Stimme.
  function speak(text) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "vi-VN";
      u.rate = 0.9; // etwas langsamer für Lerner
      window.speechSynthesis.speak(u);
    } catch (e) { /* kein TTS verfügbar -> still */ }
  }

  return { play: play, speak: speak, unlock: unlock };
})();
