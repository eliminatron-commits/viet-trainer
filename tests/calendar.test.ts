import { describe, expect, it } from 'vitest';
import {
  calendarMonth,
  DIARY_START,
  dayInfo,
  dayTitle,
  diaryStart,
  lanternOf,
  monthRange,
  monthSummary,
  shiftMonth,
} from '../src/lib/logic/calendar';
import { logNewWord, logRound, logShields, logTask } from '../src/lib/logic/diary';
import { addXp } from '../src/lib/logic/rewards';
import { emptyDay, newSave, type DayLog } from '../src/lib/storage/state';

const TODAY = '2026-11-20';
const START = DIARY_START;
const log = (patch: Partial<DayLog>): DayLog => ({ ...emptyDay(), ...patch });

describe('Laterne je Tag', () => {
  it('Vorrang: Zukunft, Tagesziel, Streak-Schutz, gelernt, sonst aus bzw. vor dem Tagebuch', () => {
    expect(lanternOf(log({ goal: true, tasks: 5 }), '2026-11-21', TODAY, START)).toBe('future');
    expect(lanternOf(log({ goal: true, tasks: 5 }), TODAY, TODAY, START)).toBe('goal');
    // Im Spiel nie zugleich (der Schutz überbrückt nur Tage nach dem letzten Tagesziel); im Zweifel zählt das Ziel.
    expect(lanternOf(log({ goal: true, shield: true }), '2026-11-10', TODAY, START)).toBe('goal');
    // Ein überbrückter Tag mit etwas Aktivität (Tagesziel verfehlt) zeigt den Streak-Schutz.
    expect(lanternOf(log({ shield: true, tasks: 3 }), '2026-11-10', TODAY, START)).toBe('shield');
    expect(lanternOf(log({ tasks: 1 }), '2026-11-10', TODAY, START)).toBe('learned');
    expect(lanternOf(log({ newWords: 2 }), '2026-11-10', TODAY, START)).toBe('learned');
    expect(lanternOf(log({ rounds: 1 }), '2026-11-10', TODAY, START)).toBe('learned');
    expect(lanternOf(log({ xp: 20 }), '2026-11-10', TODAY, START)).toBe('learned');
    expect(lanternOf(emptyDay(), '2026-11-10', TODAY, START)).toBe('off');
    expect(lanternOf(undefined, '2026-11-10', TODAY, START)).toBe('off');
    expect(lanternOf(undefined, '2026-11-06', TODAY, START)).toBe('before');
    expect(lanternOf(undefined, START, TODAY, START)).toBe('off');
  });

  it('das Tagebuch zählt ab dem Update oder ab einem späteren Spielstand', () => {
    expect(diaryStart(newSave(new Date('2026-11-02T10:00:00Z')))).toBe(DIARY_START);
    expect(diaryStart(newSave(new Date('2026-12-03T10:00:00Z')))).toBe('2026-12-03');
  });
});

describe('Monat', () => {
  it('November 2026: beginnt am Sonntag, 30 Tage, Zustände und Zähler aus dem Tagebuch', () => {
    const save = newSave(new Date('2026-11-01T10:00:00Z'));
    save.days = {
      '2026-11-07': log({ tasks: 20, right: 18, xp: 90, goal: true }),
      '2026-11-08': log({ tasks: 4, right: 3, xp: 15 }),
      '2026-11-10': log({ shield: true }),
      '2026-11-12': log({ newWords: 3 }),
      '2026-11-25': log({ goal: true, tasks: 9 }), // Uhr stand einmal vor: zählt nicht, liegt in der Zukunft
    };
    const c = calendarMonth(save, '2026-11', TODAY);
    expect(c.title).toBe('November 2026');
    expect(c.lead).toBe(6);
    expect(c.days).toHaveLength(30);
    expect(c.days.map((d) => d.day)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    const at = (day: number) => c.days[day - 1]!;
    expect(at(1).lantern).toBe('before');
    expect(at(6).lantern).toBe('before');
    expect(at(7).lantern).toBe('goal');
    expect(at(8).lantern).toBe('learned');
    expect(at(9).lantern).toBe('off');
    expect(at(10).lantern).toBe('shield');
    expect(at(12).lantern).toBe('learned');
    expect(at(20)).toMatchObject({ today: true, lantern: 'off' });
    expect(c.days.filter((d) => d.today)).toHaveLength(1);
    expect(at(25).lantern).toBe('future');
    expect(at(7).log).toMatchObject({ xp: 90 });
    expect(at(9).log).toBeNull();
    expect({ learned: c.learned, goals: c.goals, shields: c.shields }).toEqual({ learned: 3, goals: 1, shields: 1 });
  });

  it('Monatslängen und Wochenbeginn Montag', () => {
    const save = newSave();
    const feb27 = calendarMonth(save, '2027-02', TODAY);
    expect(feb27.lead).toBe(0); // 1. Februar 2027 ist ein Montag
    expect(feb27.days).toHaveLength(28);
    expect(calendarMonth(save, '2028-02', TODAY).days).toHaveLength(29);
    expect(calendarMonth(save, '2026-12', TODAY).days).toHaveLength(31);
    expect(calendarMonth(save, '2026-12', TODAY).lead).toBe(1); // Dienstag
    expect(calendarMonth(save, '2027-08', TODAY).lead).toBe(6); // Sonntag
  });

  it('Monate blättern über den Jahreswechsel', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2027-01', -1)).toBe('2026-12');
    expect(shiftMonth('2026-11', -13)).toBe('2025-10');
    expect(shiftMonth('2026-11', 0)).toBe('2026-11');
  });

  it('blätterbar vom ersten Eintrag bis zum laufenden Monat; ohne Einträge nur dieser Monat', () => {
    const save = newSave();
    expect(monthRange(save, '2027-02-03')).toEqual({ first: '2027-02', last: '2027-02' });
    save.days = { '2026-11-07': log({ tasks: 1 }), '2027-01-15': log({ tasks: 2 }), '2027-05-01': log({ tasks: 1 }) };
    expect(monthRange(save, '2027-02-03')).toEqual({ first: '2026-11', last: '2027-02' });
  });
});

