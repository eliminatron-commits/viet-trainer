import { describe, expect, it, vi } from 'vitest';
import { buildLabel } from '../src/lib/build';
import { createUpdateCheck, UPDATE_INTERVAL_MS } from '../src/lib/update';

type Fake = { update: ReturnType<typeof vi.fn>; installing: object | null; waiting: object | null };

/** Nachgebaute SW-Registrierung: update() findet eine neue Version (installing) oder nicht. */
function fakeRegistration(finds: 'nothing' | 'new' | 'offline'): Fake {
  const reg: Fake = { installing: null, waiting: null, update: vi.fn() };
  reg.update.mockImplementation(async () => {
    if (finds === 'offline') throw new TypeError('Failed to fetch');
    if (finds === 'new') reg.installing = {};
    return reg;
  });
  return reg;
}

function checker(reg: Fake | undefined, clock = { t: 1_000_000 }) {
  const check = createUpdateCheck(() => reg as unknown as ServiceWorkerRegistration | undefined, () => clock.t);
  return { check, clock };
}

describe('Update-Suche', () => {
  it('meldet eine neue Version, sobald update() einen installierenden SW liefert', async () => {
    const { check } = checker(fakeRegistration('new'));
    expect(await check()).toBe('found');
  });

  it('meldet auch einen schon wartenden SW als gefunden', async () => {
    const reg = fakeRegistration('nothing');
    reg.waiting = {};
    expect(await checker(reg).check()).toBe('found');
  });

  it('ohne neue Version: aktuell', async () => {
    expect(await checker(fakeRegistration('nothing')).check()).toBe('current');
  });

  it('ohne Netz: offline statt Fehler', async () => {
    expect(await checker(fakeRegistration('offline')).check()).toBe('offline');
  });

  it('ohne Registrierung (Entwicklung): nicht verfügbar', async () => {
    expect(await checker(undefined).check()).toBe('unavailable');
  });

  it('automatisch höchstens einmal pro Minute, die Suche per Knopf immer', async () => {
    const reg = fakeRegistration('nothing');
    const { check, clock } = checker(reg);
    await check();
    clock.t += UPDATE_INTERVAL_MS - 1;
    expect(await check()).toBe('skipped');
    expect(reg.update).toHaveBeenCalledTimes(1);
    expect(await check(true)).toBe('current');
    expect(reg.update).toHaveBeenCalledTimes(2);
    clock.t += UPDATE_INTERVAL_MS;
    expect(await check()).toBe('current');
    expect(reg.update).toHaveBeenCalledTimes(3);
  });
});

describe('Versionszeile', () => {
  it('zeigt Version, Build-Zeit in Berliner Ortszeit und Commit', () => {
    expect(buildLabel({ version: '2.0.0', commit: '7ed930e', time: '2026-11-05T17:20:00.000Z' })).toBe(
      'Version 2.0.0 · 05.11.2026, 18:20 · 7ed930e',
    );
  });

  it('lässt fehlende Teile weg (Entwicklung)', () => {
    expect(buildLabel({ version: 'dev', commit: '', time: '' })).toBe('Version dev');
  });
});
