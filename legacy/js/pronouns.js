var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.PRONOUNS – Daten für den Übungsblock „Anreden & Pronomen" (reine Daten).
 *
 * Vietnamesisch ist relational: WIE man „ich" und „du" sagt, hängt davon ab, MIT
 * WEM man spricht. Dieser Block trainiert genau das: gegeben ein Gegenüber (Rolle),
 * welches Wort nutze ich für MICH (self) und wie SPRECHE ich die Person AN (addr).
 *
 * Rolle: { id, icon, label, self, addr }
 *   - label: deutsche Beschreibung des Gegenübers ("ein alter Mann / Opa").
 *   - self:  Vokabel-ID (w0xx), mit der ICH mich in dieser Situation bezeichne.
 *   - addr:  Vokabel-ID, mit der ich das Gegenüber ANREDE (null = im förmlichen
 *            Register spricht man die fremde Person meist gar nicht mit Pronomen an).
 * self/addr zeigen auf echte Wörter in VT.DATA → Gloss + Audio (audio/w0xx.mp3)
 * werden direkt wiederverwendet; keine eigenen Audios nötig.
 *
 * Perspektive: männlicher Lerner (daher nie „chị" als Selbstbezeichnung). Gegenüber
 * von Großeltern-/Elternfreunde-Alter → man selbst = „cháu"; gegenüber den eigenen
 * Eltern = „con"; wenig älter = „em"; jünger = „anh"; fremd/förmlich = „tôi".
 * ============================================================================= */
VT.PRONOUNS = {
  roles: [
    { id: "anh", icon: "👨",   label: "ein etwas älterer Mann",            self: "w005", addr: "w003" }, // em → anh
    { id: "chi", icon: "👩",   label: "eine etwas ältere Frau",            self: "w005", addr: "w004" }, // em → chị
    { id: "em",  icon: "🧒",   label: "eine jüngere Person",               self: "w003", addr: "w005" }, // anh → em
    { id: "bo",  icon: "👨‍👦", label: "dein Vater",                        self: "w023", addr: "w022" }, // con → bố
    { id: "me",  icon: "👩‍👦", label: "deine Mutter",                      self: "w023", addr: "w021" }, // con → mẹ
    { id: "ong", icon: "👴",   label: "ein alter Mann (Opa)",              self: "w026", addr: "w006" }, // cháu → ông
    { id: "ba",  icon: "👵",   label: "eine alte Frau (Oma)",              self: "w026", addr: "w007" }, // cháu → bà
    { id: "chu", icon: "🧔",   label: "ein Mann im Alter deiner Eltern",   self: "w026", addr: "w009" }, // cháu → chú
    { id: "co",  icon: "👩‍🦰", label: "eine Frau im Alter deiner Eltern",  self: "w026", addr: "w008" }, // cháu → cô
    { id: "la",  icon: "🤝",   label: "eine fremde Person (förmlich)",     self: "w001", addr: null   }  // tôi
  ],

  roleById: function (id) {
    for (var i = 0; i < this.roles.length; i++) {
      if (this.roles[i].id === id) return this.roles[i];
    }
    return null;
  }
};
