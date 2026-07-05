var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.DATA – Statischer Wortschatz (reine Daten, keine Logik).
 *
 * Datenmodell Wort:
 *   { id, vn, de, pron, pack }
 *   - id:   stabiler Schlüssel "w001".."w100". Er ist zugleich Audio-Dateiname
 *           (audio/<id>.mp3) und Schlüssel im Fortschritt (VT.Store). Bewusst
 *           NICHT das vietnamesische Wort als Dateiname: Diakritika in Datei-
 *           namen sind auf Windows/Servern/URL-Encoding fehleranfällig.
 *   - vn:   Vietnamesisch mit vollständigen Diakritika/Tonzeichen (Anzeige,
 *           TTS-Eingabe und Quiz-Lösung).
 *   - de:   deutsche Übersetzung (Anzeige und Quiz-Lösung).
 *   - pron: vereinfachte Aussprachehilfe für deutsche Lerner.
 *   - pack: Paket-Id 1..10 (10 Wörter je Paket).
 *
 * Datenmodell Paket:
 *   { id, name, icon }  – id bestimmt die Freischalt-Reihenfolge (1 zuerst).
 *
 * Phase 2 ersetzt die Platzhalter unten durch die kuratierten 100 Wörter
 * (Diakritika vor der Audio-Generierung gegen verlässliche Quellen geprüft).
 * ============================================================================= */
