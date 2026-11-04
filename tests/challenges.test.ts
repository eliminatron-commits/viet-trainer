import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import {
  CHALLENGE_XP,
  CHALLENGES,
  CHALLENGES_PER_WEEK,
  challengeProgress,
  challengesFor,
  checkChallenges,
  weekOf,
} from '../src/lib/logic/challenges';
import { addDays } from '../src/lib/logic/srs';
import { newSave } from '../src/lib/storage/state';

describe('Wochen-Challenges', () => {
  it('beginnen die Woche am Montag (auch über Monats- und Jahresgrenzen)', () => {
    expect(weekOf('2026-11-04')).toBe('2026-11-02');
    expect(weekOf('2026-11-02')).toBe('2026-11-02');
    expect(weekOf('2026-11-08')).toBe('2026-11-02');
    expect(weekOf('2027-01-01')).toBe('2026-12-28');
  });

  it('sind je Woche drei verschiedene und rotieren durch den ganzen Vorrat', () => {
    const save = newSave();
    const seen = new Set<string>();
    let prev = '';
    for (let w = 0; w < CHALLENGES.length; w++) {
      const list = challengesFor(addDays('2026-11-02', 7 * w), save).map((c) => c.id);
      expect(list).toHaveLength(CHALLENGES_PER_WEEK);
      expect(new Set(list).size).toBe(CHALLENGES_PER_WEEK);
      expect(list.join()).not.toBe(prev);
      prev = list.join();
      list.forEach((id) => seen.add(id));
    }
    expect(seen.size).toBe(CHALLENGES.length);
  });

  it('lässt „neue Wörter“ weg, wenn es keine mehr gibt', () => {
    const save = newSave();
    for (const w of content.words) save.items[w.id] = { box: 1, due: '2026-11-04', seen: 1, right: 1, wrong: 0 };
    for (let w = 0; w < CHALLENGES.length; w++) {
      const list = challengesFor(addDays('2026-11-02', 7 * w), save);
      expect(list).toHaveLength(CHALLENGES_PER_WEEK);
      expect(list.map((c) => c.metric)).not.toContain('newWords');
    }
  });

  it('zählen ab Wochenbeginn, werden einmal erledigt und rollen in der nächsten Woche neu', () => {
    const save = newSave();
    save.stats.correct = 500;
    expect(checkChallenges(save, '2026-11-04')).toEqual([]);
    expect(save.challenges.week).toBe('2026-11-02');
    const c = CHALLENGES.find((x) => x.id === save.challenges.list[0]!.id)!;
    expect(challengeProgress(save, c.id)).toBe(0);

    save.stats[c.metric] += c.goal - 1;
    expect(checkChallenges(save, '2026-11-05')).toEqual([]);
    expect(challengeProgress(save, c.id)).toBe(c.goal - 1);
    save.stats[c.metric] += 5;
    expect(checkChallenges(save, '2026-11-06').map((x) => x.id)).toEqual([c.id]);
    expect(challengeProgress(save, c.id)).toBe(c.goal);
    expect(checkChallenges(save, '2026-11-07')).toEqual([]);

    checkChallenges(save, '2026-11-09');
    expect(save.challenges.week).toBe('2026-11-09');
    expect(save.challenges.list.every((s) => !s.done)).toBe(true);
    expect(CHALLENGE_XP).toBeGreaterThan(0);
  });
});
