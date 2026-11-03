import { describe, expect, it } from 'vitest';
import { addDays, answerItem, dueForecast, markSeen } from '../src/lib/logic/srs';
import type { ItemProgress, ProgressKey } from '../src/lib/storage/state';

const TODAY = '2026-11-03';

describe('addDays', () => {
  it('rechnet über Monats- und Jahresgrenzen', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('verschluckt keinen Tag an den Sommerzeit-Umstellungen', () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
  });
});

describe('Intervalle (answerItem)', () => {
  it('wandert bei immer richtigen Antworten am Fälligkeitstag durch Box 1–5 und bleibt bei +16', () => {
    let p = answerItem(undefined, true, '2026-11-03');
    expect(p).toMatchObject({ box: 1, due: '2026-11-04' });

    p = answerItem(p, true, '2026-11-04');
    expect(p).toMatchObject({ box: 2, due: '2026-11-06' });

    p = answerItem(p, true, '2026-11-06');
    expect(p).toMatchObject({ box: 3, due: '2026-11-10' });

    p = answerItem(p, true, '2026-11-10');
    expect(p).toMatchObject({ box: 4, due: '2026-11-18' });

    p = answerItem(p, true, '2026-11-18');
    expect(p).toMatchObject({ box: 5, due: '2026-12-04' });

    p = answerItem(p, true, '2026-12-04');
    expect(p).toMatchObject({ box: 5, due: '2026-12-20' });
  });

  it('erste richtige Antwort ohne Vorstand: Box 1, morgen, zählt right und seen', () => {
    expect(answerItem(undefined, true, TODAY)).toEqual({ box: 1, due: '2026-11-04', seen: 1, right: 1, wrong: 0 });
  });

  it('erste richtige Antwort nach markSeen: Box 1, morgen (right war 0)', () => {
    const seen = markSeen(undefined, TODAY);
    expect(answerItem(seen, true, TODAY)).toEqual({ box: 1, due: '2026-11-04', seen: 2, right: 1, wrong: 0 });
  });

  it('richtig, aber noch nicht fällig: Box und due bleiben, right und seen zählen hoch', () => {
    const p: ItemProgress = { box: 3, due: '2026-11-10', seen: 5, right: 4, wrong: 1 };
    expect(answerItem(p, true, '2026-11-05')).toEqual({ box: 3, due: '2026-11-10', seen: 6, right: 5, wrong: 1 });
  });

  it('falsch: eine Box tiefer, morgen wieder, wrong+1', () => {
    const p: ItemProgress = { box: 4, due: TODAY, seen: 4, right: 3, wrong: 0 };
    expect(answerItem(p, false, TODAY)).toEqual({ box: 3, due: '2026-11-04', seen: 5, right: 3, wrong: 1 });
  });

  it('falsch in Box 1 bleibt in Box 1 (Minimum)', () => {
    const p: ItemProgress = { box: 1, due: TODAY, seen: 2, right: 1, wrong: 0 };
    expect(answerItem(p, false, TODAY)).toMatchObject({ box: 1, due: '2026-11-04', wrong: 1 });
  });

  it('falsch ohne vorherigen Stand: Box 1, morgen, wrong 1', () => {
    expect(answerItem(undefined, false, TODAY)).toEqual({ box: 1, due: '2026-11-04', seen: 1, right: 0, wrong: 1 });
  });
});

describe('markSeen', () => {
  it('neuer Stand: Box 1, heute fällig, seen 1, right und wrong 0', () => {
    expect(markSeen(undefined, TODAY)).toEqual({ box: 1, due: TODAY, seen: 1, right: 0, wrong: 0 });
  });

  it('bestehender Stand: nur seen plus 1', () => {
    const p: ItemProgress = { box: 3, due: '2026-11-10', seen: 2, right: 2, wrong: 0 };
    expect(markSeen(p, TODAY)).toEqual({ box: 3, due: '2026-11-10', seen: 3, right: 2, wrong: 0 });
  });
});

describe('dueForecast', () => {
  const prog = (due: string): ItemProgress => ({ box: 1, due, seen: 1, right: 1, wrong: 0 });

  it('zählt kumulativ je Tag: fällig an oder vor dem Tag', () => {
    const items: Partial<Record<ProgressKey, ItemProgress>> = {
      w001: prog('2026-11-03'),
      w002: prog('2026-11-05'),
      w003: prog('2026-11-03'),
      s001: prog('2026-11-10'),
    };
    expect(dueForecast(items, TODAY, 5)).toEqual({
      '2026-11-03': 2,
      '2026-11-04': 2,
      '2026-11-05': 3,
      '2026-11-06': 3,
      '2026-11-07': 3,
    });
  });

  it('zählt überfällige Einheiten zu heute mit und liefert standardmäßig 14 Tage', () => {
    const items: Partial<Record<ProgressKey, ItemProgress>> = { w001: prog('2026-10-20') };
    const out = dueForecast(items, TODAY);
    expect(Object.keys(out)).toHaveLength(14);
    expect(out['2026-11-03']).toBe(1);
    expect(out['2026-11-16']).toBe(1);
  });

  it('läuft korrekt über die Sommerzeit-Umstellung', () => {
    const items: Partial<Record<ProgressKey, ItemProgress>> = { w001: prog('2026-10-25') };
    expect(dueForecast(items, '2026-10-24', 3)).toEqual({
      '2026-10-24': 0,
      '2026-10-25': 1,
      '2026-10-26': 1,
    });
  });
});
