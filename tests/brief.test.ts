import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { briefDue, briefItems, greeting, nextStep } from '../src/lib/logic/brief';
import { coreKeys } from '../src/lib/logic/path';
import { focusInfo } from '../src/lib/logic/session';
import { newSave, normalizeSave, type ItemProgress, type SaveState } from '../src/lib/storage/state';

const TODAY = '2026-11-10'; // Dienstag, Woche ab 9. November
const WEEK = '2026-11-09';
const learned = (due: string): ItemProgress => ({ box: 2, due, seen: 2, right: 1, wrong: 0 });
const words = content.words.filter((w) => w.kind === 'word');

/** Spielstand mit `fine` gelernten Wörtern (fällig später) und `thirsty` fälligen. */
function setup(fine: number, thirsty: number): SaveState {
  const save = newSave(new Date(`${TODAY}T08:00:00`));
  words.slice(0, fine).forEach((w) => (save.items[w.id] = learned('2026-11-20')));
  words.slice(fine, fine + thirsty).forEach((w) => (save.items[w.id] = learned('2026-11-09')));
  save.challenges = { week: WEEK, list: [] };
  return save;
}

describe('Punkte des Tagesblicks', () => {
  it('durstige Pflanzen: Anzahl in Einzahl und Mehrzahl, führt zur Gießrunde; ohne durstige kein Punkt', () => {
    expect(briefItems(setup(4, 3), TODAY)[0]).toMatchObject({ kind: 'water', title: '3 Pflanzen sind durstig', action: 'Feld gießen', target: { kind: 'water' }, progress: null });
    expect(briefItems(setup(4, 1), TODAY)[0]!.title).toBe('Eine Pflanze ist durstig');
    expect(briefItems(setup(4, 0), TODAY).map((i) => i.kind)).not.toContain('water');
  });

  it('Tagesziel: was fehlt, mit dem nächsten Schritt auf dem Lernpfad; erreicht kein Punkt; XP von gestern zählen nicht', () => {
    const save = setup(2, 0);
    save.today = { date: TODAY, xp: 15 };
    const goal = briefItems(save, TODAY).find((i) => i.kind === 'goal')!;
    expect(goal).toMatchObject({ title: 'Noch 35 XP bis zum Tagesziel', detail: 'Weiter mit Etappe 1: Ich & du', action: 'Weiter lernen', target: { kind: 'stage', stage: 'e01' }, progress: 0.3 });
    save.today = { date: '2026-11-09', xp: 80 };
    expect(briefItems(save, TODAY).find((i) => i.kind === 'goal')!.title).toBe('Noch 50 XP bis zum Tagesziel');
    save.today = { date: TODAY, xp: 50 };
    expect(briefItems(save, TODAY).map((i) => i.kind)).not.toContain('goal');
  });

  it('nächster Schritt: Etappe, ihr Boss, oder nach der letzten Etappe das Training', () => {
    const save = setup(0, 0);
    expect(nextStep(save).target).toEqual({ kind: 'stage', stage: 'e01' });
    for (const k of coreKeys('e01')) save.items[k] = learned('2026-11-20');
    expect(nextStep(save)).toMatchObject({ target: { kind: 'boss', stage: 'e01' }, action: 'Zum Boss', detail: 'Der Boss von Etappe 1 wartet: Ich & du' });
    save.stages.e01 = { done: true, bossBest: 3 };
    expect(nextStep(save).target).toEqual({ kind: 'stage', stage: 'e02' });
    for (const s of content.stages) save.stages[s.id] = { done: true, bossBest: 3 };
    expect(nextStep(save)).toMatchObject({ target: { kind: 'training', focus: 'mixed' }, action: 'Training' });
  });

  it('Wochen-Challenge: die dem Ziel am nächsten ist, mit passender Übung; geschaffte und alte Wochen nicht', () => {
    const save = setup(12, 0);
    save.stats.rounds = 6;
    save.stats.newWords = 3;
    save.challenges = {
      week: WEEK,
      list: [
        { id: 'neu', base: 0, done: false }, // 3 von 12
        { id: 'runden', base: 0, done: false }, // 6 von 8 – am nächsten
        { id: 'richtig', base: 0, done: true },
      ],
    };
    const c = briefItems(save, TODAY).find((i) => i.kind === 'challenge')!;
    expect(c).toMatchObject({ title: '8 Runden spielen', detail: 'Wochen-Challenge: 6 von 8', action: 'Training', target: { kind: 'training', focus: 'mixed' }, progress: 0.75 });
    // ohne Übung (neue Wörter) geht es auf dem Lernpfad weiter
    save.challenges.list[1]!.done = true;
    expect(briefItems(save, TODAY).find((i) => i.kind === 'challenge')).toMatchObject({ title: '12 neue Wörter lernen', action: 'Weiter lernen', target: { kind: 'stage', stage: 'e01' } });
    save.challenges.list[0]!.done = true;
    expect(briefItems(save, TODAY).map((i) => i.kind)).not.toContain('challenge');
    // Liste einer alten Woche (noch nicht gewechselt): kein Punkt
    save.challenges = { week: '2026-11-02', list: [{ id: 'runden', base: 0, done: false }] };
    expect(briefItems(save, TODAY).map((i) => i.kind)).not.toContain('challenge');
  });

  it('gesperrte Übung (zu wenig gelernt): weiter auf dem Lernpfad statt in einen leeren Modus', () => {
    const save = setup(1, 0);
    expect(focusInfo(save, 'pairs').available).toBe(false);
    save.challenges = { week: WEEK, list: [{ id: 'paare', base: 0, done: false }] };
    expect(briefItems(save, TODAY).find((i) => i.kind === 'challenge')).toMatchObject({ action: 'Weiter lernen', target: { kind: 'stage', stage: 'e01' } });
    const more = setup(12, 0);
    more.challenges = { week: WEEK, list: [{ id: 'paare', base: 0, done: false }] };
    expect(focusInfo(more, 'pairs').available).toBe(true);
    expect(briefItems(more, TODAY).find((i) => i.kind === 'challenge')).toMatchObject({ action: 'Paare spielen', target: { kind: 'training', focus: 'pairs' } });
  });

  it('Reihenfolge: Pflanzen, Tagesziel, Challenge', () => {
    const save = setup(8, 2);
    save.challenges = { week: WEEK, list: [{ id: 'runden', base: 0, done: false }] };
    expect(briefItems(save, TODAY).map((i) => i.kind)).toEqual(['water', 'goal', 'challenge']);
  });
});

