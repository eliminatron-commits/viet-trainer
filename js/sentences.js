var VT = (window.VT = window.VT || {});
/* =============================================================================
 * VT.SENTENCES – Statische Satz-Sammlung für den Reiter „Sätze" (reine Daten).
 *
 * Datenmodell Satz: { id, vn, de, words }
 *   - id:    "s001".. – zugleich Audio-Dateiname (audio/<id>.mp3).
 *   - vn:    vietnamesischer Satz (Anzeige, TTS, Quiz-Lösung).
 *   - de:    deutsche Übersetzung.
 *   - words: Vokabel-IDs (w0xx aus VT.DATA), die im Satz vorkommen. Steuern die
 *            FREIGABE: ein Satz erscheint erst, wenn ALLE diese Wörter im Reiter
 *            „Lernen" schon gesehen wurden (seen>0). Reine Füll-/Verbindungswörter,
 *            die NICHT im Wortschatz stehen (của, cái, rồi, ạ, nhé, à, thế, vậy …),
 *            gehören NICHT in `words` und blockieren nie.
 *
 * Sätze sind bewusst kurz und alltagsnah, nach Schwierigkeit gestaffelt (die UI
 * sortiert nach höchstem enthaltenem Wort-Paket). Sie sind zunächst KI-getextet
 * und für die Prüfung durch eine Muttersprachlerin gedacht; Korrekturen laufen
 * über scripts/generate_audio_eleven.py --source js/sentences.js --only sXXX.
 * ============================================================================= */
