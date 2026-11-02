import { describe, expect, it } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { content } from '../src/content';
import { SITUATION_TAGS } from '../src/content/types';

const { regions, stages, words, sentences, roles, contexts } = content;
const AUDIO = join(import.meta.dirname, '..', 'public', 'audio');

describe('Migration', () => {
  it('enthält 538 Wörter, 270 Sätze und alle 10 Rollen', () => {
    expect(words).toHaveLength(538);
    expect(sentences).toHaveLength(270);
    expect(roles.map((r) => r.id).sort()).toEqual(['anh', 'ba', 'bo', 'chi', 'chu', 'co', 'em', 'la', 'me', 'ong']);
  });

  it('behält die IDs w001–w538 und s001–s270', () => {
    const pad = (n: number) => String(n).padStart(3, '0');
    expect(words.map((w) => w.id)).toEqual(Array.from({ length: 538 }, (_, i) => `w${pad(i + 1)}`));
    expect(sentences.map((s) => s.id)).toEqual(Array.from({ length: 270 }, (_, i) => `s${pad(i + 1)}`));
  });

  it('hat für jede Wort- und Satz-ID eine nicht leere Audiodatei', () => {
    const missing = [...words, ...sentences].filter((x) => {
      const f = join(AUDIO, `${x.id}.mp3`);
      return !existsSync(f) || statSync(f).size < 500;
    });
    expect(missing.map((x) => x.id)).toEqual([]);
  });

  it('markiert nur die vorbereiteten Inhalte als ungeprüft', () => {
    for (const w of words) expect(w.checked, w.id).toBe(Number(w.id.slice(1)) <= 250);
    for (const s of sentences) expect(s.checked, s.id).toBe(Number(s.id.slice(1)) <= 150);
  });

  it('übernimmt pron für alle Kernwörter', () => {
    for (const w of words.filter((w) => w.checked)) expect(w.pron, w.id).toBeTruthy();
  });

  it('hat nur gültige Felder', () => {
    const tags = new Set(Object.keys(SITUATION_TAGS));
    for (const x of [...words, ...sentences]) {
      expect(x.vn.trim(), x.id).not.toBe('');
      expect(x.de.trim(), x.id).not.toBe('');
      for (const t of x.tags) expect(tags.has(t), `${x.id} ${t}`).toBe(true);
    }
  });
});

describe('Lernpfad', () => {
  const stageIds = new Set(stages.map((s) => s.id));
  const wordById = new Map(words.map((w) => [w.id, w]));
  const order = new Map(stages.map((s, i) => [s.id, i]));

  it('hat 5 Regionen in Reiseroute und 25–35 Etappen', () => {
    expect(regions.map((r) => r.id)).toEqual(['danang', 'hoian', 'hue', 'hanoi', 'saigon']);
    expect(stages.length).toBeGreaterThanOrEqual(25);
    expect(stages.length).toBeLessThanOrEqual(35);
    // Regionen liegen zusammenhängend in Reihenfolge
    const seq = stages.map((s) => s.region).filter((r, i, a) => r !== a[i - 1]);
    expect(seq).toEqual(regions.map((r) => r.id));
  });

  it('ordnet jedes Wort und jeden Satz genau einer existierenden Etappe zu', () => {
    for (const x of [...words, ...sentences]) {
      expect(typeof x.stage, x.id).toBe('string');
      expect(stageIds.has(x.stage), `${x.id} → ${x.stage}`).toBe(true);
    }
  });

  it('hat in jeder Etappe neue Wörter', () => {
    for (const s of stages) expect(words.some((w) => w.stage === s.id), s.id).toBe(true);
  });

  it('legt Sätze nie vor die Etappe eines ihrer Wörter', () => {
    for (const s of sentences) {
      for (const id of s.words) {
        const w = wordById.get(id);
        expect(w, `${s.id} → ${id}`).toBeDefined();
        expect(order.get(w!.stage)!, `${s.id} → ${id}`).toBeLessThanOrEqual(order.get(s.stage)!);
      }
    }
  });

  it('hat eigene Etappen für Pronomen/Anreden und Partikel', () => {
    const pron = stages.filter((s) => s.kind === 'pronouns');
    expect(pron.length).toBeGreaterThanOrEqual(1);
    for (const r of roles) {
      expect(pron.map((s) => s.id), r.id).toContain(r.stage);
      for (const id of [r.self, r.addr].filter((x) => x !== null)) expect(wordById.has(id!), id!).toBe(true);
    }
    const part = stages.filter((s) => s.kind === 'particles');
    expect(part).toHaveLength(1);
    for (const w of words) expect(w.kind === 'particle', w.id).toBe(w.stage === part[0]!.id);
  });

  it('verweist in Satzkontexten nur auf existierende Wörter', () => {
    const ctxIds = new Set(contexts.map((c) => c.id));
    for (const c of contexts) for (const id of [c.self, ...c.addr]) expect(wordById.has(id), `${c.id} ${id}`).toBe(true);
    for (const s of sentences) if (s.ctx) expect(ctxIds.has(s.ctx), s.id).toBe(true);
  });
});