describe('wann', () => {
  it('einmal am Tag, nur eingeschaltet und wenn schon einmal gelernt wurde', () => {
    const save = setup(2, 0);
    expect(briefDue(save, TODAY)).toBe(true);
    save.brief.seen = TODAY;
    expect(briefDue(save, TODAY)).toBe(false);
    expect(briefDue(save, '2026-11-11')).toBe(true);
    save.settings.brief = false;
    expect(briefDue(save, '2026-11-11')).toBe(false);
    expect(briefDue(newSave(), TODAY)).toBe(false);
  });

  it('alte Stände: eingeschaltet und noch nie gezeigt', () => {
    const old = JSON.parse(JSON.stringify(newSave())) as Record<string, unknown> & { settings: Record<string, unknown> };
    delete old.brief;
    delete old.settings.brief;
    expect(normalizeSave(old)).toMatchObject({ brief: { seen: null }, settings: { brief: true } });
    expect(normalizeSave({ ...old, brief: { seen: 7 }, settings: { ...old.settings, brief: 'ja' } })).toMatchObject({ brief: { seen: null }, settings: { brief: true } });
  });

  it('Gruß nach Uhrzeit', () => {
    expect([7, 10, 11, 17, 18, 23].map(greeting)).toEqual(['Guten Morgen', 'Guten Morgen', 'Hallo', 'Hallo', 'Guten Abend', 'Guten Abend']);
  });
});