VT.DATA = {
  // Themenpakete in Freischalt-Reihenfolge (Alltagsnützlichkeit zuerst).
  packs: [
    { id: 1,  name: "Begrüßung & Höflichkeit", icon: "👋" },
    { id: 2,  name: "Pronomen & Menschen",     icon: "🧑" },
    { id: 3,  name: "Zahlen",                  icon: "🔢" },
    { id: 4,  name: "Essen & Trinken",         icon: "🍜" },
    { id: 5,  name: "Familie",                 icon: "👪" },
    { id: 6,  name: "Zeit & Tage",             icon: "🕐" },
    { id: 7,  name: "Orte & Verkehr",          icon: "🛵" },
    { id: 8,  name: "Verben des Alltags",      icon: "🏃" },
    { id: 9,  name: "Eigenschaften",           icon: "✨" },
    { id: 10, name: "Fragen & Antworten",      icon: "❓" }
  ],

  // 100 häufigste Alltagswörter, kuratiert nach Alltagsnützlichkeit.
  // Diakritika gegen Standardquellen geprüft, bevor Audio generiert wurde
  // (scripts/generate_audio.py liest diese Datei als Quelle der Wahrheit).
  words: [
    // Paket 1 – Begrüßung & Höflichkeit
    { id: "w001", vn: "xin chào",     de: "hallo",                 pack: 1, pron: "ßin tschau" },
    { id: "w002", vn: "cảm ơn",       de: "danke",                 pack: 1, pron: "kam uhn" },
    { id: "w003", vn: "tạm biệt",     de: "auf Wiedersehen",       pack: 1, pron: "tam bjet" },
    { id: "w004", vn: "xin lỗi",      de: "entschuldigung",        pack: 1, pron: "ßin loy" },
    { id: "w005", vn: "không có gì",  de: "gern geschehen",        pack: 1, pron: "khong ko si" },
    { id: "w006", vn: "làm ơn",       de: "bitte",                 pack: 1, pron: "lam uhn" },
    { id: "w007", vn: "vâng",         de: "ja (höflich)",          pack: 1, pron: "vuhng" },
    { id: "w008", vn: "không",        de: "nein",                  pack: 1, pron: "khong" },
    { id: "w009", vn: "được",         de: "okay, in Ordnung",      pack: 1, pron: "duhk" },
    { id: "w010", vn: "chúc mừng",    de: "herzlichen Glückwunsch", pack: 1, pron: "tschuk muhng" },

    // Paket 2 – Pronomen & Menschen
    { id: "w011", vn: "tôi",         de: "ich",                    pack: 2, pron: "toy" },
    { id: "w012", vn: "bạn",         de: "du (Freund/in)",         pack: 2, pron: "ban" },
    { id: "w013", vn: "anh",         de: "du (älterer Mann)",      pack: 2, pron: "an" },
    { id: "w014", vn: "chị",         de: "du (ältere Frau)",       pack: 2, pron: "tschi" },
    { id: "w015", vn: "em",          de: "du (jüngere Person)",    pack: 2, pron: "em" },
    { id: "w016", vn: "ông",         de: "Herr, Großvater",        pack: 2, pron: "ong" },
    { id: "w017", vn: "bà",          de: "Frau, Großmutter",       pack: 2, pron: "ba" },
    { id: "w018", vn: "chúng tôi",   de: "wir",                    pack: 2, pron: "tschung toy" },
    { id: "w019", vn: "họ",          de: "sie (Mehrzahl)",         pack: 2, pron: "ho" },
    { id: "w020", vn: "người",       de: "Mensch, Person",         pack: 2, pron: "nguh-uy" },

    // Paket 3 – Zahlen
    { id: "w021", vn: "một",  de: "eins",  pack: 3, pron: "mot" },
    { id: "w022", vn: "hai",  de: "zwei",  pack: 3, pron: "hai" },
    { id: "w023", vn: "ba",   de: "drei",  pack: 3, pron: "ba" },
    { id: "w024", vn: "bốn",  de: "vier",  pack: 3, pron: "bon" },
    { id: "w025", vn: "năm",  de: "fünf",  pack: 3, pron: "nam" },
    { id: "w026", vn: "sáu",  de: "sechs", pack: 3, pron: "sau" },
    { id: "w027", vn: "bảy",  de: "sieben", pack: 3, pron: "bay" },
    { id: "w028", vn: "tám",  de: "acht",  pack: 3, pron: "tam" },
    { id: "w029", vn: "chín", de: "neun",  pack: 3, pron: "tschin" },
    { id: "w030", vn: "mười", de: "zehn",  pack: 3, pron: "muh-i" },

    // Paket 4 – Essen & Trinken
    { id: "w031", vn: "cơm",       de: "gekochter Reis",   pack: 4, pron: "kuhm" },
    { id: "w032", vn: "nước",      de: "Wasser",            pack: 4, pron: "nuck" },
    { id: "w033", vn: "phở",       de: "Phở (Nudelsuppe)",  pack: 4, pron: "fuh" },
    { id: "w034", vn: "trà",       de: "Tee",               pack: 4, pron: "tscha" },
    { id: "w035", vn: "cà phê",    de: "Kaffee",            pack: 4, pron: "ka fe" },
    { id: "w036", vn: "thịt",      de: "Fleisch",           pack: 4, pron: "tit" },
    { id: "w037", vn: "cá",        de: "Fisch",             pack: 4, pron: "ka" },
    { id: "w038", vn: "rau",       de: "Gemüse",            pack: 4, pron: "zau" },
    { id: "w039", vn: "trái cây",  de: "Obst",              pack: 4, pron: "tschai kay" },
    { id: "w040", vn: "bánh mì",   de: "Baguette-Sandwich", pack: 4, pron: "banh mi" },

    // Paket 5 – Familie
    { id: "w041", vn: "gia đình",  de: "Familie",            pack: 5, pron: "za ding" },
    { id: "w042", vn: "bố",        de: "Vater",              pack: 5, pron: "bo" },
    { id: "w043", vn: "mẹ",        de: "Mutter",             pack: 5, pron: "me" },
    { id: "w044", vn: "con",       de: "Kind",               pack: 5, pron: "kon" },
    { id: "w045", vn: "anh trai",  de: "älterer Bruder",     pack: 5, pron: "an tschai" },
    { id: "w046", vn: "chị gái",   de: "ältere Schwester",   pack: 5, pron: "tschi gai" },
    { id: "w047", vn: "em trai",   de: "jüngerer Bruder",    pack: 5, pron: "em tschai" },
    { id: "w048", vn: "em gái",    de: "jüngere Schwester",  pack: 5, pron: "em gai" },
    { id: "w049", vn: "vợ",        de: "Ehefrau",            pack: 5, pron: "vuh" },
    { id: "w050", vn: "chồng",     de: "Ehemann",            pack: 5, pron: "tschong" },

    // Paket 6 – Zeit & Tage
    { id: "w051", vn: "hôm nay",     de: "heute",             pack: 6, pron: "hom nay" },
    { id: "w052", vn: "hôm qua",     de: "gestern",           pack: 6, pron: "hom kwa" },
    { id: "w053", vn: "ngày mai",    de: "morgen (Tag)",      pack: 6, pron: "ngai mai" },
    { id: "w054", vn: "bây giờ",     de: "jetzt",             pack: 6, pron: "bay zuh" },
    { id: "w055", vn: "buổi sáng",   de: "Morgen (Tageszeit)", pack: 6, pron: "bu-oi sang" },
    { id: "w056", vn: "buổi tối",    de: "Abend",             pack: 6, pron: "bu-oi toi" },
    { id: "w057", vn: "thứ hai",     de: "Montag",            pack: 6, pron: "tuh hai" },
    { id: "w058", vn: "thứ bảy",     de: "Samstag",           pack: 6, pron: "tuh bay" },
    { id: "w059", vn: "chủ nhật",    de: "Sonntag",           pack: 6, pron: "tschu nyat" },
    { id: "w060", vn: "tuần",        de: "Woche",             pack: 6, pron: "twan" },

    // Paket 7 – Orte & Verkehr
    { id: "w061", vn: "nhà",          de: "Haus, zuhause",  pack: 7, pron: "nja" },
    { id: "w062", vn: "chợ",          de: "Markt",           pack: 7, pron: "tschuh" },
    { id: "w063", vn: "đường",        de: "Straße",          pack: 7, pron: "duh-uhng" },
    { id: "w064", vn: "xe máy",       de: "Motorrad",        pack: 7, pron: "se may" },
    { id: "w065", vn: "xe buýt",      de: "Bus",             pack: 7, pron: "se bwit" },
    { id: "w066", vn: "sân bay",      de: "Flughafen",       pack: 7, pron: "san bay" },
    { id: "w067", vn: "bệnh viện",    de: "Krankenhaus",     pack: 7, pron: "beng vien" },
    { id: "w068", vn: "trường học",   de: "Schule",          pack: 7, pron: "tschuh-uhng hok" },
    { id: "w069", vn: "khách sạn",    de: "Hotel",           pack: 7, pron: "kach san" },
    { id: "w070", vn: "nhà hàng",     de: "Restaurant",      pack: 7, pron: "nja hang" },

    // Paket 8 – Verben des Alltags
    { id: "w071", vn: "ăn",    de: "essen",             pack: 8, pron: "an" },
    { id: "w072", vn: "uống",  de: "trinken",           pack: 8, pron: "u-ong" },
    { id: "w073", vn: "đi",    de: "gehen",             pack: 8, pron: "di" },
    { id: "w074", vn: "ngủ",   de: "schlafen",          pack: 8, pron: "ngu" },
    { id: "w075", vn: "làm",   de: "machen, arbeiten",  pack: 8, pron: "lam" },
    { id: "w076", vn: "nói",   de: "sprechen",          pack: 8, pron: "noi" },
    { id: "w077", vn: "xem",   de: "schauen, sehen",    pack: 8, pron: "sem" },
    { id: "w078", vn: "mua",   de: "kaufen",            pack: 8, pron: "mua" },
    { id: "w079", vn: "đọc",   de: "lesen",             pack: 8, pron: "dok" },
    { id: "w080", vn: "viết",  de: "schreiben",         pack: 8, pron: "vjet" },

    // Paket 9 – Eigenschaften
    { id: "w081", vn: "lớn",    de: "groß",     pack: 9, pron: "luhn" },
    { id: "w082", vn: "nhỏ",    de: "klein",    pack: 9, pron: "njo" },
    { id: "w083", vn: "đẹp",    de: "schön",    pack: 9, pron: "dep" },
    { id: "w084", vn: "tốt",    de: "gut",      pack: 9, pron: "tot" },
    { id: "w085", vn: "xấu",    de: "schlecht", pack: 9, pron: "sau" },
    { id: "w086", vn: "mới",    de: "neu",      pack: 9, pron: "muh-i" },
    { id: "w087", vn: "nóng",   de: "heiß",     pack: 9, pron: "nong" },
    { id: "w088", vn: "lạnh",   de: "kalt",     pack: 9, pron: "lanj" },
    { id: "w089", vn: "nhiều",  de: "viel",     pack: 9, pron: "nyew" },
    { id: "w090", vn: "ít",     de: "wenig",    pack: 9, pron: "it" },

    // Paket 10 – Fragen & Antworten
    { id: "w091", vn: "gì",           de: "was",           pack: 10, pron: "si" },
    { id: "w092", vn: "ai",           de: "wer",           pack: 10, pron: "ai" },
    { id: "w093", vn: "đâu",          de: "wo",            pack: 10, pron: "dow" },
    { id: "w094", vn: "khi nào",      de: "wann",          pack: 10, pron: "ki nau" },
    { id: "w095", vn: "tại sao",      de: "warum",         pack: 10, pron: "tai sau" },
    { id: "w096", vn: "thế nào",      de: "wie",           pack: 10, pron: "te nau" },
    { id: "w097", vn: "bao nhiêu",    de: "wie viel",      pack: 10, pron: "bau nyew" },
    { id: "w098", vn: "có",           de: "ja, es gibt",   pack: 10, pron: "ko" },
    { id: "w099", vn: "phải",         de: "richtig",       pack: 10, pron: "fai" },
    { id: "w100", vn: "chắc chắn",    de: "sicher",        pack: 10, pron: "tschak tschan" }
  ],

  // Nachschlage-Helfer (einzige "Logik" hier, weil rein datennah).
  wordById: function (id) {
    for (var i = 0; i < this.words.length; i++) if (this.words[i].id === id) return this.words[i];
    return null;
  },
  wordsOfPack: function (packId) {
    return this.words.filter(function (w) { return w.pack === packId; });
  }
};
