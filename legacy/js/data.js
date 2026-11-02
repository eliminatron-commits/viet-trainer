var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.DATA – Statischer Wortschatz (reine Daten, keine Logik).
 *
 * 250 Wörter in 25 Paketen à 10. Auswahl frequenzbasiert (Korpus: gesprochene
 * Sprache / OpenSubtitles-Frequenzliste), gefiltert auf als Einzelvokabel
 * lernbare Alltagswörter mit Verben-Übergewicht (~90 Verben). Reine Grammatik-
 * partikel (đã, sẽ, thì, mà, của, và …) sind bewusst ausgelassen.
 * Wenige mit ° markierte Alltagswörter (Essen, Körper, Natur, Dinge) sind
 * ergänzt, weil der Film-Korpus sie unterrepräsentiert.
 *
 * Datenmodell Wort: { id, vn, de, pron, pack }
 *   - id:   "w001".."w250", zugleich Audio-Dateiname (audio/<id>.mp3) und
 *           Fortschritts-Schlüssel. Bewusst nicht das VN-Wort (Diakritika in
 *           Dateinamen sind fehleranfällig).
 *   - vn:   Vietnamesisch mit Diakritika (Anzeige, TTS, Quiz-Lösung).
 *   - de:   deutsche Übersetzung.
 *   - pron: vereinfachte Aussprachehilfe (nördliche/Standard-Aussprache,
 *           passend zur Stimme vi-VN-NamMinh).
 *   - pack: Paket-Id 1..25.
 *
 * Datenmodell Paket: { id, name, icon } – id bestimmt die Freischalt-Reihenfolge.
 * ============================================================================= */
