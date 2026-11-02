var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.App – Bootstrap: Service-Worker-Registrierung, iOS-Audio-Unlock, UI-Start.
 * ============================================================================= */
VT.App = (function () {
  function init() {
    // Service Worker nur über http(s) – bei file:// wirft register() sonst.
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js").catch(function (e) {
        console.warn("SW-Registrierung fehlgeschlagen:", e);
      });
    }

    // iOS erlaubt Audio erst nach User-Interaktion: beim ersten Touch entsperren.
    var unlockOnce = function () {
      VT.Audio.unlock();
      document.removeEventListener("touchstart", unlockOnce);
      document.removeEventListener("mousedown", unlockOnce);
    };
    document.addEventListener("touchstart", unlockOnce);
    document.addEventListener("mousedown", unlockOnce);

    VT.UI.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { init: init };
})();
