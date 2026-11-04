import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { ACCESSORIES, toggleEquip } from '../src/lib/logic/accessories';
import { ACHIEVEMENTS, checkAchievements, metricValue } from '../src/lib/logic/achievements';
import { countTask, type TaskMode } from '../src/lib/logic/stats';
import { newSave } from '../src/lib/storage/state';

describe('Achievements', () => {
  it('sind etwa 20 mit eindeutigen IDs und erreichbaren Zielen', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(18);
    expect(ACHIEVEMENTS.length).toBeLessThanOrEqual(24);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) {
      expect(a.goal, a.id).toBeGreaterThan(0);
      if (a.metric === 'regionsDone') expect(a.goal).toBeLessThanOrEqual(content.regions.length);
      if (a.metric === 'learned') expect(a.goal).toBeLessThanOrEqual(content.words.length + content.sentences.length);
    }
  });

  it('vergibt beim Erreichen der Schwelle genau einmal, mit Datum', () => {
    const save = newSave();
    expect(checkAchievements(save, '2026-11-04')).toEqual([]);
    save.stats.rounds = 1;
    expect(checkAchievements(save, '2026-11-04').map((a) => a.id)).toEqual(['erste-runde']);
    expect(save.achievements['erste-runde']).toBe('2026-11-04');
    expect(checkAchievements(save, '2026-11-05')).toEqual([]);
    expect(save.achievements['erste-runde']).toBe('2026-11-04');
  });

  it('liest abgeleitete Messwerte aus dem Spielstand', () => {
    const save = newSave();
    save.xp = 2700;
    save.streak = { count: 4, lastDate: '2026-11-04', shields: 0, best: 9 };
    save.favorites = ['w001', 's001'];
    save.items.w001 = { box: 2, due: '2026-11-05', seen: 2, right: 1, wrong: 0 };
    save.items.w002 = { box: 1, due: '2026-11-05', seen: 1, right: 0, wrong: 1 };
    for (const s of content.stages.filter((s) => s.region === 'danang')) save.stages[s.id] = { done: true, bossBest: 2 };
    expect(metricValue(save, 'level')).toBe(10);
    expect(metricValue(save, 'bestStreak')).toBe(9);
    expect(metricValue(save, 'favorites')).toBe(2);
    expect(metricValue(save, 'learned')).toBe(1);
    expect(metricValue(save, 'regionsDone')).toBe(1);
    const ids = checkAchievements(save, '2026-11-04').map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['level-10', 'serie-3', 'serie-7', 'erste-region']));
    expect(ids).not.toContain('serie-30');
  });

  it('zählt Aufgaben je Modus und die beste Folge richtiger Antworten', () => {
    const save = newSave();
    const task = (mode: TaskMode, correct: boolean) => countTask(save.stats, { mode, correct, units: [{ key: 'w001', correct }] });
    for (let i = 0; i < 10; i++) task('tone', true);
    task('vn2de', false);
    task('pairs', true);
    expect(save.stats).toMatchObject({ correct: 11, tones: 10, pairs: 1, combo: 1, bestCombo: 10 });
    expect(checkAchievements(save, '2026-11-04').map((a) => a.id)).toContain('lauf');
  });

  it('„Gut gekleidet“ erst mit allen Accessoires', () => {
    const save = newSave();
    save.inventory.accessories = ACCESSORIES.slice(1).map((a) => a.id);
    expect(checkAchievements(save, '2026-11-04').map((a) => a.id)).not.toContain('gut-gekleidet');
    save.inventory.accessories.push(ACCESSORIES[0]!.id);
    expect(checkAchievements(save, '2026-11-04').map((a) => a.id)).toContain('gut-gekleidet');
  });
});

describe('Accessoires anlegen', () => {
  it('trägt je Platz höchstens eines und nur gewonnene', () => {
    const save = newSave();
    toggleEquip(save, 'non-la');
    expect(save.inventory.equipped).toEqual([]);
    save.inventory.accessories = ['non-la', 'mu-bao-hiem', 'kinh-ram'];
    toggleEquip(save, 'non-la');
    toggleEquip(save, 'kinh-ram');
    toggleEquip(save, 'mu-bao-hiem');
    expect([...save.inventory.equipped].sort()).toEqual(['kinh-ram', 'mu-bao-hiem']);
    toggleEquip(save, 'kinh-ram');
    expect(save.inventory.equipped).toEqual(['mu-bao-hiem']);
  });
});
