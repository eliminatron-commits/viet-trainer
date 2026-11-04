import { content } from '../../content';
import type { DateKey, SaveState, StatKey } from '../storage/state';
import { ACCESSORIES } from './accessories';
import { isDone, regionDone } from './path';
import { levelInfo } from './rewards';
import { learnedKeys } from './session';

/** Achievements: Schwelle auf einem Messwert. Einmal erreicht, bleiben sie mit Datum im Spielstand. */

export type Metric = StatKey | 'level' | 'bestStreak' | 'learned' | 'stagesDone' | 'regionsDone' | 'favorites' | 'accessories';

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  metric: Metric;
  goal: number;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'erste-runde', title: 'Losgefahren', desc: 'Beende deine erste Runde.', metric: 'rounds', goal: 1 },
  { id: 'fleissig', title: 'Fleißig', desc: '100 Aufgaben richtig gelöst.', metric: 'correct', goal: 100 },
  { id: 'unermuedlich', title: 'Unermüdlich', desc: '1000 Aufgaben richtig gelöst.', metric: 'correct', goal: 1000 },
  { id: 'vokabeln', title: 'Erste Vokabeln', desc: '50 Einheiten gelernt.', metric: 'learned', goal: 50 },
  { id: 'wortschatz', title: 'Wortschatz', desc: '250 Einheiten gelernt.', metric: 'learned', goal: 250 },
  { id: 'erster-boss', title: 'Erster Boss', desc: 'Einen Bosskampf gewonnen.', metric: 'bossWins', goal: 1 },
  { id: 'makellos', title: 'Makellos', desc: 'Einen Boss ohne verlorenes Leben besiegt.', metric: 'perfectBosses', goal: 1 },
  { id: 'bossjaeger', title: 'Bossjäger', desc: '10 Bosskämpfe gewonnen.', metric: 'bossWins', goal: 10 },
  { id: 'erste-region', title: 'Erste Region', desc: 'Alle Etappen einer Region geschafft.', metric: 'regionsDone', goal: 1 },
  { id: 'ganz-vietnam', title: 'Ganz Vietnam', desc: 'Von Đà Nẵng bis Sài Gòn – alle Regionen geschafft.', metric: 'regionsDone', goal: 5 },
  { id: 'serie-3', title: 'Drei am Stück', desc: 'Drei Tage in Folge das Tagesziel erreicht.', metric: 'bestStreak', goal: 3 },
  { id: 'serie-7', title: 'Eine Woche dran', desc: 'Sieben Tage in Folge das Tagesziel erreicht.', metric: 'bestStreak', goal: 7 },
  { id: 'serie-30', title: 'Ein ganzer Monat', desc: '30 Tage in Folge das Tagesziel erreicht.', metric: 'bestStreak', goal: 30 },
  { id: 'lauf', title: 'Im Lauf', desc: '10 Aufgaben in Folge richtig.', metric: 'bestCombo', goal: 10 },
  { id: 'paarweise', title: 'Paarweise', desc: '10 Paare-Runden gegen die Uhr gewonnen.', metric: 'pairs', goal: 10 },
  { id: 'ton-ninja', title: 'Ton-Ninja', desc: '50 Töne richtig erkannt.', metric: 'tones', goal: 50 },
  { id: 'satzbauer', title: 'Satzbauer', desc: '25 Sätze aus Kacheln gebaut.', metric: 'builds', goal: 25 },
  { id: 'gutes-gehoer', title: 'Gutes Gehör', desc: '25 Hör-Diktate gelöst.', metric: 'dictations', goal: 25 },
  { id: 'level-10', title: 'Ausgewachsen', desc: 'Level 10 erreicht – Trâu ist groß.', metric: 'level', goal: 10 },
  { id: 'schatzsucher', title: 'Schatzsucher', desc: '5 Truhen geöffnet.', metric: 'chests', goal: 5 },
  { id: 'sammler', title: 'Sammler', desc: '10 Favoriten im Sprachführer.', metric: 'favorites', goal: 10 },
  { id: 'gut-gekleidet', title: 'Gut gekleidet', desc: 'Alle Accessoires für Trâu gesammelt.', metric: 'accessories', goal: ACCESSORIES.length },
];

const REGIONS = content.regions.map((r) => r.id);

export function metricValue(save: SaveState, metric: Metric): number {
  switch (metric) {
    case 'level':
      return levelInfo(save.xp).level;
    case 'bestStreak':
      return Math.max(save.streak.best, save.streak.count);
    case 'learned':
      return learnedKeys(save).length;
    case 'stagesDone':
      return content.stages.filter((s) => isDone(save, s.id)).length;
    case 'regionsDone':
      return REGIONS.filter((r) => regionDone(save, r)).length;
    case 'favorites':
      return save.favorites.length;
    case 'accessories':
      return save.inventory.accessories.length;
    default:
      return save.stats[metric];
  }
}

/** Vergibt alle neu erreichten Achievements und gibt sie zurück. */
export function checkAchievements(save: SaveState, today: DateKey): Achievement[] {
  const fresh = ACHIEVEMENTS.filter((a) => !save.achievements[a.id] && metricValue(save, a.metric) >= a.goal);
  for (const a of fresh) save.achievements[a.id] = today;
  return fresh;
}
