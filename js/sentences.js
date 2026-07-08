var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.SENTENCES – Statische Satz-Sammlung für den Reiter „Sätze" (reine Daten).
 *
 * Datenmodell Satz: { id, vn, de, words, ctx? }
 *   - id:    "s001".. – zugleich Audio-Dateiname (audio/<id>.mp3).
 *   - vn:    vietnamesischer Satz (Anzeige, TTS, Quiz-Lösung).
 *   - de:    deutsche Übersetzung.
 *   - words: Vokabel-IDs (w0xx aus VT.DATA), die im Satz vorkommen. Steuern die
 *            FREIGABE: ein Satz erscheint erst, wenn ALLE diese Wörter im Reiter
 *            „Lernen" schon gesehen wurden (seen>0). Reine Füll-/Verbindungswörter,
 *            die NICHT im Wortschatz stehen (của, cái, rồi, ạ, nhé, à, thế, vậy …),
 *            gehören NICHT in `words` und blockieren nie.
 *   - ctx:   OPTIONAL – sozialer Kontext, der bestimmt, WELCHE Pronomen für „ich"
 *            und „du" gelten (Vietnamesisch ist relational). Schlüssel aus
 *            VT.SENTENCES.contexts; fehlt das Feld, ist es ein neutraler Satz
 *            ohne Ich/Du (Wetter, Beschreibungen …) und bekommt kein Chip.
 *
 * WICHTIG zur Natürlichkeit: KEIN generisches „tôi" für Alltagsgespräche mit
 * Bekannten – echte Sprecher nutzen Beziehungspronomen (em/anh/chị/con/bố/mẹ).
 * „tôi" bleibt nur im Kontext `formal` (Fremde, Vorstellen, Bestellen), wo es
 * tatsächlich gesprochen wird. Sätze sind KI-getextet → Muttersprachlerin prüft;
 * Korrekturen über scripts/generate_audio_eleven.py --source js/sentences.js --only sXXX.
 * ============================================================================= */