VT.DATA = {
  packs: [
    { id: 1,  name: "Ich, du & wer",       icon: "👤" },
    { id: 2,  name: "Wichtigste Verben",   icon: "⭐" },
    { id: 3,  name: "Familie",             icon: "👪" },
    { id: 4,  name: "Fragen & Antworten",  icon: "❓" },
    { id: 5,  name: "Bewegung",            icon: "🚶" },
    { id: 6,  name: "Essen & Tun",         icon: "🍜" },
    { id: 7,  name: "Höflichkeit",         icon: "🙏" },
    { id: 8,  name: "Zeit",                icon: "🕐" },
    { id: 9,  name: "Denken & Fühlen",     icon: "💭" },
    { id: 10, name: "Kommunikation",       icon: "💬" },
    { id: 11, name: "Eigenschaften I",     icon: "✨" },
    { id: 12, name: "Mengen & Grade",      icon: "📊" },
    { id: 13, name: "Zahlen",              icon: "🔢" },
    { id: 14, name: "Nehmen & Geben",      icon: "🤲" },
    { id: 15, name: "Körper",              icon: "🧍" },
    { id: 16, name: "Orte & Richtung",     icon: "📍" },
    { id: 17, name: "Handeln",             icon: "🏃" },
    { id: 18, name: "Eigenschaften II",    icon: "🌡️" },
    { id: 19, name: "Alltag & Dinge",      icon: "🛍️" },
    { id: 20, name: "Sprache & Ausdruck",  icon: "🗣️" },
    { id: 21, name: "Verbindungen",        icon: "🔗" },
    { id: 22, name: "Zustände",            icon: "🌱" },
    { id: 23, name: "Essen & Trinken",     icon: "🍲" },
    { id: 24, name: "Natur & Tiere",       icon: "🌳" },
    { id: 25, name: "Dinge & Orte",        icon: "🏠" }
  ],

  words: [
    // Paket 1 – Ich, du & wer
    { id: "w001", vn: "tôi",    de: "ich",                  pack: 1, pron: "toy" },
    { id: "w002", vn: "bạn",    de: "du / Freund",          pack: 1, pron: "ban" },
    { id: "w003", vn: "anh",    de: "du (älterer Mann)",    pack: 1, pron: "an" },
    { id: "w004", vn: "chị",    de: "du (ältere Frau)",     pack: 1, pron: "tschi" },
    { id: "w005", vn: "em",     de: "du (jünger)",          pack: 1, pron: "em" },
    { id: "w006", vn: "ông",    de: "Herr / Großvater",     pack: 1, pron: "ong" },
    { id: "w007", vn: "bà",     de: "Frau / Großmutter",    pack: 1, pron: "ba" },
    { id: "w008", vn: "cô",     de: "Tante / junge Frau",   pack: 1, pron: "ko" },
    { id: "w009", vn: "chú",    de: "Onkel",                pack: 1, pron: "tschu" },
    { id: "w010", vn: "người",  de: "Mensch / Person",      pack: 1, pron: "nguh-i" },

    // Paket 2 – Wichtigste Verben
    { id: "w011", vn: "là",     de: "sein / ist",           pack: 2, pron: "la" },
    { id: "w012", vn: "có",     de: "haben / es gibt",      pack: 2, pron: "ko" },
    { id: "w013", vn: "đi",     de: "gehen",                pack: 2, pron: "di" },
    { id: "w014", vn: "được",   de: "können / okay",        pack: 2, pron: "duhk" },
    { id: "w015", vn: "làm",    de: "machen / tun",         pack: 2, pron: "lam" },
    { id: "w016", vn: "muốn",   de: "wollen",               pack: 2, pron: "muhn" },
    { id: "w017", vn: "biết",   de: "wissen / kennen",      pack: 2, pron: "bjet" },
    { id: "w018", vn: "nói",    de: "sprechen / sagen",     pack: 2, pron: "noi" },
    { id: "w019", vn: "thấy",   de: "sehen / bemerken",     pack: 2, pron: "tay" },
    { id: "w020", vn: "nghe",   de: "hören",                pack: 2, pron: "nge" },

    // Paket 3 – Familie
    { id: "w021", vn: "mẹ",       de: "Mutter",             pack: 3, pron: "me" },
    { id: "w022", vn: "bố",       de: "Vater",              pack: 3, pron: "bo" },
    { id: "w023", vn: "con",      de: "Kind",               pack: 3, pron: "kon" },
    { id: "w024", vn: "vợ",       de: "Ehefrau",            pack: 3, pron: "vuh" },
    { id: "w025", vn: "chồng",    de: "Ehemann",            pack: 3, pron: "tschong" },
    { id: "w026", vn: "cháu",     de: "Enkel / Nichte",     pack: 3, pron: "tschau" },
    { id: "w027", vn: "bé",       de: "Baby / klein",       pack: 3, pron: "be" },
    { id: "w028", vn: "cậu",      de: "du (Freund) / Onkel", pack: 3, pron: "kau" },
    { id: "w029", vn: "gia đình", de: "Familie",            pack: 3, pron: "za ding" },
    { id: "w030", vn: "nhà",      de: "Haus / Zuhause",     pack: 3, pron: "nja" },

    // Paket 4 – Fragen & Antworten
    { id: "w031", vn: "gì",         de: "was",              pack: 4, pron: "si" },
    { id: "w032", vn: "sao",        de: "warum / wie",      pack: 4, pron: "sau" },
    { id: "w033", vn: "đâu",        de: "wo",               pack: 4, pron: "dow" },
    { id: "w034", vn: "nào",        de: "welche(r)",        pack: 4, pron: "nau" },
    { id: "w035", vn: "bao nhiêu",  de: "wie viel",         pack: 4, pron: "bau nyew" },
    { id: "w036", vn: "không",      de: "nein / nicht",     pack: 4, pron: "khong" },
    { id: "w037", vn: "vâng",       de: "ja (höflich)",     pack: 4, pron: "vuhng" },
    { id: "w038", vn: "dạ",         de: "ja (respektvoll)", pack: 4, pron: "ya" },
    { id: "w039", vn: "ừ",          de: "ja (informell)",   pack: 4, pron: "uh" },
    { id: "w040", vn: "phải",       de: "müssen / richtig", pack: 4, pron: "fai" },

    // Paket 5 – Bewegung (Verben)
    { id: "w041", vn: "đến",    de: "kommen / ankommen",    pack: 5, pron: "den" },
    { id: "w042", vn: "về",     de: "zurückkehren",         pack: 5, pron: "ve" },
    { id: "w043", vn: "ra",     de: "hinausgehen",          pack: 5, pron: "za" },
    { id: "w044", vn: "vào",    de: "hineingehen",          pack: 5, pron: "vau" },
    { id: "w045", vn: "lên",    de: "hinaufgehen",          pack: 5, pron: "len" },
    { id: "w046", vn: "xuống",  de: "hinuntergehen",        pack: 5, pron: "suong" },
    { id: "w047", vn: "chạy",   de: "rennen / laufen",      pack: 5, pron: "tschai" },
    { id: "w048", vn: "đứng",   de: "stehen",               pack: 5, pron: "dung" },
    { id: "w049", vn: "ngồi",   de: "sitzen",               pack: 5, pron: "ngoi" },
    { id: "w050", vn: "ngủ",    de: "schlafen",             pack: 5, pron: "ngu" },

    // Paket 6 – Essen & Tun
    { id: "w051", vn: "ăn",       de: "essen",              pack: 6, pron: "an" },
    { id: "w052", vn: "uống",     de: "trinken",            pack: 6, pron: "uong" },
    { id: "w053", vn: "cơm",      de: "Reis / Mahlzeit",    pack: 6, pron: "kuhm" },
    { id: "w054", vn: "nước",     de: "Wasser / Land",      pack: 6, pron: "nuhk" },
    { id: "w055", vn: "mua",      de: "kaufen",             pack: 6, pron: "mua" },
    { id: "w056", vn: "bán",      de: "verkaufen",          pack: 6, pron: "ban" },
    { id: "w057", vn: "chơi",     de: "spielen",            pack: 6, pron: "tschuhi" },
    { id: "w058", vn: "học",      de: "lernen / studieren", pack: 6, pron: "hok" },
    { id: "w059", vn: "dùng",     de: "benutzen",           pack: 6, pron: "zung" },
    { id: "w060", vn: "làm việc", de: "arbeiten",           pack: 6, pron: "lam viek" },

    // Paket 7 – Höflichkeit & Begegnung
    { id: "w061", vn: "chào",     de: "grüßen / hallo",     pack: 7, pron: "tschau" },
    { id: "w062", vn: "cảm ơn",   de: "danke",              pack: 7, pron: "kam uhn" },
    { id: "w063", vn: "xin lỗi",  de: "Entschuldigung",     pack: 7, pron: "sin loy" },
    { id: "w064", vn: "xin",      de: "bitte / erbitten",   pack: 7, pron: "sin" },
    { id: "w065", vn: "đừng",     de: "nicht (Aufforderung)", pack: 7, pron: "dung" },
    { id: "w066", vn: "thôi",     de: "genug / schon gut",  pack: 7, pron: "toy" },
    { id: "w067", vn: "tạm biệt", de: "auf Wiedersehen",    pack: 7, pron: "tam bjet" },
    { id: "w068", vn: "giúp",     de: "helfen",             pack: 7, pron: "zup" },
    { id: "w069", vn: "cần",      de: "brauchen",           pack: 7, pron: "kan" },
    { id: "w070", vn: "ơi",       de: "he! (rufen)",        pack: 7, pron: "uh-i" },

    // Paket 8 – Zeit
    { id: "w071", vn: "giờ",       de: "Uhr / Stunde",      pack: 8, pron: "zuh" },
    { id: "w072", vn: "ngày",      de: "Tag",               pack: 8, pron: "ngai" },
    { id: "w073", vn: "tháng",     de: "Monat",             pack: 8, pron: "tang" },
    { id: "w074", vn: "tuần",      de: "Woche",             pack: 8, pron: "tuan" },
    { id: "w075", vn: "bây giờ",   de: "jetzt",             pack: 8, pron: "bay zuh" },
    { id: "w076", vn: "hôm nay",   de: "heute",             pack: 8, pron: "hom nai" },
    { id: "w077", vn: "hôm qua",   de: "gestern",           pack: 8, pron: "hom kwa" },
    { id: "w078", vn: "ngày mai",  de: "morgen",            pack: 8, pron: "ngai mai" },
    { id: "w079", vn: "sáng",      de: "Morgen / früh",     pack: 8, pron: "sang" },
    { id: "w080", vn: "tối",       de: "Abend / dunkel",    pack: 8, pron: "toy" },

    // Paket 9 – Denken & Fühlen (Verben)
    { id: "w081", vn: "nghĩ",   de: "denken",               pack: 9, pron: "ngi" },
    { id: "w082", vn: "hiểu",   de: "verstehen",            pack: 9, pron: "hjew" },
    { id: "w083", vn: "tin",    de: "glauben / vertrauen",  pack: 9, pron: "tin" },
    { id: "w084", vn: "nhớ",    de: "erinnern / vermissen", pack: 9, pron: "nyuh" },
    { id: "w085", vn: "thích",  de: "mögen",                pack: 9, pron: "tik" },
    { id: "w086", vn: "yêu",    de: "lieben",               pack: 9, pron: "iew" },
    { id: "w087", vn: "thương", de: "lieb haben",           pack: 9, pron: "tuhng" },
    { id: "w088", vn: "sợ",     de: "Angst haben",          pack: 9, pron: "suh" },
    { id: "w089", vn: "lo",     de: "sich sorgen",          pack: 9, pron: "lo" },
    { id: "w090", vn: "mong",   de: "hoffen / erwarten",    pack: 9, pron: "mong" },

    // Paket 10 – Kommunikation (Verben)
    { id: "w091", vn: "gặp",     de: "treffen",             pack: 10, pron: "gap" },
    { id: "w092", vn: "gọi",     de: "rufen / anrufen",     pack: 10, pron: "goi" },
    { id: "w093", vn: "hỏi",     de: "fragen",              pack: 10, pron: "hoi" },
    { id: "w094", vn: "trả lời", de: "antworten",           pack: 10, pron: "tscha luh-i" },
    { id: "w095", vn: "bảo",     de: "sagen / anweisen",    pack: 10, pron: "bau" },
    { id: "w096", vn: "kể",      de: "erzählen",            pack: 10, pron: "ke" },
    { id: "w097", vn: "tìm",     de: "suchen",              pack: 10, pron: "tim" },
    { id: "w098", vn: "xem",     de: "schauen / ansehen",   pack: 10, pron: "sem" },
    { id: "w099", vn: "nhìn",    de: "blicken",             pack: 10, pron: "nyin" },
    { id: "w100", vn: "đọc",     de: "lesen",               pack: 10, pron: "dok" },

    // Paket 11 – Eigenschaften I
    { id: "w101", vn: "tốt",   de: "gut",                   pack: 11, pron: "tot" },
    { id: "w102", vn: "xấu",   de: "schlecht / hässlich",   pack: 11, pron: "sau" },
    { id: "w103", vn: "lớn",   de: "groß",                  pack: 11, pron: "luhn" },
    { id: "w104", vn: "nhỏ",   de: "klein",                 pack: 11, pron: "nyo" },
    { id: "w105", vn: "mới",   de: "neu / gerade",          pack: 11, pron: "muh-i" },
    { id: "w106", vn: "cũ",    de: "alt (Dinge)",           pack: 11, pron: "ku" },
    { id: "w107", vn: "đẹp",   de: "schön",                 pack: 11, pron: "dep" },
    { id: "w108", vn: "cao",   de: "hoch / groß",           pack: 11, pron: "kau" },
    { id: "w109", vn: "nhanh", de: "schnell",               pack: 11, pron: "njanj" },
    { id: "w110", vn: "chậm",  de: "langsam",               pack: 11, pron: "tscham" },

    // Paket 12 – Mengen & Grade
    { id: "w111", vn: "rất",   de: "sehr",                  pack: 12, pron: "zat" },
    { id: "w112", vn: "quá",   de: "zu / allzu",            pack: 12, pron: "kwa" },
    { id: "w113", vn: "nhiều", de: "viel",                  pack: 12, pron: "nyew" },
    { id: "w114", vn: "ít",    de: "wenig",                 pack: 12, pron: "it" },
    { id: "w115", vn: "nhất",  de: "am meisten / -ste",     pack: 12, pron: "nyat" },
    { id: "w116", vn: "hơn",   de: "mehr / -er",            pack: 12, pron: "huhn" },
    { id: "w117", vn: "lắm",   de: "total / ganz schön",    pack: 12, pron: "lam" },
    { id: "w118", vn: "chỉ",   de: "nur",                   pack: 12, pron: "tschi" },
    { id: "w119", vn: "cũng",  de: "auch",                  pack: 12, pron: "kung" },
    { id: "w120", vn: "nữa",   de: "noch (mehr)",           pack: 12, pron: "nuh-a" },

    // Paket 13 – Zahlen
    { id: "w121", vn: "một",  de: "eins",                   pack: 13, pron: "mot" },
    { id: "w122", vn: "hai",  de: "zwei",                   pack: 13, pron: "hai" },
    { id: "w123", vn: "ba",   de: "drei",                   pack: 13, pron: "ba" },
    { id: "w124", vn: "bốn",  de: "vier",                   pack: 13, pron: "bon" },
    { id: "w125", vn: "năm",  de: "fünf / Jahr",            pack: 13, pron: "nam" },
    { id: "w126", vn: "sáu",  de: "sechs",                  pack: 13, pron: "sau" },
    { id: "w127", vn: "bảy",  de: "sieben",                 pack: 13, pron: "bay" },
    { id: "w128", vn: "tám",  de: "acht",                   pack: 13, pron: "tam" },
    { id: "w129", vn: "chín", de: "neun",                   pack: 13, pron: "tschin" },
    { id: "w130", vn: "mười", de: "zehn",                   pack: 13, pron: "muh-i" },

    // Paket 14 – Nehmen & Geben (Verben)
    { id: "w131", vn: "lấy",   de: "nehmen / holen",        pack: 14, pron: "lay" },
    { id: "w132", vn: "đưa",   de: "geben / reichen",       pack: 14, pron: "duh-a" },
    { id: "w133", vn: "nhận",  de: "erhalten / annehmen",   pack: 14, pron: "nyan" },
    { id: "w134", vn: "mất",   de: "verlieren",             pack: 14, pron: "mat" },
    { id: "w135", vn: "bỏ",    de: "weglassen / aufgeben",  pack: 14, pron: "bo" },
    { id: "w136", vn: "giữ",   de: "behalten / halten",     pack: 14, pron: "zuh" },
    { id: "w137", vn: "mở",    de: "öffnen",                pack: 14, pron: "muh" },
    { id: "w138", vn: "đóng",  de: "schließen",             pack: 14, pron: "dong" },
    { id: "w139", vn: "bắt",   de: "fangen / zwingen",      pack: 14, pron: "bat" },
    { id: "w140", vn: "trả",   de: "zurückgeben / zahlen",  pack: 14, pron: "tscha" },

    // Paket 15 – Körper
    { id: "w141", vn: "đầu",    de: "Kopf",                 pack: 15, pron: "dow" },
    { id: "w142", vn: "mắt",    de: "Auge",                 pack: 15, pron: "mat" },
    { id: "w143", vn: "tay",    de: "Hand / Arm",           pack: 15, pron: "tai" },
    { id: "w144", vn: "chân",   de: "Bein / Fuß",           pack: 15, pron: "tschan" },
    { id: "w145", vn: "mặt",    de: "Gesicht",              pack: 15, pron: "mat" },
    { id: "w146", vn: "tai",    de: "Ohr",                  pack: 15, pron: "tai" },
    { id: "w147", vn: "miệng",  de: "Mund",                 pack: 15, pron: "mieng" },
    { id: "w148", vn: "tóc",    de: "Haar",                 pack: 15, pron: "tok" },
    { id: "w149", vn: "bụng",   de: "Bauch",                pack: 15, pron: "bung" },
    { id: "w150", vn: "tim",    de: "Herz",                 pack: 15, pron: "tim" },

    // Paket 16 – Orte & Richtung
    { id: "w151", vn: "đây",   de: "hier",                  pack: 16, pron: "day" },
    { id: "w152", vn: "đó",    de: "dort / das",            pack: 16, pron: "do" },
    { id: "w153", vn: "này",   de: "dies(er)",              pack: 16, pron: "nai" },
    { id: "w154", vn: "kia",   de: "dort / jener",          pack: 16, pron: "kia" },
    { id: "w155", vn: "trong", de: "in / drinnen",          pack: 16, pron: "tschong" },
    { id: "w156", vn: "ngoài", de: "draußen",               pack: 16, pron: "ngoai" },
    { id: "w157", vn: "trên",  de: "oben / auf",            pack: 16, pron: "tschen" },
    { id: "w158", vn: "dưới",  de: "unten / unter",         pack: 16, pron: "zuh-i" },
    { id: "w159", vn: "gần",   de: "nah",                   pack: 16, pron: "gan" },
    { id: "w160", vn: "xa",    de: "weit",                  pack: 16, pron: "sa" },

    // Paket 17 – Handeln II (Verben)
    { id: "w161", vn: "cố",     de: "sich bemühen",         pack: 17, pron: "ko" },
    { id: "w162", vn: "cứu",    de: "retten",               pack: 17, pron: "kuw" },
    { id: "w163", vn: "chờ",    de: "warten",               pack: 17, pron: "tschuh" },
    { id: "w164", vn: "theo",   de: "folgen / gemäß",       pack: 17, pron: "teo" },
    { id: "w165", vn: "qua",    de: "vorbeigehen / vorbei", pack: 17, pron: "kwa" },
    { id: "w166", vn: "quay",   de: "sich drehen / umkehren", pack: 17, pron: "kwai" },
    { id: "w167", vn: "đánh",   de: "schlagen",             pack: 17, pron: "danj" },
    { id: "w168", vn: "thành",  de: "werden / zu",          pack: 17, pron: "tanj" },
    { id: "w169", vn: "trở",    de: "zurückkehren / werden", pack: 17, pron: "tschuh" },
    { id: "w170", vn: "giống",  de: "ähneln / gleichen",    pack: 17, pron: "zong" },

    // Paket 18 – Eigenschaften II
    { id: "w171", vn: "vui",   de: "fröhlich",              pack: 18, pron: "vui" },
    { id: "w172", vn: "buồn",  de: "traurig",               pack: 18, pron: "buon" },
    { id: "w173", vn: "dễ",    de: "leicht / einfach",      pack: 18, pron: "ze" },
    { id: "w174", vn: "khó",   de: "schwer / schwierig",    pack: 18, pron: "kho" },
    { id: "w175", vn: "đúng",  de: "richtig",               pack: 18, pron: "dung" },
    { id: "w176", vn: "sai",   de: "falsch",                pack: 18, pron: "sai" },
    { id: "w177", vn: "nóng",  de: "heiß",                  pack: 18, pron: "nong" },
    { id: "w178", vn: "lạnh",  de: "kalt",                  pack: 18, pron: "lanj" },
    { id: "w179", vn: "mệt",   de: "müde",                  pack: 18, pron: "met" },
    { id: "w180", vn: "khỏe",  de: "gesund / stark",        pack: 18, pron: "khwe" },

    // Paket 19 – Alltag & Dinge
    { id: "w181", vn: "tiền",    de: "Geld",                pack: 19, pron: "tien" },
    { id: "w182", vn: "xe",      de: "Fahrzeug / Motorrad", pack: 19, pron: "se" },
    { id: "w183", vn: "đường",   de: "Straße / Weg",        pack: 19, pron: "duhng" },
    { id: "w184", vn: "việc",    de: "Arbeit / Sache",      pack: 19, pron: "viek" },
    { id: "w185", vn: "chuyện",  de: "Angelegenheit",       pack: 19, pron: "tschuyen" },
    { id: "w186", vn: "đồ",      de: "Ding / Sachen",       pack: 19, pron: "do" },
    { id: "w187", vn: "cửa",     de: "Tür",                 pack: 19, pron: "kuh-a" },
    { id: "w188", vn: "phòng",   de: "Zimmer",              pack: 19, pron: "fong" },
    { id: "w189", vn: "máy",     de: "Maschine / Gerät",    pack: 19, pron: "mai" },
    { id: "w190", vn: "số",      de: "Zahl / Nummer",       pack: 19, pron: "so" },

    // Paket 20 – Sprache & Ausdruck
    { id: "w191", vn: "tên",    de: "Name",                 pack: 20, pron: "ten" },
    { id: "w192", vn: "lời",    de: "Wort / Rede",          pack: 20, pron: "luh-i" },
    { id: "w193", vn: "câu",    de: "Satz",                 pack: 20, pron: "kau" },
    { id: "w194", vn: "tiếng",  de: "Sprache / Laut",       pack: 20, pron: "tieng" },
    { id: "w195", vn: "chữ",    de: "Buchstabe / Schrift",  pack: 20, pron: "tschuh" },
    { id: "w196", vn: "sách",   de: "Buch",                 pack: 20, pron: "sak" },
    { id: "w197", vn: "hát",    de: "singen",               pack: 20, pron: "hat" },
    { id: "w198", vn: "cười",   de: "lachen / lächeln",     pack: 20, pron: "kuh-i" },
    { id: "w199", vn: "khóc",   de: "weinen",               pack: 20, pron: "khok" },
    { id: "w200", vn: "kêu",    de: "rufen / schreien",     pack: 20, pron: "kew" },

    // Paket 21 – Verbindungen & Adverbien
    { id: "w201", vn: "với",   de: "mit",                   pack: 21, pron: "vuh-i" },
    { id: "w202", vn: "cho",   de: "für / geben",           pack: 21, pron: "tscho" },
    { id: "w203", vn: "như",   de: "wie / so wie",          pack: 21, pron: "nyu" },
    { id: "w204", vn: "luôn",  de: "immer / gleich",        pack: 21, pron: "luon" },
    { id: "w205", vn: "ngay",  de: "sofort / gleich",       pack: 21, pron: "ngai" },
    { id: "w206", vn: "vẫn",   de: "noch immer",            pack: 21, pron: "van" },
    { id: "w207", vn: "thật",  de: "wirklich / echt",       pack: 21, pron: "tat" },
    { id: "w208", vn: "chắc",  de: "sicher / wohl",         pack: 21, pron: "tschak" },
    { id: "w209", vn: "hay",   de: "oder / gut",            pack: 21, pron: "hai" },
    { id: "w210", vn: "lại",   de: "wieder / erneut",       pack: 21, pron: "lai" },

    // Paket 22 – Zustände (Verben)
    { id: "w211", vn: "sống",     de: "leben",              pack: 22, pron: "song" },
    { id: "w212", vn: "chết",     de: "sterben",            pack: 22, pron: "tschet" },
    { id: "w213", vn: "ở",        de: "sein / wohnen",      pack: 22, pron: "uh" },
    { id: "w214", vn: "còn",      de: "noch (da) / übrig",  pack: 22, pron: "kon" },
    { id: "w215", vn: "hết",      de: "aufgebraucht / Ende", pack: 22, pron: "het" },
    { id: "w216", vn: "xong",     de: "fertig / erledigt",  pack: 22, pron: "song" },
    { id: "w217", vn: "bắt đầu",  de: "anfangen",           pack: 22, pron: "bat dow" },
    { id: "w218", vn: "nghỉ",     de: "ausruhen / Pause",   pack: 22, pron: "ngi" },
    { id: "w219", vn: "quen",     de: "gewohnt / vertraut", pack: 22, pron: "kwen" },
    { id: "w220", vn: "gửi",      de: "senden / schicken",  pack: 22, pron: "guh-i" },

    // Paket 23 – Essen & Trinken
    { id: "w221", vn: "bánh",   de: "Kuchen / Gebäck",      pack: 23, pron: "banj" },
    { id: "w222", vn: "thịt",   de: "Fleisch",              pack: 23, pron: "tit" },
    { id: "w223", vn: "cá",     de: "Fisch",                pack: 23, pron: "ka" },
    { id: "w224", vn: "rau",    de: "Gemüse",               pack: 23, pron: "zau" },
    { id: "w225", vn: "trứng",  de: "Ei",                   pack: 23, pron: "tschung" },
    { id: "w226", vn: "sữa",    de: "Milch",                pack: 23, pron: "süh-a" },
    { id: "w227", vn: "cà phê", de: "Kaffee",               pack: 23, pron: "ka fe" },
    { id: "w228", vn: "trà",    de: "Tee",                  pack: 23, pron: "tscha" },
    { id: "w229", vn: "muối",   de: "Salz",                 pack: 23, pron: "muoi" },
    { id: "w230", vn: "đói",    de: "hungrig",              pack: 23, pron: "doi" },

    // Paket 24 – Natur & Tiere
    { id: "w231", vn: "trời",  de: "Himmel / Wetter",       pack: 24, pron: "tschuh-i" },
    { id: "w232", vn: "mưa",   de: "Regen",                 pack: 24, pron: "muh-a" },
    { id: "w233", vn: "nắng",  de: "Sonnenschein",          pack: 24, pron: "nang" },
    { id: "w234", vn: "gió",   de: "Wind",                  pack: 24, pron: "zo" },
    { id: "w235", vn: "cây",   de: "Baum / Pflanze",        pack: 24, pron: "kai" },
    { id: "w236", vn: "hoa",   de: "Blume",                 pack: 24, pron: "hwa" },
    { id: "w237", vn: "chó",   de: "Hund",                  pack: 24, pron: "tscho" },
    { id: "w238", vn: "mèo",   de: "Katze",                 pack: 24, pron: "meo" },
    { id: "w239", vn: "chim",  de: "Vogel",                 pack: 24, pron: "tschim" },
    { id: "w240", vn: "biển",  de: "Meer",                  pack: 24, pron: "bien" },

    // Paket 25 – Dinge & Orte
    { id: "w241", vn: "quần áo",     de: "Kleidung",        pack: 25, pron: "kwan ao" },
    { id: "w242", vn: "giày",        de: "Schuhe",          pack: 25, pron: "zai" },
    { id: "w243", vn: "điện thoại",  de: "Handy / Telefon", pack: 25, pron: "dien twai" },
    { id: "w244", vn: "bàn",         de: "Tisch",           pack: 25, pron: "ban" },
    { id: "w245", vn: "ghế",         de: "Stuhl",           pack: 25, pron: "ge" },
    { id: "w246", vn: "giường",      de: "Bett",            pack: 25, pron: "zuhng" },
    { id: "w247", vn: "chợ",         de: "Markt",           pack: 25, pron: "tschuh" },
    { id: "w248", vn: "trường",      de: "Schule",          pack: 25, pron: "tschuhng" },
    { id: "w249", vn: "bệnh viện",   de: "Krankenhaus",     pack: 25, pron: "benj vien" },
    { id: "w250", vn: "thành phố",   de: "Stadt",           pack: 25, pron: "tanj fo" }
  ],

  wordById: function (id) {
    for (var i = 0; i < this.words.length; i++) if (this.words[i].id === id) return this.words[i];
    return null;
  },
  wordsOfPack: function (packId) {
    return this.words.filter(function (w) { return w.pack === packId; });
  },

  // Verben (für den Verb-Filter im Wiederholungsmodus). Vietnamesische Adjektive
  // („Eigenschaften": schön, groß, müde …) zählen hier bewusst NICHT als Verben,
  // obwohl sie grammatisch stativ sind – der Nutzer trennt Verben von Eigenschaften.
  // Klassifizierung KI-erstellt → von Muttersprachlerin prüfbar; IDs unten anpassen.
  _verbNums: [
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,             // Paket 2 – Kernverben
    40,                                                  // phải (müssen)
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50,             // Paket 5 – Bewegung
    51, 52, 55, 56, 57, 58, 59, 60,                     // Paket 6 – Essen & Tun (ohne cơm/nước)
    61, 64, 68, 69,                                      // chào / xin / giúp / cần
    81, 82, 83, 84, 85, 86, 87, 88, 89, 90,             // Paket 9 – Denken & Fühlen
    91, 92, 93, 94, 95, 96, 97, 98, 99, 100,            // Paket 10 – Kommunikation
    131, 132, 133, 134, 135, 136, 137, 138, 139, 140,   // Paket 14 – Nehmen & Geben
    161, 162, 163, 164, 165, 166, 167, 168, 169, 170,   // Paket 17 – Handeln II
    197, 198, 199, 200,                                  // hát / cười / khóc / kêu
    211, 212, 213, 214, 215, 216, 217, 218, 219, 220    // Paket 22 – Zustände
  ],
  isVerb: function (id) {
    if (!this._verbSet) {
      this._verbSet = {};
      var set = this._verbSet;
      this._verbNums.forEach(function (n) {
        set["w" + (n < 10 ? "00" + n : n < 100 ? "0" + n : n)] = true;
      });
    }
    return this._verbSet[id] === true;
  }
};
