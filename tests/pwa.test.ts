import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isNightAt } from '../src/lib/logic/theme';

/** Homescreen-App: Startbilder und Nachtfarbe vor dem ersten Bild (index.html). */
const html = readFileSync('index.html', 'utf8');

/** Breite und Höhe aus dem PNG-Kopf (IHDR). */
function pngSize(file: string): [number, number] {
  const b = readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

describe('Startbilder', () => {
  const links = [...html.matchAll(/<link rel="apple-touch-startup-image" href="\/viet-trainer\/([^"]+)" media="([^"]+)"/g)];

  it('gibt es für die gängigen iPhones im Hochformat', () => {
    expect(links.length).toBeGreaterThanOrEqual(10);
    for (const [, , media] of links) expect(media).toContain('(orientation: portrait)');
  });

  it('passen in Pixeln genau zum Gerät, das die Media-Query beschreibt', () => {
    for (const [, href, media] of links) {
      const [, w, h, dpr] = media!.match(/device-width: (\d+)px\) and \(device-height: (\d+)px\) and \(-webkit-device-pixel-ratio: (\d)/)!;
      expect(pngSize(`public/${href}`), href).toEqual([+w! * +dpr!, +h! * +dpr!]);
    }
  });

  it('beschreiben keine zwei Geräte gleich', () => {
    const media = links.map(([, , m]) => m);
    expect(new Set(media).size).toBe(media.length);
  });
});

describe('Nachtfarbe vor dem ersten Bild', () => {
  // Das Inline-Skript in index.html, ausgeführt gegen ein nachgebautes Dokument.
  const script = html.match(/<script>([\s\S]*?)<\/script>/)![1]!;
  function themeAt(hour: number) {
    const root = { dataset: {} as Record<string, string> };
    const meta = { content: '#FBF5EC', setAttribute: (_: string, v: string) => (meta.content = v) };
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor() {
        super(2026, 10, 4, hour, 30);
      }
    }
    new Function('document', 'Date', script)({ documentElement: root, querySelector: () => meta }, FixedDate);
    return { theme: root.dataset.theme ?? 'light', bar: meta.content };
  }

  it('folgt zu jeder Stunde derselben Regel wie die App (logic/theme.ts)', () => {
    for (let h = 0; h < 24; h++) {
      const night = isNightAt(new Date(2026, 10, 4, h, 30));
      expect(themeAt(h), `${h} Uhr`).toEqual(night ? { theme: 'dark', bar: '#131A2E' } : { theme: 'light', bar: '#FBF5EC' });
    }
  });
});
