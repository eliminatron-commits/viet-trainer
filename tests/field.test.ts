import { describe, expect, it } from 'vitest';
import { content } from '../src/content';
import { FIELD, capacity, fieldChanges, fieldOrder, fieldSlots, nearestSlot, plantInfo, plantOf, plantShape, type Plant } from '../src/lib/logic/field';
import type { ItemProgress, ProgressKey } from '../src/lib/storage/state';

const DAY = '2026-11-06';
const prog = (box: ItemProgress['box'], due: string): ItemProgress => ({ box, due, seen: 3, right: 2, wrong: 0 });

/** Alles, was je eine Pflanze werden kann: Wörter, Sätze und Rollen (ich/du). */
const ALL = content.words.length + content.sentences.length + content.roles.reduce((n, r) => n + (r.addr ? 2 : 1), 0);

describe('Reisfeld', () => {
  it('Wuchs folgt der SRS-Box, fällige Pflanzen sind durstig', () => {
    expect(plantOf(prog(3, '2026-11-09'), DAY)).toEqual({ stage: 3, thirsty: false });
    expect(plantOf(prog(5, DAY), DAY)).toEqual({ stage: 5, thirsty: true });
    expect(plantOf(prog(1, '2026-11-01'), DAY)).toEqual({ stage: 1, thirsty: true });
  });

  it('jede Einheit bekommt einen Platz im Feld – auch wenn alles gelernt ist', () => {
    expect(ALL).toBeGreaterThan(capacity(1));
    for (const n of [0, 1, 12, 13, 100, capacity(1), capacity(1) + 1, 500, ALL]) {
      const slots = fieldSlots(n);
      expect(slots).toHaveLength(n);
      // jede Pflanze steht auf ihrem eigenen Platz, keine zwei übereinander
      expect(new Set(slots.map((s) => `${s.x}|${s.y}`)).size).toBe(n);
      for (const s of slots) {
        expect(s.x).toBeGreaterThanOrEqual(FIELD.left);
        expect(s.x).toBeLessThanOrEqual(FIELD.right);
        expect(s.y).toBeGreaterThanOrEqual(FIELD.back);
        expect(s.y).toBeLessThanOrEqual(FIELD.front);
        expect(s.k).toBeGreaterThan(0.2);
      }
    }
  });

  it('die Pflanzen stehen über das ganze Feld verteilt, vorne die Setzlinge, hinten die reifen', () => {
    for (const n of [5, 12, 40, 300]) {
      const ys = fieldSlots(n).map((s) => s.y);
      expect(Math.max(...ys)).toBe(FIELD.front);
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan((FIELD.front - FIELD.back) * 0.7);
    }
    const plants = new Map<ProgressKey, Plant>([
      ['w001', { stage: 5, thirsty: false }],
      ['w002', { stage: 1, thirsty: true }],
      ['w003', { stage: 3, thirsty: false }],
      ['w004', { stage: 1, thirsty: false }],
    ]);
    expect(fieldOrder([...plants.keys()], plants)).toEqual(['w002', 'w004', 'w003', 'w001']);
    const slots = fieldSlots(4);
    expect(slots[0]!.y).toBeGreaterThanOrEqual(slots[3]!.y);
    expect(slots[0]!.k).toBeGreaterThan(slots[3]!.k);
  });

  it('Antippen trifft die Pflanze, Wasser daneben nicht', () => {
    const slots = fieldSlots(3);
    const s = slots[1]!;
    expect(nearestSlot(slots, s.x + 2, s.y - 14)).toBe(1);
    expect(nearestSlot(slots, 200, 40)).toBeNull();
  });

  it('Unterschiede seit dem letzten Besuch: gepflanzt, gewachsen, gegossen, gewelkt', () => {
    const p = (stage: number, thirsty: boolean): Plant => ({ stage, thirsty });
    const before = new Map<string, Plant>([
      ['w001', p(2, true)],
      ['w002', p(2, false)],
      ['w003', p(3, false)],
      ['w004', p(4, false)],
    ]);
    const after = new Map<ProgressKey, Plant>([
      ['w001', p(2, false)],
      ['w002', p(3, false)],
      ['w003', p(3, false)],
      ['w004', p(4, true)],
      ['w005', p(1, false)],
    ]);
    expect(fieldChanges(null, after)).toEqual([]);
    const changes = fieldChanges(before, after);
    expect(changes.map((c) => [c.key, c.watered])).toEqual([
      ['w001', true],
      ['w002', true],
      ['w004', false],
      ['w005', true],
    ]);
    expect(changes.find((c) => c.key === 'w005')!.from).toBeNull();
  });

  it('Umrisse: nur endliche Zahlen, größer mit jeder Stufe, Rispe ab Stufe 4, durstig hängt sie', () => {
    for (let s = 0; s <= 5; s += 0.25) {
      for (const droop of [0, 0.5, 1, -0.1]) {
        const shape = plantShape(s, droop);
        const numbers = `${shape.light}${shape.shade}${shape.head}`.match(/-?[\d.]+(e-?\d+)?/g) ?? [];
        expect(numbers.every((x) => Number.isFinite(Number(x)))).toBe(true);
        expect(`${shape.light}${shape.shade}${shape.head}`).not.toMatch(/NaN|Infinity/);
      }
    }
    for (let s = 1; s < 5; s++) expect(plantShape(s + 1, 0).top).toBeGreaterThan(plantShape(s, 0).top);
    expect(plantShape(3, 0).head).toBe('');
    expect(plantShape(4, 0).head).not.toBe('');
    for (let s = 1; s <= 5; s++) expect(plantShape(s, 1).top).toBeLessThan(plantShape(s, 0).top * 0.85);
  });

  it('Beschriftung: Wort, Übersetzung und wann wieder gegossen wird', () => {
    const w = content.words[0]!;
    expect(plantInfo(w.id, prog(5, '2026-11-18'), DAY)).toEqual({ item: w.id, vn: w.vn, de: w.de, state: 'reif · in 12 Tagen wieder gießen' });
    expect(plantInfo(w.id, prog(1, '2026-11-07'), DAY).state).toBe('Setzling · morgen wieder gießen');
    expect(plantInfo(w.id, prog(2, DAY), DAY).state).toBe('jung · durstig, heute fällig');
    expect(plantInfo(w.id, prog(3, '2026-11-05'), DAY).state).toBe('kräftig · durstig seit gestern');
    expect(plantInfo(w.id, prog(4, '2026-11-01'), DAY).state).toBe('in Ähren · durstig seit 5 Tagen');
    const role = content.roles.find((r) => r.addr)!;
    const info = plantInfo(`${role.id}:addr`, prog(1, DAY), DAY);
    expect(info.vn).toBe(content.words.find((x) => x.id === role.addr)!.vn);
    expect(info.item).toBe(role.addr);
    const sentence = content.sentences[0]!;
    expect(plantInfo(sentence.id, prog(2, DAY), DAY)).toMatchObject({ item: sentence.id, vn: sentence.vn, de: sentence.de });
    expect(info.de).toContain(role.label);
  });
});
