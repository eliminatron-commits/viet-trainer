import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import { newSave, normalizeSave } from '../src/lib/storage/state';

/** Simuliert einen App-Neustart: Module frisch laden, neue DB-Verbindung öffnen. */
async function freshPersist() {
  vi.resetModules();
  return import('../src/lib/storage/persist');
}

describe('Speicherschicht', () => {
  it('liefert ohne gespeicherten Stand einen neuen Spielstand', async () => {
    indexedDB.deleteDatabase('viet-trainer');
    const p = await freshPersist();
    const s = await p.loadSave(p.openSaveStore());
    expect(s.xp).toBe(0);
    expect(s.items).toEqual({});
  });

  it('übersteht Speichern und Laden über einen Reload', async () => {
    const a = await freshPersist();
    const state = await a.loadSave(a.openSaveStore());
    state.xp = 120;
    state.items.w001 = { box: 2, due: '2026-11-04', seen: 3, right: 2, wrong: 1 };
    state.favorites.push('s042');
    state.review.w300 = { verdict: 'unnatural', note: 'sagt man so nicht' };
    await a.writeSave(state, a.openSaveStore());

    const b = await freshPersist();
    const loaded = await b.loadSave(b.openSaveStore());
    expect(loaded).toEqual(state);
  });

  it('speichert jede Änderung sofort (letzter Schreibvorgang gewinnt)', async () => {
    const p = await freshPersist();
    const store = p.openSaveStore();
    const s = await p.loadSave(store);
    for (let i = 1; i <= 5; i++) {
      s.xp = i;
      await p.writeSave(s, store);
    }
    const r = await freshPersist();
    expect((await r.loadSave(r.openSaveStore())).xp).toBe(5);
  });
});

describe('Export/Import', () => {
  it('stellt einen exportierten Stand vollständig wieder her', async () => {
    const p = await freshPersist();
    const s = newSave(new Date('2026-11-02T08:00:00'));
    s.xp = 777;
    s.streak = { count: 4, lastDate: '2026-11-01', shields: 1, best: 4 };
    s.settings.morning = '07:15';
    expect(p.importSave(p.exportSave(s))).toEqual(s);
  });

  it('weist kaputte oder fremde Dateien ab', async () => {
    const p = await freshPersist();
    expect(() => p.importSave('kein json')).toThrow('kein gültiges JSON');
    expect(() => p.importSave('[]')).toThrow('Kein gültiger Spielstand');
    expect(() => p.importSave(JSON.stringify({ version: 99 }))).toThrow('Version');
    expect(() => p.importSave(JSON.stringify({ ...newSave(), xp: 'viel' }))).toThrow('xp');
  });

  it('ergänzt fehlende Felder älterer Stände mit Standardwerten', () => {
    const old = newSave() as unknown as Record<string, unknown>;
    delete old.challenges;
    old.settings = { morning: '06:30' };
    const s = normalizeSave(old);
    expect(s.challenges).toEqual({ week: null, list: [] });
    expect(s.settings).toEqual({ ...newSave().settings, morning: '06:30' });
  });

  it('trägt bei Ständen ohne Zähler ab, was der Fortschritt hergibt (Phase-3-Update)', () => {
    const old = newSave() as unknown as Record<string, unknown> & ReturnType<typeof newSave>;
    old.items = {
      w001: { box: 2, due: '2026-11-05', seen: 4, right: 3, wrong: 1 },
      w002: { box: 1, due: '2026-11-05', seen: 1, right: 0, wrong: 0 },
      s001: { box: 1, due: '2026-11-05', seen: 2, right: 2, wrong: 0 },
      'em:self': { box: 1, due: '2026-11-05', seen: 1, right: 1, wrong: 0 },
    };
    old.stages = { e01: { done: true, bossBest: 3 }, e02: { done: true, bossBest: 1 }, e03: { done: false, bossBest: 0 } };
    old.streak = { count: 5, lastDate: '2026-11-04', shields: 0 } as typeof old.streak;
    delete (old as Record<string, unknown>).stats;
    const s = normalizeSave(old);
    expect(s.stats).toMatchObject({ correct: 6, newWords: 2, bossWins: 2, perfectBosses: 1, rounds: 0, chests: 0 });
    expect(s.streak.best).toBe(5);
    expect(s.inventory.perfectChests).toBe(0);

    // Stände mit Zählern bleiben unangetastet.
    const fresh = newSave();
    fresh.items = old.items;
    expect(normalizeSave(fresh).stats.correct).toBe(0);
  });
});