VT.SENTENCES = {
  // Soziale Kontexte: legen die Perspektive (ich/du) fest und liefern das
  // sichtbare Label. icon+label werden als Chip im Reiter „Sätze" angezeigt.
  contexts: {
    emAnh:     { icon: "👨", label: "zu älterem Mann" },   // ich = em, du = anh
    emChi:     { icon: "👩", label: "zu älterer Frau" },    // ich = em, du = chị
    anhEm:     { icon: "🧑", label: "zu jüngerer Person" }, // ich = anh, du = em
    conParent: { icon: "👪", label: "zu den Eltern" },      // ich = con, du = bố/mẹ
    formal:    { icon: "🤝", label: "förmlich · fremd" }    // ich = tôi (Fremde/Bestellen)
  },

  sentences: [
    // — Grundlagen (Pronomen + Kernverben, Pakete 1–2) —
    { id: "s001", vn: "Tôi là người Việt.",   de: "Ich bin Vietnamese.",        words: ["w001", "w011", "w010"], ctx: "formal" },
    { id: "s002", vn: "Anh là bạn của em.",    de: "Du bist mein Freund.",       words: ["w003", "w002", "w005"], ctx: "emAnh" },
    { id: "s003", vn: "Em biết anh.",          de: "Ich kenne dich.",            words: ["w005", "w017", "w003"], ctx: "emAnh" },
    { id: "s004", vn: "Em thấy anh.",          de: "Ich sehe dich.",             words: ["w005", "w019", "w003"], ctx: "emAnh" },
    { id: "s005", vn: "Em nghe anh.",          de: "Ich höre dir zu.",           words: ["w005", "w020", "w003"], ctx: "emAnh" },
    { id: "s006", vn: "Em muốn đi.",           de: "Ich möchte gehen.",          words: ["w005", "w016", "w013"], ctx: "emAnh" },
    { id: "s007", vn: "Em muốn nói.",          de: "Ich möchte sprechen.",       words: ["w005", "w016", "w018"], ctx: "emAnh" },
    { id: "s008", vn: "Em đi làm.",            de: "Ich gehe arbeiten.",         words: ["w005", "w013", "w015"], ctx: "emAnh" },
    { id: "s009", vn: "Anh làm được.",         de: "Du schaffst das.",           words: ["w003", "w015", "w014"], ctx: "emAnh" },
    { id: "s010", vn: "Em muốn làm gì?",       de: "Was möchtest du machen?",    words: ["w005", "w016", "w015", "w031"], ctx: "anhEm" },

    // — Familie & Zuhause (Paket 3) —
    { id: "s011", vn: "Đây là gia đình của em.", de: "Das ist meine Familie.",   words: ["w151", "w011", "w029", "w005"], ctx: "emAnh" },
    { id: "s012", vn: "Mẹ em ở nhà.",          de: "Meine Mutter ist zu Hause.", words: ["w021", "w005", "w213", "w030"], ctx: "emAnh" },
    { id: "s013", vn: "Bố em đi làm.",         de: "Mein Vater geht arbeiten.",  words: ["w022", "w005", "w013", "w015"], ctx: "emAnh" },
    { id: "s014", vn: "Em có hai con.",        de: "Ich habe zwei Kinder.",      words: ["w005", "w012", "w122", "w023"], ctx: "emAnh" },
    { id: "s015", vn: "Vợ em rất đẹp.",        de: "Meine Frau ist sehr schön.", words: ["w024", "w005", "w111", "w107"], ctx: "emAnh" },
    { id: "s016", vn: "Con em ngủ rồi.",       de: "Mein Kind schläft schon.",   words: ["w023", "w005", "w050"], ctx: "emAnh" },
    { id: "s017", vn: "Nhà em ở gần đây.",     de: "Mein Haus ist hier in der Nähe.", words: ["w030", "w005", "w213", "w159", "w151"], ctx: "emAnh" },

    // — Fragen & Antworten (Paket 4) —
    { id: "s018", vn: "Cái này là gì?",        de: "Was ist das?",               words: ["w153", "w011", "w031"] },
    { id: "s019", vn: "Anh đi đâu?",           de: "Wohin gehst du?",            words: ["w003", "w013", "w033"], ctx: "emAnh" },
    { id: "s020", vn: "Anh có khỏe không?",    de: "Geht es dir gut?",           words: ["w003", "w012", "w180", "w036"], ctx: "emAnh" },
    { id: "s021", vn: "Em không biết.",        de: "Ich weiß es nicht.",         words: ["w005", "w036", "w017"], ctx: "emAnh" },
    { id: "s022", vn: "Em không hiểu.",        de: "Ich verstehe nicht.",        words: ["w005", "w036", "w082"], ctx: "emAnh" },
    { id: "s023", vn: "Dạ, đúng rồi.",         de: "Ja, genau.",                 words: ["w038", "w175"] },
    { id: "s024", vn: "Không, cảm ơn.",        de: "Nein, danke.",               words: ["w036", "w062"] },
    { id: "s025", vn: "Anh muốn cái nào?",     de: "Welches möchtest du?",       words: ["w003", "w016", "w034"], ctx: "emAnh" },
    { id: "s026", vn: "Cái này bao nhiêu?",    de: "Wie viel kostet das?",       words: ["w153", "w035"] },
    { id: "s027", vn: "Tại sao chị buồn?",     de: "Warum bist du traurig?",     words: ["w032", "w004", "w172"], ctx: "emChi" },

    // — Bewegung (Paket 5) —
    { id: "s028", vn: "Em về nhà.",            de: "Ich gehe nach Hause.",       words: ["w005", "w042", "w030"], ctx: "emAnh" },
    { id: "s029", vn: "Mời anh vào.",          de: "Bitte komm herein.",         words: ["w003", "w044"], ctx: "emAnh" },
    { id: "s030", vn: "Anh đến đây đi.",       de: "Komm her.",                  words: ["w003", "w041", "w151", "w013"], ctx: "emAnh" },
    { id: "s031", vn: "Con chó chạy nhanh.",   de: "Der Hund läuft schnell.",    words: ["w237", "w047", "w109"] },
    { id: "s032", vn: "Mời bà ngồi.",          de: "Bitte setzen Sie sich.",     words: ["w007", "w049"] },
    { id: "s033", vn: "Em muốn về.",           de: "Ich möchte zurück.",         words: ["w005", "w016", "w042"], ctx: "emAnh" },

    // — Essen & Tun (Paket 6) —
    { id: "s034", vn: "Em muốn ăn cơm.",       de: "Ich möchte Reis essen.",     words: ["w005", "w016", "w051", "w053"], ctx: "emAnh" },
    { id: "s035", vn: "Chị uống nước không?",  de: "Möchtest du Wasser trinken?", words: ["w004", "w052", "w054", "w036"], ctx: "emChi" },
    { id: "s036", vn: "Em đi mua đồ.",         de: "Ich gehe einkaufen.",        words: ["w005", "w013", "w055", "w186"], ctx: "emAnh" },
    { id: "s037", vn: "Em học tiếng Việt.",    de: "Ich lerne Vietnamesisch.",   words: ["w005", "w058", "w194"], ctx: "emAnh" },
    { id: "s038", vn: "Chúng ta đi ăn nhé.",   de: "Lass uns essen gehen.",      words: ["w013", "w051"] },
    { id: "s039", vn: "Em ăn cơm rồi.",        de: "Ich habe schon gegessen.",   words: ["w005", "w051", "w053"], ctx: "emAnh" },

    // — Höflichkeit (Paket 7) —
    { id: "s040", vn: "Chào anh.",             de: "Hallo.",                     words: ["w061", "w003"], ctx: "emAnh" },
    { id: "s041", vn: "Cảm ơn mẹ nhiều.",      de: "Vielen Dank.",               words: ["w062", "w021", "w113"], ctx: "conParent" },
    { id: "s042", vn: "Xin lỗi anh.",          de: "Entschuldige bitte.",        words: ["w063", "w003"], ctx: "emAnh" },
    { id: "s043", vn: "Mẹ giúp con được không?", de: "Kannst du mir helfen?",    words: ["w021", "w068", "w023", "w014", "w036"], ctx: "conParent" },
    { id: "s044", vn: "Đừng lo.",              de: "Mach dir keine Sorgen.",     words: ["w065", "w089"] },
    { id: "s045", vn: "Tạm biệt, hẹn gặp lại.", de: "Auf Wiedersehen, bis bald.", words: ["w067", "w091", "w210"] },
    { id: "s046", vn: "Con cần mẹ giúp.",      de: "Ich brauche deine Hilfe.",   words: ["w023", "w069", "w021", "w068"], ctx: "conParent" },

    // — Zeit (Paket 8) —
    { id: "s047", vn: "Bây giờ em bận.",       de: "Jetzt bin ich beschäftigt.", words: ["w075", "w005"], ctx: "emAnh" },
    { id: "s048", vn: "Hôm nay trời đẹp.",     de: "Heute ist schönes Wetter.",  words: ["w076", "w231", "w107"] },
    { id: "s049", vn: "Ngày mai em đi làm.",   de: "Morgen gehe ich arbeiten.",  words: ["w078", "w005", "w013", "w015"], ctx: "emAnh" },
    { id: "s050", vn: "Hôm qua em ở nhà.",     de: "Gestern war ich zu Hause.",  words: ["w077", "w005", "w213", "w030"], ctx: "emAnh" },
    { id: "s051", vn: "Sáng nay em uống cà phê.", de: "Heute Morgen trinke ich Kaffee.", words: ["w079", "w005", "w052", "w227"], ctx: "emAnh" },
    { id: "s052", vn: "Tối nay anh làm gì?",   de: "Was machst du heute Abend?", words: ["w080", "w003", "w015", "w031"], ctx: "emAnh" },

    // — Denken & Fühlen (Paket 9) —
    { id: "s053", vn: "Anh yêu em.",           de: "Ich liebe dich.",            words: ["w003", "w086", "w005"], ctx: "anhEm" },
    { id: "s054", vn: "Con nhớ mẹ.",           de: "Ich vermisse dich.",         words: ["w023", "w084", "w021"], ctx: "conParent" },
    { id: "s055", vn: "Em thích món này.",     de: "Ich mag dieses Gericht.",    words: ["w005", "w085", "w153"], ctx: "emAnh" },
    { id: "s056", vn: "Em nghĩ anh đúng.",     de: "Ich glaube, du hast recht.", words: ["w005", "w081", "w003", "w175"], ctx: "emAnh" },
    { id: "s057", vn: "Em hiểu rồi.",          de: "Ich verstehe (jetzt).",      words: ["w005", "w082"], ctx: "emAnh" },
    { id: "s058", vn: "Đừng sợ.",              de: "Hab keine Angst.",           words: ["w065", "w088"] },
    { id: "s059", vn: "Em tin anh.",           de: "Ich vertraue dir.",          words: ["w005", "w083", "w003"], ctx: "emAnh" },

    // — Kommunikation (Paket 10) —
    { id: "s060", vn: "Em muốn gặp anh.",      de: "Ich möchte dich treffen.",   words: ["w005", "w016", "w091", "w003"], ctx: "emAnh" },
    { id: "s061", vn: "Gọi cho em nhé.",       de: "Ruf mich an.",               words: ["w092", "w202", "w005"], ctx: "emAnh" },
    { id: "s062", vn: "Cho tôi hỏi một chút.", de: "Darf ich kurz fragen?",      words: ["w202", "w001", "w093", "w121"], ctx: "formal" },
    { id: "s063", vn: "Chị tìm gì?",           de: "Was suchst du?",             words: ["w004", "w097", "w031"], ctx: "emChi" },
    { id: "s064", vn: "Em đọc sách.",          de: "Ich lese ein Buch.",         words: ["w005", "w100", "w196"], ctx: "emAnh" },
    { id: "s065", vn: "Em trả lời đi.",        de: "Antworte bitte.",            words: ["w005", "w094", "w013"], ctx: "anhEm" },

    // — Eigenschaften & Mengen (Pakete 11–12) —
    { id: "s066", vn: "Món này rất ngon.",     de: "Dieses Gericht ist sehr lecker.", words: ["w153", "w111"] },
    { id: "s067", vn: "Nhà anh lớn quá.",      de: "Dein Haus ist sehr groß.",   words: ["w030", "w003", "w103", "w112"], ctx: "emAnh" },
    { id: "s068", vn: "Xe này mới.",           de: "Dieses Motorrad ist neu.",   words: ["w182", "w153", "w105"] },
    { id: "s069", vn: "Em có ít tiền.",        de: "Ich habe wenig Geld.",       words: ["w005", "w012", "w114", "w181"], ctx: "emAnh" },
    { id: "s070", vn: "Cái này tốt hơn.",      de: "Das ist besser.",            words: ["w153", "w101", "w116"] },
    { id: "s071", vn: "Em cũng thích.",        de: "Ich mag es auch.",           words: ["w005", "w119", "w085"], ctx: "emAnh" },
    { id: "s072", vn: "Anh đẹp trai lắm.",     de: "Du siehst sehr gut aus.",    words: ["w003", "w107", "w117"], ctx: "emAnh" },

    // — Zahlen (Paket 13) —
    { id: "s073", vn: "Em có một con mèo.",    de: "Ich habe eine Katze.",       words: ["w005", "w012", "w121", "w238"], ctx: "emAnh" },
    { id: "s074", vn: "Cho tôi hai cái.",      de: "Gib mir zwei (davon).",      words: ["w202", "w001", "w122"], ctx: "formal" },
    { id: "s075", vn: "Nhà em có ba người.",   de: "In meiner Familie sind drei Personen.", words: ["w030", "w005", "w012", "w123", "w010"], ctx: "emAnh" },
    { id: "s076", vn: "Em mua năm quả.",       de: "Ich kaufe fünf (Stück).",    words: ["w005", "w055", "w125"], ctx: "emAnh" },

    // — Nehmen & Geben (Paket 14) —
    { id: "s077", vn: "Lấy cho em cái đó.",    de: "Hol mir das dort.",          words: ["w131", "w202", "w005", "w152"], ctx: "emAnh" },
    { id: "s078", vn: "Anh mở cửa giúp em.",   de: "Mach bitte die Tür auf.",    words: ["w003", "w137", "w187", "w068", "w005"], ctx: "emAnh" },
    { id: "s079", vn: "Đóng cửa lại đi.",      de: "Mach die Tür zu.",           words: ["w138", "w187", "w210", "w013"] },
    { id: "s080", vn: "Em mất chìa khóa rồi.", de: "Ich habe den Schlüssel verloren.", words: ["w005", "w134"], ctx: "emAnh" },
    { id: "s081", vn: "Đưa cho em điện thoại.", de: "Gib mir das Handy.",        words: ["w132", "w202", "w005", "w243"], ctx: "emAnh" },

    // — Körper (Paket 15) —
    { id: "s082", vn: "Em đau đầu.",           de: "Ich habe Kopfschmerzen.",    words: ["w005", "w141"], ctx: "emAnh" },
    { id: "s083", vn: "Mắt anh đẹp.",          de: "Du hast schöne Augen.",      words: ["w142", "w003", "w107"], ctx: "emAnh" },
    { id: "s084", vn: "Rửa tay đi.",           de: "Wasch dir die Hände.",       words: ["w143", "w013"] },
    { id: "s085", vn: "Em đau bụng.",          de: "Ich habe Bauchschmerzen.",   words: ["w005", "w149"], ctx: "emAnh" },

    // — Orte & Richtung (Paket 16) —
    { id: "s086", vn: "Nhà em ở đây.",         de: "Mein Haus ist hier.",        words: ["w030", "w005", "w213", "w151"], ctx: "emAnh" },
    { id: "s087", vn: "Con mèo ở trong nhà.",  de: "Die Katze ist im Haus.",     words: ["w238", "w213", "w155", "w030"] },
    { id: "s088", vn: "Chợ ở gần đây.",        de: "Der Markt ist in der Nähe.", words: ["w247", "w213", "w159", "w151"] },
    { id: "s089", vn: "Trường em ở xa.",       de: "Meine Schule ist weit weg.", words: ["w248", "w005", "w213", "w160"], ctx: "emAnh" },
    { id: "s090", vn: "Sách ở trên bàn.",      de: "Das Buch ist auf dem Tisch.", words: ["w196", "w213", "w157", "w244"] },

    // — Handeln (Paket 17) —
    { id: "s091", vn: "Chờ em một chút.",      de: "Warte kurz auf mich.",       words: ["w163", "w005", "w121"], ctx: "emAnh" },
    { id: "s092", vn: "Đi theo em.",           de: "Folge mir.",                 words: ["w013", "w164", "w005"], ctx: "emAnh" },
    { id: "s093", vn: "Cố lên nhé!",           de: "Gib dein Bestes!",           words: ["w161", "w045"] },

    // — Eigenschaften II (Paket 18) —
    { id: "s094", vn: "Em rất vui.",           de: "Ich bin sehr froh.",         words: ["w005", "w111", "w171"], ctx: "emAnh" },
    { id: "s095", vn: "Hôm nay em mệt.",       de: "Heute bin ich müde.",        words: ["w076", "w005", "w179"], ctx: "emAnh" },
    { id: "s096", vn: "Tiếng Việt khó không?", de: "Ist Vietnamesisch schwer?",  words: ["w194", "w174", "w036"] },
    { id: "s097", vn: "Trời hôm nay nóng.",    de: "Heute ist es heiß.",         words: ["w231", "w076", "w177"] },
    { id: "s098", vn: "Nước lạnh quá.",        de: "Das Wasser ist zu kalt.",    words: ["w054", "w178", "w112"] },
    { id: "s099", vn: "Chị nói đúng.",         de: "Du hast recht.",             words: ["w004", "w018", "w175"], ctx: "emChi" },

    // — Alltag & Dinge (Paket 19) —
    { id: "s100", vn: "Em không có tiền.",     de: "Ich habe kein Geld.",        words: ["w005", "w036", "w012", "w181"], ctx: "emAnh" },
    { id: "s101", vn: "Xe em hỏng rồi.",       de: "Mein Motorrad ist kaputt.",  words: ["w182", "w005"], ctx: "emAnh" },
    { id: "s102", vn: "Đường này xa lắm.",     de: "Dieser Weg ist sehr weit.",  words: ["w183", "w153", "w160", "w117"] },
    { id: "s103", vn: "Phòng em nhỏ.",         de: "Mein Zimmer ist klein.",     words: ["w188", "w005", "w104"], ctx: "emAnh" },
    { id: "s104", vn: "Em có việc phải làm.",  de: "Ich habe etwas zu erledigen.", words: ["w005", "w012", "w184", "w040", "w015"], ctx: "emAnh" },

    // — Sprache & Ausdruck (Paket 20) —
    { id: "s105", vn: "Tôi tên là Nam.",       de: "Ich heiße Nam.",             words: ["w001", "w191", "w011"], ctx: "formal" },
    { id: "s106", vn: "Anh tên là gì?",        de: "Wie heißt du?",              words: ["w003", "w191", "w011", "w031"], ctx: "emAnh" },
    { id: "s107", vn: "Em nói tiếng Việt được không?", de: "Sprichst du Vietnamesisch?", words: ["w005", "w018", "w194", "w014", "w036"], ctx: "anhEm" },
    { id: "s108", vn: "Cô ấy hát hay lắm.",    de: "Sie singt sehr schön.",      words: ["w008", "w197", "w209", "w117"] },
    { id: "s109", vn: "Đứa bé đang khóc.",     de: "Das Baby weint.",            words: ["w027", "w199"] },

    // — Verbindungen & Adverbien (Paket 21) —
    { id: "s110", vn: "Em đi với anh.",        de: "Ich gehe mit dir.",          words: ["w005", "w013", "w201", "w003"], ctx: "emAnh" },
    { id: "s111", vn: "Cái này cho anh.",      de: "Das ist für dich.",          words: ["w153", "w202", "w003"], ctx: "emAnh" },
    { id: "s112", vn: "Em vẫn còn nhớ.",       de: "Ich erinnere mich noch.",    words: ["w005", "w206", "w214", "w084"], ctx: "emAnh" },
    { id: "s113", vn: "Anh nói lại đi.",       de: "Sag es noch einmal.",        words: ["w003", "w018", "w210", "w013"], ctx: "emAnh" },
    { id: "s114", vn: "Thật không?",           de: "Wirklich?",                  words: ["w207", "w036"] },

    // — Zustände (Paket 22) —
    { id: "s115", vn: "Em sống ở đây.",        de: "Ich wohne hier.",            words: ["w005", "w211", "w213", "w151"], ctx: "emAnh" },
    { id: "s116", vn: "Em làm xong rồi.",      de: "Ich bin fertig.",            words: ["w005", "w015", "w216"], ctx: "emAnh" },
    { id: "s117", vn: "Chúng ta bắt đầu nhé.", de: "Lass uns anfangen.",         words: ["w217"] },
    { id: "s118", vn: "Bố nghỉ đi.",           de: "Ruh dich aus.",              words: ["w022", "w218", "w013"], ctx: "conParent" },
    { id: "s119", vn: "Cơm hết rồi.",          de: "Der Reis ist alle.",         words: ["w053", "w215"] },
    { id: "s120", vn: "Em gửi cho anh.",       de: "Ich schicke es dir.",        words: ["w005", "w220", "w202", "w003"], ctx: "emAnh" },

    // — Essen & Trinken (Paket 23) —
    { id: "s121", vn: "Em đói bụng.",          de: "Ich bin hungrig.",           words: ["w005", "w230", "w149"], ctx: "emAnh" },
    { id: "s122", vn: "Cho tôi một ly trà.",   de: "Einen Tee bitte.",           words: ["w202", "w001", "w121", "w228"], ctx: "formal" },
    { id: "s123", vn: "Em thích ăn cá.",       de: "Ich esse gern Fisch.",       words: ["w005", "w085", "w051", "w223"], ctx: "emAnh" },
    { id: "s124", vn: "Bánh này ngon quá.",    de: "Dieser Kuchen ist so lecker.", words: ["w221", "w153", "w112"] },
    { id: "s125", vn: "Cho tôi thêm muối.",    de: "Mehr Salz bitte.",           words: ["w202", "w001", "w229"], ctx: "formal" },
    { id: "s126", vn: "Chị uống cà phê không?", de: "Trinkst du Kaffee?",        words: ["w004", "w052", "w227", "w036"], ctx: "emChi" },

    // — Natur & Wetter (Paket 24) —
    { id: "s127", vn: "Trời đang mưa.",        de: "Es regnet.",                 words: ["w231", "w232"] },
    { id: "s128", vn: "Hôm nay trời nắng.",    de: "Heute scheint die Sonne.",   words: ["w076", "w231", "w233"] },
    { id: "s129", vn: "Em thích biển.",        de: "Ich mag das Meer.",          words: ["w005", "w085", "w240"], ctx: "emAnh" },
    { id: "s130", vn: "Con chim đang hát.",    de: "Der Vogel singt.",           words: ["w239", "w197"] },
    { id: "s131", vn: "Hoa này đẹp quá.",      de: "Diese Blume ist sehr schön.", words: ["w236", "w153", "w107", "w112"] },
    { id: "s132", vn: "Con chó của em rất ngoan.", de: "Mein Hund ist sehr brav.", words: ["w237", "w005", "w111"], ctx: "emAnh" },

    // — Dinge & Orte (Paket 25) —
    { id: "s133", vn: "Em đi chợ mua rau.",    de: "Ich gehe zum Markt, Gemüse kaufen.", words: ["w005", "w013", "w247", "w055", "w224"], ctx: "emAnh" },
    { id: "s134", vn: "Điện thoại của em mới.", de: "Mein Handy ist neu.",       words: ["w243", "w005", "w105"], ctx: "emAnh" },
    { id: "s135", vn: "Quần áo này đẹp.",      de: "Diese Kleidung ist schön.",  words: ["w241", "w153", "w107"] },
    { id: "s136", vn: "Em đến trường.",        de: "Ich gehe zur Schule.",       words: ["w005", "w041", "w248"], ctx: "emAnh" },
    { id: "s137", vn: "Bệnh viện ở đâu?",      de: "Wo ist das Krankenhaus?",    words: ["w249", "w213", "w033"] },
    { id: "s138", vn: "Em sống ở thành phố.",  de: "Ich wohne in der Stadt.",    words: ["w005", "w211", "w213", "w250"], ctx: "emAnh" },

    // — Gemischte Alltagssätze (Wiederholung quer durch die Pakete) —
    { id: "s139", vn: "Anh có biết chị ấy không?", de: "Kennst du sie?",         words: ["w003", "w012", "w017", "w004", "w036"], ctx: "emAnh" },
    { id: "s140", vn: "Em muốn học tiếng Việt.", de: "Ich möchte Vietnamesisch lernen.", words: ["w005", "w016", "w058", "w194"], ctx: "emAnh" },
    { id: "s141", vn: "Chị ăn cơm chưa?",      de: "Hast du schon gegessen?",    words: ["w004", "w051", "w053"], ctx: "emChi" },
    { id: "s142", vn: "Chúng ta về nhà thôi.", de: "Lass uns nach Hause gehen.", words: ["w042", "w030", "w066"] },
    { id: "s143", vn: "Em rất vui được gặp anh.", de: "Schön, dich zu treffen.", words: ["w005", "w111", "w171", "w014", "w091", "w003"], ctx: "emAnh" },
    { id: "s144", vn: "Anh nói chậm được không?", de: "Kannst du langsam sprechen?", words: ["w003", "w018", "w110", "w014", "w036"], ctx: "emAnh" },
    { id: "s145", vn: "Em cần đi bệnh viện.",  de: "Ich muss ins Krankenhaus.",  words: ["w005", "w069", "w013", "w249"], ctx: "emAnh" },
    { id: "s146", vn: "Bây giờ là mấy giờ rồi?", de: "Wie spät ist es jetzt?",   words: ["w075", "w011", "w071"] },
    { id: "s147", vn: "Em không thích trời mưa.", de: "Ich mag Regen nicht.",    words: ["w005", "w036", "w085", "w231", "w232"], ctx: "emAnh" },
    { id: "s148", vn: "Con em đi học rồi.",    de: "Mein Kind ist zur Schule gegangen.", words: ["w023", "w005", "w013", "w058"], ctx: "emAnh" },
    { id: "s149", vn: "Anh giúp em một việc nhé.", de: "Hilf mir bitte mit einer Sache.", words: ["w003", "w068", "w005", "w121", "w184"], ctx: "emAnh" },
    { id: "s150", vn: "Chúc bố ngủ ngon.",     de: "Schlaf gut.",                words: ["w022", "w050"], ctx: "conParent" }
  ],

  sentenceById: function (id) {
    for (var i = 0; i < this.sentences.length; i++) {
      if (this.sentences[i].id === id) return this.sentences[i];
    }
    return null;
  }
};