describe('Texte', () => {
  it('Tag mit Wochentag', () => {
    expect(dayTitle('2026-11-07')).toBe('Samstag, 7. November');
    expect(dayTitle('2026-11-09')).toBe('Montag, 9. November');
    expect(dayTitle('2027-03-01')).toBe('Montag, 1. März');
  });

  it('Monatszeile mit Einzahl und Mehrzahl', () => {
    const save = newSave();
    const c = (days: Record<string, DayLog>) => {
      save.days = days;
      return monthSummary(calendarMonth(save, '2026-11', TODAY));
    };
    expect(c({})).toBe('Noch kein Lerntag');
    expect(c({ '2026-11-10': log({ shield: true }) })).toBe('1 Tag vom Streak-Schutz gerettet');
    expect(c({ '2026-11-10': log({ tasks: 1 }) })).toBe('1 Lerntag · 0 Tagesziele');
    expect(c({ '2026-11-10': log({ goal: true }), '2026-11-11': log({ tasks: 1 }) })).toBe('2 Lerntage · 1 Tagesziel');
  });

  it('angetippter Tag zeigt seine Zahlen – immer vier, vor dem Tagebuch ohne Wert', () => {
    const save = newSave();
    save.days = {
      '2026-11-07': log({ xp: 62, tasks: 14, right: 12, newWords: 5, rounds: 2, goal: true }),
      '2026-11-08': log({ xp: 5, tasks: 1, right: 1, newWords: 1, rounds: 1 }),
      '2026-11-10': log({ shield: true }),
    };
    const c = calendarMonth(save, '2026-11', TODAY);
    const info = (day: number) => dayInfo(c.days[day - 1]!, START);

    expect(info(7)).toEqual({
      title: 'Samstag, 7. November',
      status: 'Tagesziel erreicht · 2 Runden',
      numbers: [
        { value: '62', label: 'XP' },
        { value: '14', label: 'Aufgaben' },
        { value: '12', label: 'richtig' },
        { value: '5', label: 'neue Wörter' },
      ],
    });
    expect(info(8).status).toBe('Gelernt, Tagesziel nicht erreicht · 1 Runde');
    expect(info(8).numbers.map((n) => n.label)).toEqual(['XP', 'Aufgabe', 'richtig', 'neues Wort']);
    expect(info(10).status).toBe('Der Streak-Schutz hat die Serie gerettet');
    expect(info(9)).toMatchObject({ status: 'Nicht gelernt' });
    expect(info(9).numbers.map((n) => n.value)).toEqual(['0', '0', '0', '0']);
    expect(info(20).status).toBe('Heute noch nichts gelernt');
    expect(info(3).status).toBe('Vor dem Tagebuch – es zählt seit dem 7. November 2026');
    expect(info(3).numbers.map((n) => n.value)).toEqual(['–', '–', '–', '–']);

    save.days[TODAY] = log({ tasks: 3, right: 2, xp: 10 });
    expect(dayInfo(calendarMonth(save, '2026-11', TODAY).days[19]!, START).status).toBe('Gelernt – das Tagesziel fehlt noch');
  });
});

describe('mit dem echten Tagebuch', () => {
  it('Aufgaben, Tagesziel und Streak-Schutz landen in der richtigen Laterne', () => {
    const save = newSave(new Date('2026-11-01T10:00:00Z'));
    logNewWord(save, '2026-11-08');
    expect(calendarMonth(save, '2026-11', TODAY).days[7]!.lantern).toBe('learned');

    save.today = { date: '2026-11-09', xp: 0 };
    logTask(save, '2026-11-09', true);
    addXp(save, save.dailyGoal, '2026-11-09');
    logRound(save, '2026-11-09');
    logShields(save, '2026-11-09', 2);
    const c = calendarMonth(save, '2026-11', TODAY);
    expect(c.days.slice(7, 12).map((d) => d.lantern)).toEqual(['learned', 'goal', 'shield', 'shield', 'off']);
  });
});
