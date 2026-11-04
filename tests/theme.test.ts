import { describe, expect, it } from 'vitest';
import { isDark, isNightAt, msUntilSwitch } from '../src/lib/logic/theme';
import { newSave, normalizeSave } from '../src/lib/storage/state';

const at = (iso: string) => new Date(iso);
const HOUR = 3_600_000;

describe('Darstellung Tag/Nacht', () => {
  it('ist von 20:00 bis 8:59 Nacht, sonst Tag', () => {
    expect(isNightAt(at('2026-11-04T19:59:59'))).toBe(false);
    expect(isNightAt(at('2026-11-04T20:00:00'))).toBe(true);
    expect(isNightAt(at('2026-11-05T00:30:00'))).toBe(true);
    expect(isNightAt(at('2026-11-05T08:59:59'))).toBe(true);
    expect(isNightAt(at('2026-11-05T09:00:00'))).toBe(false);
    expect(isNightAt(at('2026-11-05T13:00:00'))).toBe(false);
  });

  it('folgt im Automatik-Modus der Uhrzeit, fest gewählt immer der Wahl', () => {
    const night = at('2026-11-04T22:00:00');
    const day = at('2026-11-04T12:00:00');
    expect(isDark('auto', night)).toBe(true);
    expect(isDark('auto', day)).toBe(false);
    expect(isDark('light', night)).toBe(false);
    expect(isDark('dark', day)).toBe(true);
  });

  it('plant den nächsten Wechsel auf 20:00 bzw. 9:00 Uhr', () => {
    expect(msUntilSwitch(at('2026-11-04T12:00:00'))).toBe(8 * HOUR);
    expect(msUntilSwitch(at('2026-11-04T20:00:00'))).toBe(13 * HOUR);
    expect(msUntilSwitch(at('2026-11-04T23:30:00'))).toBe(9.5 * HOUR);
    expect(msUntilSwitch(at('2026-11-05T03:00:00'))).toBe(6 * HOUR);
    expect(msUntilSwitch(at('2026-11-05T08:59:00'))).toBe(60_000);
  });

  it('startet für neue und alte Spielstände im Automatik-Modus', () => {
    expect(newSave().settings.theme).toBe('auto');
    const old = newSave() as unknown as { settings: Record<string, unknown> };
    delete old.settings.theme;
    expect(normalizeSave(old).settings.theme).toBe('auto');
  });
});