VT.SENTENCES = {
  sentences: [
    // — Grundlagen (Pronomen + Kernverben, Pakete 1–2) —
    { id: "s001", vn: "Tôi là người Việt.",   de: "Ich bin Vietnamese.",        words: ["w001", "w011", "w010"] },
    { id: "s002", vn: "Anh là bạn tôi.",       de: "Du bist mein Freund.",       words: ["w003", "w011", "w002", "w001"] },
    { id: "s003", vn: "Tôi biết anh.",         de: "Ich kenne dich.",            words: ["w001", "w017", "w003"] },
    { id: "s004", vn: "Tôi thấy bạn.",         de: "Ich sehe dich.",             words: ["w001", "w019", "w002"] },
    { id: "s005", vn: "Tôi nghe anh.",         de: "Ich höre dir zu.",           words: ["w001", "w020", "w003"] },
    { id: "s006", vn: "Tôi muốn đi.",          de: "Ich möchte gehen.",          words: ["w001", "w016", "w013"] },
    { id: "s007", vn: "Tôi muốn nói.",         de: "Ich möchte sprechen.",       words: ["w001", "w016", "w018"] },
    { id: "s008", vn: "Tôi đi làm.",           de: "Ich gehe arbeiten.",         words: ["w001", "w013", "w015"] },
    { id: "s009", vn: "Anh làm được.",         de: "Du schaffst das.",           words: ["w003", "w015", "w014"] },
    { id: "s010", vn: "Em muốn làm gì?",       de: "Was möchtest du machen?",    words: ["w005", "w016", "w015", "w031"] },

    // — Familie & Zuhause (Paket 3) —
    { id: "s011", vn: "Đây là gia đình tôi.",  de: "Das ist meine Familie.",     words: ["w151", "w011", "w029", "w001"] },
    { id: "s012", vn: "Mẹ tôi ở nhà.",         de: "Meine Mutter ist zu Hause.", words: ["w021", "w001", "w213", "w030"] },
    { id: "s013", vn: "Bố tôi đi làm.",        de: "Mein Vater geht arbeiten.",  words: ["w022", "w001", "w013", "w015"] },
    { id: "s014", vn: "Tôi có hai con.",       de: "Ich habe zwei Kinder.",      words: ["w001", "w012", "w122", "w023"] },
    { id: "s015", vn: "Vợ tôi rất đẹp.",       de: "Meine Frau ist sehr schön.", words: ["w024", "w001", "w111", "w107"] },
    { id: "s016", vn: "Con tôi ngủ rồi.",      de: "Mein Kind schläft schon.",   words: ["w023", "w001", "w050"] },
    { id: "s017", vn: "Nhà tôi ở gần đây.",    de: "Mein Haus ist hier in der Nähe.", words: ["w030", "w001", "w213", "w159", "w151"] },

    // — Fragen & Antworten (Paket 4) —
    { id: "s018", vn: "Cái này là gì?",        de: "Was ist das?",               words: ["w153", "w011", "w031"] },
    { id: "s019", vn: "Anh đi đâu?",           de: "Wohin gehst du?",            words: ["w003", "w013", "w033"] },
    { id: "s020", vn: "Bạn có khỏe không?",    de: "Geht es dir gut?",           words: ["w002", "w012", "w180", "w036"] },
    { id: "s021", vn: "Tôi không biết.",       de: "Ich weiß es nicht.",         words: ["w001", "w036", "w017"] },
    { id: "s022", vn: "Tôi không hiểu.",       de: "Ich verstehe nicht.",        words: ["w001", "w036", "w082"] },
    { id: "s023", vn: "Dạ, đúng rồi.",         de: "Ja, genau.",                 words: ["w038", "w175"] },
    { id: "s024", vn: "Không, cảm ơn.",        de: "Nein, danke.",               words: ["w036", "w062"] },
    { id: "s025", vn: "Bạn muốn cái nào?",     de: "Welches möchtest du?",       words: ["w002", "w016", "w034"] },
    { id: "s026", vn: "Cái này bao nhiêu?",    de: "Wie viel kostet das?",       words: ["w153", "w035"] },
    { id: "s027", vn: "Tại sao anh buồn?",     de: "Warum bist du traurig?",     words: ["w032", "w003", "w172"] },

    // — Bewegung (Paket 5) —
    { id: "s028", vn: "Tôi về nhà.",           de: "Ich gehe nach Hause.",       words: ["w001", "w042", "w030"] },
    { id: "s029", vn: "Mời anh vào.",          de: "Bitte komm herein.",         words: ["w003", "w044"] },
    { id: "s030", vn: "Anh đến đây đi.",       de: "Komm her.",                  words: ["w003", "w041", "w151", "w013"] },
    { id: "s031", vn: "Con chó chạy nhanh.",   de: "Der Hund läuft schnell.",    words: ["w237", "w047", "w109"] },
    { id: "s032", vn: "Mời bà ngồi.",          de: "Bitte setzen Sie sich.",     words: ["w007", "w049"] },
    { id: "s033", vn: "Tôi muốn về.",          de: "Ich möchte zurück.",         words: ["w001", "w016", "w042"] },

    // — Essen & Tun (Paket 6) —
    { id: "s034", vn: "Tôi muốn ăn cơm.",      de: "Ich möchte Reis essen.",     words: ["w001", "w016", "w051", "w053"] },
    { id: "s035", vn: "Anh uống nước không?",  de: "Möchtest du Wasser trinken?", words: ["w003", "w052", "w054", "w036"] },
    { id: "s036", vn: "Tôi đi mua đồ.",        de: "Ich gehe einkaufen.",        words: ["w001", "w013", "w055", "w186"] },
    { id: "s037", vn: "Em học tiếng Việt.",    de: "Ich lerne Vietnamesisch.",   words: ["w005", "w058", "w194"] },
    { id: "s038", vn: "Chúng ta đi ăn nhé.",   de: "Lass uns essen gehen.",      words: ["w013", "w051"] },
    { id: "s039", vn: "Tôi ăn cơm rồi.",       de: "Ich habe schon gegessen.",   words: ["w001", "w051", "w053"] },

    // — Höflichkeit (Paket 7) —
    { id: "s040", vn: "Chào anh.",             de: "Hallo.",                     words: ["w061", "w003"] },
    { id: "s041", vn: "Cảm ơn anh nhiều.",     de: "Vielen Dank.",               words: ["w062", "w003", "w113"] },
    { id: "s042", vn: "Xin lỗi anh.",          de: "Entschuldige bitte.",        words: ["w063", "w003"] },
    { id: "s043", vn: "Anh giúp tôi được không?", de: "Kannst du mir helfen?",   words: ["w003", "w068", "w001", "w014", "w036"] },
    { id: "s044", vn: "Đừng lo.",              de: "Mach dir keine Sorgen.",     words: ["w065", "w089"] },
    { id: "s045", vn: "Tạm biệt, hẹn gặp lại.", de: "Auf Wiedersehen, bis bald.", words: ["w067", "w091", "w210"] },
    { id: "s046", vn: "Tôi cần anh giúp.",     de: "Ich brauche deine Hilfe.",   words: ["w001", "w069", "w003", "w068"] },

    // — Zeit (Paket 8) —
    { id: "s047", vn: "Bây giờ tôi bận.",      de: "Jetzt bin ich beschäftigt.", words: ["w075", "w001"] },
    { id: "s048", vn: "Hôm nay trời đẹp.",     de: "Heute ist schönes Wetter.",  words: ["w076", "w231", "w107"] },
    { id: "s049", vn: "Ngày mai tôi đi làm.",  de: "Morgen gehe ich arbeiten.",  words: ["w078", "w001", "w013", "w015"] },
    { id: "s050", vn: "Hôm qua tôi ở nhà.",    de: "Gestern war ich zu Hause.",  words: ["w077", "w001", "w213", "w030"] },
    { id: "s051", vn: "Sáng nay tôi uống cà phê.", de: "Heute Morgen trinke ich Kaffee.", words: ["w079", "w001", "w052", "w227"] },
    { id: "s052", vn: "Tối nay anh làm gì?",   de: "Was machst du heute Abend?", words: ["w080", "w003", "w015", "w031"] },

    // — Denken & Fühlen (Paket 9) —
    { id: "s053", vn: "Tôi yêu em.",           de: "Ich liebe dich.",            words: ["w001", "w086", "w005"] },
    { id: "s054", vn: "Tôi nhớ anh.",          de: "Ich vermisse dich.",         words: ["w001", "w084", "w003"] },
    { id: "s055", vn: "Tôi thích món này.",    de: "Ich mag dieses Gericht.",    words: ["w001", "w085", "w153"] },
    { id: "s056", vn: "Tôi nghĩ anh đúng.",    de: "Ich glaube, du hast recht.", words: ["w001", "w081", "w003", "w175"] },
    { id: "s057", vn: "Tôi hiểu rồi.",         de: "Ich verstehe (jetzt).",      words: ["w001", "w082"] },
    { id: "s058", vn: "Đừng sợ.",              de: "Hab keine Angst.",           words: ["w065", "w088"] },
    { id: "s059", vn: "Tôi tin anh.",          de: "Ich vertraue dir.",          words: ["w001", "w083", "w003"] },

    // — Kommunikation (Paket 10) —
    { id: "s060", vn: "Tôi muốn gặp anh.",     de: "Ich möchte dich treffen.",   words: ["w001", "w016", "w091", "w003"] },
    { id: "s061", vn: "Gọi cho tôi nhé.",      de: "Ruf mich an.",               words: ["w092", "w202", "w001"] },
    { id: "s062", vn: "Cho tôi hỏi một chút.", de: "Darf ich kurz fragen?",      words: ["w202", "w001", "w093", "w121"] },
    { id: "s063", vn: "Anh tìm gì?",           de: "Was suchst du?",             words: ["w003", "w097", "w031"] },
    { id: "s064", vn: "Tôi đọc sách.",         de: "Ich lese ein Buch.",         words: ["w001", "w100", "w196"] },
    { id: "s065", vn: "Anh trả lời đi.",       de: "Antworte bitte.",            words: ["w003", "w094", "w013"] },

    // — Eigenschaften & Mengen (Pakete 11–12) —
    { id: "s066", vn: "Món này rất ngon.",     de: "Dieses Gericht ist sehr lecker.", words: ["w153", "w111"] },
    { id: "s067", vn: "Nhà anh lớn quá.",      de: "Dein Haus ist sehr groß.",   words: ["w030", "w003", "w103", "w112"] },
    { id: "s068", vn: "Xe này mới.",           de: "Dieses Motorrad ist neu.",   words: ["w182", "w153", "w105"] },
    { id: "s069", vn: "Tôi có ít tiền.",       de: "Ich habe wenig Geld.",       words: ["w001", "w012", "w114", "w181"] },
    { id: "s070", vn: "Cái này tốt hơn.",      de: "Das ist besser.",            words: ["w153", "w101", "w116"] },
    { id: "s071", vn: "Tôi cũng thích.",       de: "Ich mag es auch.",           words: ["w001", "w119", "w085"] },
    { id: "s072", vn: "Anh đẹp trai lắm.",     de: "Du siehst sehr gut aus.",    words: ["w003", "w107", "w117"] },

    // — Zahlen (Paket 13) —
    { id: "s073", vn: "Tôi có một con mèo.",   de: "Ich habe eine Katze.",       words: ["w001", "w012", "w121", "w238"] },
    { id: "s074", vn: "Cho tôi hai cái.",      de: "Gib mir zwei (davon).",      words: ["w202", "w001", "w122"] },
    { id: "s075", vn: "Nhà tôi có ba người.",  de: "In meiner Familie sind drei Personen.", words: ["w030", "w001", "w012", "w123", "w010"] },
    { id: "s076", vn: "Tôi mua năm quả.",      de: "Ich kaufe fünf (Stück).",    words: ["w001", "w055", "w125"] },

    // — Nehmen & Geben (Paket 14) —
    { id: "s077", vn: "Lấy cho tôi cái đó.",   de: "Hol mir das dort.",          words: ["w131", "w202", "w001", "w152"] },
    { id: "s078", vn: "Anh mở cửa giúp tôi.",  de: "Mach bitte die Tür auf.",    words: ["w003", "w137", "w187", "w068", "w001"] },
    { id: "s079", vn: "Đóng cửa lại đi.",      de: "Mach die Tür zu.",           words: ["w138", "w187", "w210", "w013"] },
    { id: "s080", vn: "Tôi mất chìa khóa rồi.", de: "Ich habe den Schlüssel verloren.", words: ["w001", "w134"] },
    { id: "s081", vn: "Đưa cho tôi điện thoại.", de: "Gib mir das Handy.",       words: ["w132", "w202", "w001", "w243"] },

    // — Körper (Paket 15) —
    { id: "s082", vn: "Tôi đau đầu.",          de: "Ich habe Kopfschmerzen.",    words: ["w001", "w141"] },
    { id: "s083", vn: "Mắt anh đẹp.",          de: "Du hast schöne Augen.",      words: ["w142", "w003", "w107"] },
    { id: "s084", vn: "Rửa tay đi.",           de: "Wasch dir die Hände.",       words: ["w143", "w013"] },
    { id: "s085", vn: "Tôi đau bụng.",         de: "Ich habe Bauchschmerzen.",   words: ["w001", "w149"] },

    // — Orte & Richtung (Paket 16) —
    { id: "s086", vn: "Nhà tôi ở đây.",        de: "Mein Haus ist hier.",        words: ["w030", "w001", "w213", "w151"] },
    { id: "s087", vn: "Con mèo ở trong nhà.",  de: "Die Katze ist im Haus.",     words: ["w238", "w213", "w155", "w030"] },
    { id: "s088", vn: "Chợ ở gần đây.",        de: "Der Markt ist in der Nähe.", words: ["w247", "w213", "w159", "w151"] },
    { id: "s089", vn: "Trường tôi ở xa.",      de: "Meine Schule ist weit weg.", words: ["w248", "w001", "w213", "w160"] },
    { id: "s090", vn: "Sách ở trên bàn.",      de: "Das Buch ist auf dem Tisch.", words: ["w196", "w213", "w157", "w244"] },

    // — Handeln (Paket 17) —
    { id: "s091", vn: "Chờ tôi một chút.",     de: "Warte kurz auf mich.",       words: ["w163", "w001", "w121"] },
    { id: "s092", vn: "Đi theo tôi.",          de: "Folge mir.",                 words: ["w013", "w164", "w001"] },
    { id: "s093", vn: "Cố lên nhé!",           de: "Gib dein Bestes!",           words: ["w161", "w045"] },

    // — Eigenschaften II (Paket 18) —
    { id: "s094", vn: "Tôi rất vui.",          de: "Ich bin sehr froh.",         words: ["w001", "w111", "w171"] },
    { id: "s095", vn: "Hôm nay tôi mệt.",      de: "Heute bin ich müde.",        words: ["w076", "w001", "w179"] },
    { id: "s096", vn: "Tiếng Việt khó không?", de: "Ist Vietnamesisch schwer?",  words: ["w194", "w174", "w036"] },
    { id: "s097", vn: "Trời hôm nay nóng.",    de: "Heute ist es heiß.",         words: ["w231", "w076", "w177"] },
    { id: "s098", vn: "Nước lạnh quá.",        de: "Das Wasser ist zu kalt.",    words: ["w054", "w178", "w112"] },
    { id: "s099", vn: "Anh nói đúng.",         de: "Du hast recht.",             words: ["w003", "w018", "w175"] },

    // — Alltag & Dinge (Paket 19) —
    { id: "s100", vn: "Tôi không có tiền.",    de: "Ich habe kein Geld.",        words: ["w001", "w036", "w012", "w181"] },
    { id: "s101", vn: "Xe tôi hỏng rồi.",      de: "Mein Motorrad ist kaputt.",  words: ["w182", "w001"] },
    { id: "s102", vn: "Đường này xa lắm.",     de: "Dieser Weg ist sehr weit.",  words: ["w183", "w153", "w160", "w117"] },
    { id: "s103", vn: "Phòng tôi nhỏ.",        de: "Mein Zimmer ist klein.",     words: ["w188", "w001", "w104"] },
    { id: "s104", vn: "Tôi có việc phải làm.", de: "Ich habe etwas zu erledigen.", words: ["w001", "w012", "w184", "w040", "w015"] },

    // — Sprache & Ausdruck (Paket 20) —
    { id: "s105", vn: "Tôi tên là Nam.",       de: "Ich heiße Nam.",             words: ["w001", "w191", "w011"] },
    { id: "s106", vn: "Anh tên là gì?",        de: "Wie heißt du?",              words: ["w003", "w191", "w011", "w031"] },
    { id: "s107", vn: "Em nói tiếng Việt được không?", de: "Sprichst du Vietnamesisch?", words: ["w005", "w018", "w194", "w014", "w036"] },
    { id: "s108", vn: "Cô ấy hát hay lắm.",    de: "Sie singt sehr schön.",      words: ["w008", "w197", "w209", "w117"] },
    { id: "s109", vn: "Đứa bé đang khóc.",     de: "Das Baby weint.",            words: ["w027", "w199"] },

    // — Verbindungen & Adverbien (Paket 21) —
    { id: "s110", vn: "Tôi đi với anh.",       de: "Ich gehe mit dir.",          words: ["w001", "w013", "w201", "w003"] },
    { id: "s111", vn: "Cái này cho anh.",      de: "Das ist für dich.",          words: ["w153", "w202", "w003"] },
    { id: "s112", vn: "Tôi vẫn còn nhớ.",      de: "Ich erinnere mich noch.",    words: ["w001", "w206", "w214", "w084"] },
    { id: "s113", vn: "Anh nói lại đi.",       de: "Sag es noch einmal.",        words: ["w003", "w018", "w210", "w013"] },
    { id: "s114", vn: "Thật không?",           de: "Wirklich?",                  words: ["w207", "w036"] },

    // — Zustände (Paket 22) —
    { id: "s115", vn: "Tôi sống ở đây.",       de: "Ich wohne hier.",            words: ["w001", "w211", "w213", "w151"] },
    { id: "s116", vn: "Tôi làm xong rồi.",     de: "Ich bin fertig.",            words: ["w001", "w015", "w216"] },
    { id: "s117", vn: "Chúng ta bắt đầu nhé.", de: "Lass uns anfangen.",         words: ["w217"] },
    { id: "s118", vn: "Anh nghỉ đi.",          de: "Ruh dich aus.",              words: ["w003", "w218", "w013"] },
    { id: "s119", vn: "Cơm hết rồi.",          de: "Der Reis ist alle.",         words: ["w053", "w215"] },
    { id: "s120", vn: "Tôi gửi cho anh.",      de: "Ich schicke es dir.",        words: ["w001", "w220", "w202", "w003"] },

    // — Essen & Trinken (Paket 23) —
    { id: "s121", vn: "Tôi đói bụng.",         de: "Ich bin hungrig.",           words: ["w001", "w230", "w149"] },
    { id: "s122", vn: "Cho tôi một ly trà.",   de: "Einen Tee bitte.",           words: ["w202", "w001", "w121", "w228"] },
    { id: "s123", vn: "Tôi thích ăn cá.",      de: "Ich esse gern Fisch.",       words: ["w001", "w085", "w051", "w223"] },
    { id: "s124", vn: "Bánh này ngon quá.",    de: "Dieser Kuchen ist so lecker.", words: ["w221", "w153", "w112"] },
    { id: "s125", vn: "Cho tôi thêm muối.",    de: "Mehr Salz bitte.",           words: ["w202", "w001", "w229"] },
    { id: "s126", vn: "Anh uống cà phê không?", de: "Trinkst du Kaffee?",        words: ["w003", "w052", "w227", "w036"] },

    // — Natur & Wetter (Paket 24) —
    { id: "s127", vn: "Trời đang mưa.",        de: "Es regnet.",                 words: ["w231", "w232"] },
    { id: "s128", vn: "Hôm nay trời nắng.",    de: "Heute scheint die Sonne.",   words: ["w076", "w231", "w233"] },
    { id: "s129", vn: "Tôi thích biển.",       de: "Ich mag das Meer.",          words: ["w001", "w085", "w240"] },
    { id: "s130", vn: "Con chim đang hát.",    de: "Der Vogel singt.",           words: ["w239", "w197"] },
    { id: "s131", vn: "Hoa này đẹp quá.",      de: "Diese Blume ist sehr schön.", words: ["w236", "w153", "w107", "w112"] },
    { id: "s132", vn: "Con chó của tôi rất ngoan.", de: "Mein Hund ist sehr brav.", words: ["w237", "w001", "w111"] },

    // — Dinge & Orte (Paket 25) —
    { id: "s133", vn: "Tôi đi chợ mua rau.",   de: "Ich gehe zum Markt, Gemüse kaufen.", words: ["w001", "w013", "w247", "w055", "w224"] },
    { id: "s134", vn: "Điện thoại của tôi mới.", de: "Mein Handy ist neu.",      words: ["w243", "w001", "w105"] },
    { id: "s135", vn: "Quần áo này đẹp.",      de: "Diese Kleidung ist schön.",  words: ["w241", "w153", "w107"] },
    { id: "s136", vn: "Tôi đến trường.",       de: "Ich gehe zur Schule.",       words: ["w001", "w041", "w248"] },
    { id: "s137", vn: "Bệnh viện ở đâu?",      de: "Wo ist das Krankenhaus?",    words: ["w249", "w213", "w033"] },
    { id: "s138", vn: "Tôi sống ở thành phố.", de: "Ich wohne in der Stadt.",    words: ["w001", "w211", "w213", "w250"] },

    // — Gemischte Alltagssätze (Wiederholung quer durch die Pakete) —
    { id: "s139", vn: "Anh có biết chị ấy không?", de: "Kennst du sie?",         words: ["w003", "w012", "w017", "w004", "w036"] },
    { id: "s140", vn: "Tôi muốn học tiếng Việt.", de: "Ich möchte Vietnamesisch lernen.", words: ["w001", "w016", "w058", "w194"] },
    { id: "s141", vn: "Anh ăn cơm chưa?",      de: "Hast du schon gegessen?",    words: ["w003", "w051", "w053"] },
    { id: "s142", vn: "Chúng ta về nhà thôi.", de: "Lass uns nach Hause gehen.", words: ["w042", "w030", "w066"] },
    { id: "s143", vn: "Tôi rất vui được gặp anh.", de: "Schön, dich zu treffen.", words: ["w001", "w111", "w171", "w014", "w091", "w003"] },
    { id: "s144", vn: "Anh nói chậm được không?", de: "Kannst du langsam sprechen?", words: ["w003", "w018", "w110", "w014", "w036"] },
    { id: "s145", vn: "Tôi cần đi bệnh viện.", de: "Ich muss ins Krankenhaus.",  words: ["w001", "w069", "w013", "w249"] },
    { id: "s146", vn: "Bây giờ là mấy giờ rồi?", de: "Wie spät ist es jetzt?",   words: ["w075", "w011", "w071"] },
    { id: "s147", vn: "Tôi không thích trời mưa.", de: "Ich mag Regen nicht.",   words: ["w001", "w036", "w085", "w231", "w232"] },
    { id: "s148", vn: "Con tôi đi học rồi.",   de: "Mein Kind ist zur Schule gegangen.", words: ["w023", "w001", "w013", "w058"] },
    { id: "s149", vn: "Anh giúp tôi một việc nhé.", de: "Hilf mir bitte mit einer Sache.", words: ["w003", "w068", "w001", "w121", "w184"] },
    { id: "s150", vn: "Chúc anh ngủ ngon.",    de: "Schlaf gut.",                words: ["w003", "w050"] }
  ],

  sentenceById: function (id) {
    for (var i = 0; i < this.sentences.length; i++) {
      if (this.sentences[i].id === id) return this.sentences[i];
    }
    return null;
  }
};
