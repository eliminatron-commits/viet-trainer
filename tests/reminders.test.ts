import { describe, expect, it } from 'vitest';
import {
  berlinTime,
  berlinToUtc,
  dueOn,
  emptyUser,
  reminderText,
  remindersDue,
  type PushUser,
} from '../worker/src/schedule';

const subscription = {
  endpoint: 'https://push.example.test/sub/1',
  keys: { p256dh: 'p256dh-test', auth: 'auth-test' },
};

function userWith(over: Partial<PushUser> = {}): PushUser {
  return { ...emptyUser(), subscription, ...over };
}

describe('berlinTime', () => {
  it('wechselt zwischen Winter- und Sommerzeit an den richtigen Tagen', () => {
    expect(berlinTime(new Date('2026-03-28T07:00:00Z'))).toEqual({ date: '2026-03-28', minutes: 8 * 60 });
    expect(berlinTime(new Date('2026-03-29T06:00:00Z'))).toEqual({ date: '2026-03-29', minutes: 8 * 60 });
    expect(berlinTime(new Date('2026-10-24T06:00:00Z'))).toEqual({ date: '2026-10-24', minutes: 8 * 60 });
    expect(berlinTime(new Date('2026-10-25T07:00:00Z'))).toEqual({ date: '2026-10-25', minutes: 8 * 60 });
  });

  it('springt über Mitternacht auf das nächste Datum', () => {
    expect(berlinTime(new Date('2026-06-30T22:30:00Z'))).toEqual({ date: '2026-07-01', minutes: 30 });
  });

  it('zeigt Mitternacht als 00:00 und nicht als 24:00', () => {
    expect(berlinTime(new Date('2026-06-30T22:00:00Z'))).toEqual({ date: '2026-07-01', minutes: 0 });
  });
});

describe('berlinToUtc', () => {
  it('rechnet Berliner Uhrzeit in UTC um (Winter- und Sommerzeit)', () => {
    expect(berlinToUtc('2026-03-29', '08:00').toISOString()).toBe('2026-03-29T06:00:00.000Z');
    expect(berlinToUtc('2026-03-28', '08:00').toISOString()).toBe('2026-03-28T07:00:00.000Z');
    expect(berlinToUtc('2026-10-25', '20:00').toISOString()).toBe('2026-10-25T19:00:00.000Z');
    expect(berlinToUtc('2026-07-15', '20:00').toISOString()).toBe('2026-07-15T18:00:00.000Z');
  });
});

describe('remindersDue', () => {
  const day = '2026-11-03';
  const at = (hhmm: string) => berlinToUtc(day, hhmm);

  it('sendet ohne Abo nichts', () => {
    expect(remindersDue(at('08:00'), { ...emptyUser() })).toEqual([]);
  });

  it('sendet vor der eingestellten Zeit nichts', () => {
    expect(remindersDue(at('07:59'), userWith())).toEqual([]);
  });

  it('sendet zur Zeit und innerhalb des Sendefensters (60 Min.)', () => {
    const morning = { slot: 'morning', date: day, send: true };
    expect(remindersDue(at('08:00'), userWith())).toEqual([morning]);
    expect(remindersDue(at('08:59'), userWith())).toEqual([morning]);
  });

  it('sendet nach dem Sendefenster nichts mehr', () => {
    expect(remindersDue(at('09:00'), userWith())).toEqual([]);
  });

  it('sendet keine zweite Erinnerung am selben Tag', () => {
    expect(remindersDue(at('08:10'), userWith({ sent: { morning: day, evening: null } }))).toEqual([]);
    expect(remindersDue(at('20:10'), userWith({ sent: { morning: null, evening: day } }))).toEqual([]);
  });

  it('Abend: sendet, wenn das Tagesziel nicht erreicht ist (goalDate null oder gestern)', () => {
    const evening = { slot: 'evening', date: day, send: true };
    expect(remindersDue(at('20:00'), userWith())).toEqual([evening]);
    expect(remindersDue(at('20:00'), userWith({ goalDate: '2026-11-02' }))).toEqual([evening]);
  });

  it('Abend entfällt (send:false), wenn das Tagesziel heute erreicht ist', () => {
    expect(remindersDue(at('20:00'), userWith({ goalDate: day }))).toEqual([
      { slot: 'evening', date: day, send: false },
    ]);
  });

  it('Morgen ist immer send:true, auch bei erreichtem Tagesziel', () => {
    expect(remindersDue(at('08:00'), userWith({ goalDate: day }))).toEqual([
      { slot: 'morning', date: day, send: true },
    ]);
  });

  it('Morgen-Erinnerung kommt am Tag der Umstellung auf Sommerzeit zur richtigen UTC-Zeit', () => {
    const dst = '2026-03-29';
    const user = userWith();
    const onTime = new Date('2026-03-29T06:00:00Z'); // 08:00 MESZ
    expect(remindersDue(onTime, user)).toEqual([{ slot: 'morning', date: dst, send: true }]);
    expect(remindersDue(new Date(onTime.getTime() - 60_000), user)).toEqual([]);
  });

  it('Morgen-Erinnerung kommt am Tag der Umstellung auf Winterzeit zur richtigen UTC-Zeit', () => {
    const dst = '2026-10-25';
    const user = userWith();
    const onTime = new Date('2026-10-25T07:00:00Z'); // 08:00 MEZ
    expect(remindersDue(onTime, user)).toEqual([{ slot: 'morning', date: dst, send: true }]);
    expect(remindersDue(new Date(onTime.getTime() - 60_000), user)).toEqual([]);
  });
});

describe('dueOn', () => {
  const user = userWith({ dueByDate: { '2026-11-03': 2, '2026-11-05': 4 } });

  it('liefert den Stand des Tages und bleibt zwischen den Vorschautagen beim letzten Wert', () => {
    expect(dueOn(user, '2026-11-02')).toBe(0);
    expect(dueOn(user, '2026-11-03')).toBe(2);
    expect(dueOn(user, '2026-11-04')).toBe(2);
    expect(dueOn(user, '2026-11-05')).toBe(4);
  });

  it('gilt jenseits der Vorschau der letzte bekannte Wert', () => {
    expect(dueOn(user, '2026-12-01')).toBe(4);
  });
});

describe('reminderText', () => {
  const day = '2026-11-03';

  it('Morgentext nennt die gemeldete Anzahl (Singular)', () => {
    const user = userWith({ dueByDate: { [day]: 1 } });
    expect(reminderText('morning', day, user)).toEqual({
      title: 'Zeit für Vietnamesisch',
      body: 'Eine Wiederholung wartet auf dich.',
    });
  });

  it('Morgentext nennt die gemeldete Anzahl (Plural)', () => {
    const user = userWith({ dueByDate: { [day]: 3 } });
    expect(reminderText('morning', day, user).body).toBe('3 Wiederholungen warten auf dich.');
  });

  it('bei 0 Wiederholungen allgemeiner Text', () => {
    const user = userWith({ dueByDate: { [day]: 0 } });
    expect(reminderText('morning', day, user).body).toBe('Eine kurze Runde für deine Serie?');
  });

  it('jenseits der Vorschau zählt der letzte bekannte Wert', () => {
    const user = userWith({ dueByDate: { [day]: 4 } });
    expect(reminderText('morning', '2026-12-01', user).body).toBe('4 Wiederholungen warten auf dich.');
  });

  it('Abendtext ist unabhängig von der Anzahl', () => {
    expect(reminderText('evening', day, userWith())).toEqual({
      title: 'Tagesziel noch offen',
      body: 'Drei Minuten reichen, damit deine Serie hält.',
    });
  });
});
