/**
 * Lernpfad: Regionen und Etappen in Spielreihenfolge, je Etappe die Wortnummern
 * (w001 = 1). Reihenfolge frequenz- und themenbasiert: Kernwortschatz (w001–w250)
 * vorne, vorbereitete Wörter (w251–w538) thematisch eingestreut, seltene/filmische
 * Wörter am Ende. Sätze und Rollen werden nicht hier zugeordnet, sondern landen
 * automatisch in der Etappe, in der ihr letztes benötigtes Wort eingeführt wird.
 */
import type { Region, RegionId, StageKind } from '../../src/content/types.ts';

export const REGIONS: Region[] = [
  { id: 'danang', name: 'Đà Nẵng', subtitle: 'Ankommen am Meer' },
  { id: 'hoian', name: 'Hội An', subtitle: 'Laternen in der Altstadt' },
  { id: 'hue', name: 'Huế', subtitle: 'Die alte Kaiserstadt' },
  { id: 'hanoi', name: 'Hà Nội', subtitle: 'Roller in der Altstadt' },
  { id: 'saigon', name: 'Sài Gòn', subtitle: 'Die Stadt, die nie schläft' },
];

interface StageDef {
  region: RegionId;
  title: string;
  kind: StageKind;
  words: number[];
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export const STAGES: StageDef[] = [
  // Đà Nẵng
  { region: 'danang', title: 'Ich & du', kind: 'pronouns', words: [1, 2, 3, 4, 5, 10, 253, 251, 252] },
  { region: 'danang', title: 'Ja, nein, was?', kind: 'standard', words: [...range(31, 40), 11, 12, 61, 62, 63, 67, 70] },
  { region: 'danang', title: 'Die wichtigsten Verben', kind: 'standard', words: [...range(13, 20), 41, 42, 69, 68, 64, 65, 66] },
  { region: 'danang', title: 'Essen & Trinken', kind: 'standard', words: [51, 52, 53, 54, 227, 228, 221, 222, 223, 224, 225, 226, 229, 230, 501, 337] },
  { region: 'danang', title: 'Zahlen & Geld', kind: 'standard', words: [...range(121, 130), 181, 55, 56, 291, 140, 493, 402] },
  { region: 'danang', title: 'Uhrzeit & Tage', kind: 'standard', words: [...range(71, 80), 284, 523, 311, 453, 260] },
  // Hội An
  { region: 'hoian', title: 'Familie & Anreden', kind: 'pronouns', words: [6, 7, 8, 9, 21, 22, 23, 26, 28, 272, 263, 24, 25, 27, 29] },
  { region: 'hoian', title: 'Unterwegs', kind: 'standard', words: [...range(43, 50), 182, 183, 254, 165, 166, 295, 398, 520] },
  { region: 'hoian', title: 'Wo ist was?', kind: 'standard', words: [...range(151, 160), 213, 268, 306, 305, 345, 267, 265] },
  { region: 'hoian', title: 'Wie ist es?', kind: 'standard', words: [...range(101, 110), 319, 495, 405, 496, 356, 285, 288] },
  { region: 'hoian', title: 'Sehr, viel, wenig', kind: 'standard', words: [...range(111, 120), 266, 270, 271, 313, 335, 390, 435] },
  { region: 'hoian', title: 'Auf dem Markt', kind: 'standard', words: [247, 471, 320, 394, 399, 429, 531, 536, 500, 302, 300, 186, 296, 298, 317, 452, 513] },
  // Huế
  { region: 'hue', title: 'Denken & Fühlen', kind: 'standard', words: [...range(81, 90), 171, 172, 312, 397, 414, 358, 448] },
  { region: 'hue', title: 'Reden & Fragen', kind: 'standard', words: [...range(91, 100), 344, 485, 339, 388, 341, 389] },
  { region: 'hue', title: 'Richtig oder falsch', kind: 'standard', words: [173, 174, 175, 176, 276, 269, 338, 310, 514, 466, 330, 293, 259, 350] },
  { region: 'hue', title: 'Kleine Wörter, große Wirkung', kind: 'particles', words: [359, 360, 361, 362, 371, 372, 376, 377, 378, 382, 383, 384, 385, 386, 387] },
  { region: 'hue', title: 'Verbinden', kind: 'standard', words: [201, 202, 203, ...range(363, 370), 373, 374, 375, 258, 257, 379, 380, 381] },
  { region: 'hue', title: 'Nehmen & Geben', kind: 'standard', words: [...range(131, 139), 280, 278, 282, 279, 411, 509, 351, 473] },
  { region: 'hue', title: 'Körper & Gesundheit', kind: 'standard', words: [...range(141, 150), 179, 180, 307, 304, 249, 527, 528, 456, 462] },
  // Hà Nội
  { region: 'hanoi', title: 'Dinge im Alltag', kind: 'standard', words: [184, 185, 187, 188, 189, 190, 243, 244, 245, 246, 241, 242, 30, 250, 538, 535, 480, 463] },
  { region: 'hanoi', title: 'Lernen & Arbeiten', kind: 'standard', words: [58, 60, 57, 59, 211, 212, ...range(214, 220), 334, 461, 392, 415, 248] },
  { region: 'hanoi', title: 'Sprache & Ausdruck', kind: 'standard', words: [...range(191, 200), 316, 444, 348, 391, 423, 443] },
  { region: 'hanoi', title: 'Wann & wie oft', kind: 'standard', words: [...range(204, 210), 274, 273, 292, 343, 492, 255, 256, 262, 275] },
  { region: 'hanoi', title: 'Zuhause', kind: 'standard', words: [482, 484, 505, 522, 502, 483, 486, 322, 503, 347, 342, 469, 497, 532, 511, 491, 477, 409] },
  { region: 'hanoi', title: 'Tun & Lassen', kind: 'standard', words: [161, 162, 163, 164, 167, 168, 169, 170, 286, 264, 289, 299, 433, 438, 434, 446] },
  { region: 'hanoi', title: 'Werkeln & Ordnen', kind: 'standard', words: [416, 417, 420, 421, 422, 447, 450, 459, 464, 470, 508, 510, 533, 537, 321, 308] },
  // Sài Gòn
  { region: 'saigon', title: 'Wetter & Jahreszeiten', kind: 'standard', words: [231, 232, 233, 234, 240, 177, 178, 498, 499, 526, 525, 524, 489] },
  { region: 'saigon', title: 'Natur & Farben', kind: 'standard', words: [235, 236, 237, 238, 239, 465, 430, 474, 412, 287, 457, 424, 425, 426, 427, 481, 403] },
  { region: 'saigon', title: 'Reisen', kind: 'standard', words: [314, 283, 530, 534, 487, 439, 476, 468, 340, 504, 512, 407, 440, 354, 294, 418, 419, 431, 442] },
  { region: 'saigon', title: 'Stark & schwach', kind: 'standard', words: [303, 454, 458, 455, 393, 315, 357, 324, 479, 529, 494] },
  { region: 'saigon', title: 'Feiern & Liebe', kind: 'standard', words: [318, 506, 428, 432, 353, 521, 436, 408, 401, 404, 281, 326, 323, 400, 472, 346, 333, 349] },
  { region: 'saigon', title: 'Ärger & Streit', kind: 'standard', words: [309, 297, 355, 460, 517, 515, 516, 519, 441, 410, 396, 490, 507, 518, 445, 478, 488] },
  { region: 'saigon', title: 'Wie im Film', kind: 'standard', words: [261, 277, 290, 413, 395, 449, 437, 352, 336, 406, 301, 325, 451, 475, 467, 328, 327, 332, 331, 329] },
];
