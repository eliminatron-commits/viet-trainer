/**
 * App-Icon: Kopf des Wasserbüffels Trâu vor einer gelben Sonne auf Flaggenrot.
 * Gleiche Formen und Farben wie src/lib/mascot/Buffalo.svelte, flach, ohne Konturen, Licht von rechts oben.
 * Erzeugt public/icons/*.png über den installierten Edge (Playwright), keine zusätzlichen Abhängigkeiten.
 *
 *   node scripts/icons.ts            → PNGs schreiben
 *   node scripts/icons.ts --preview  → nur Vorschaubogen nach ./icon-preview.png (nicht einchecken)
 */
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const C = {
  bg: '#DA251D',
  halo: '#FFE58A',
  sun: '#FFCD00',
  body: '#56618A',
  shade: '#434D72',
  muzzle: '#A3ACC6',
  dark: '#262B40',
  horn: '#F3E3C3',
  hornShade: '#DEC79C',
  ear: '#F6A5B8',
  lotusDeep: '#E7809A',
  white: '#FFFFFF',
};

/** Büffel-Kopf in den Koordinaten von Buffalo.svelte (viewBox 0 0 200 200). */
const head = `
  <path d="M66 116 C66 140 58 152 38 160 C22 167 18 192 16 240 L184 240 C182 192 178 167 162 160 C142 152 134 140 134 116 Z" fill="${C.shade}" />
  <path d="M134 122 C138 146 148 154 162 160 C178 167 182 192 184 240 L166 240 C164 198 160 178 148 171 C136 164 132 148 134 122 Z" fill="${C.body}" />
  <path d="M64 80 C28 74 18 44 38 28 C36 48 50 64 76 66 Z" fill="${C.horn}" />
  <path d="M64 80 C28 74 18 44 38 28 C30 50 40 66 66 72 Z" fill="${C.hornShade}" />
  <path d="M136 80 C172 74 182 44 162 28 C164 48 150 64 124 66 Z" fill="${C.horn}" />
  <ellipse cx="52" cy="96" rx="15" ry="8" fill="${C.body}" transform="rotate(-20 52 96)" />
  <ellipse cx="53" cy="96" rx="9" ry="4" fill="${C.ear}" transform="rotate(-20 53 96)" />
  <ellipse cx="148" cy="96" rx="15" ry="8" fill="${C.body}" transform="rotate(20 148 96)" />
  <ellipse cx="147" cy="96" rx="9" ry="4" fill="${C.ear}" transform="rotate(20 147 96)" />
  <ellipse cx="100" cy="96" rx="46" ry="42" fill="${C.body}" />
  <path d="M86 58 C92 66 108 66 114 58 C110 70 90 70 86 58 Z" fill="${C.shade}" />
  <ellipse cx="100" cy="50" rx="6" ry="13" fill="${C.ear}" />
  <ellipse cx="91" cy="55" rx="5" ry="11" fill="${C.lotusDeep}" transform="rotate(-30 91 55)" />
  <ellipse cx="109" cy="55" rx="5" ry="11" fill="${C.lotusDeep}" transform="rotate(30 109 55)" />
  <circle cx="82" cy="88" r="10" fill="${C.white}" />
  <circle cx="118" cy="88" r="10" fill="${C.white}" />
  <circle cx="84" cy="90" r="6.5" fill="${C.dark}" />
  <circle cx="116" cy="90" r="6.5" fill="${C.dark}" />
  <circle cx="82" cy="87" r="2.2" fill="${C.white}" />
  <circle cx="114" cy="87" r="2.2" fill="${C.white}" />
  <ellipse cx="100" cy="116" rx="30" ry="20" fill="${C.muzzle}" />
  <ellipse cx="90" cy="114" rx="4" ry="5.5" fill="${C.dark}" />
  <ellipse cx="110" cy="114" rx="4" ry="5.5" fill="${C.dark}" />
  <path d="M92 126 Q100 132 108 126 Q100 129 92 126 Z" fill="${C.dark}" />
  <path d="M62 128 Q100 146 138 128 L139 137 Q100 156 61 137 Z" fill="${C.bg}" />
  <path d="M116 140 L130 162 L115 157 Z" fill="${C.bg}" />
  <path d="M121 146 l1.6 3.4 3.7.4-2.8 2.5.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.8-2.5 3.7-.4Z" fill="${C.sun}" />`;

/**
 * Icon auf 1024er-Fläche. `scale` = Größe des Büffels; maskierbare Icons (Android-Kreis/Squircle)
 * brauchen kleiner, damit Hörner und Schultern in der sicheren Zone (Radius 40 %) bleiben.
 */
function iconSvg(scale: number): string {
  // Büffel als Brustbild (Schultern laufen unten aus dem Bild), Sonne rechts oben = Lichtquelle.
  const cy = 452 + (4.4 - scale) * 40;
  const k = scale / 4.4;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="${C.bg}" />
  <circle cx="${512 + 250 * k}" cy="${cy - 190 * k}" r="${200 * k}" fill="${C.halo}" />
  <circle cx="${512 + 250 * k}" cy="${cy - 190 * k}" r="${150 * k}" fill="${C.sun}" />
  <g transform="translate(512 ${cy}) scale(${scale}) translate(-100 -98)">${head}</g>
</svg>`;
}

const targets = [
  { file: 'public/icons/icon-180.png', size: 180, scale: 4.4 },
  { file: 'public/icons/icon-192.png', size: 192, scale: 4.4 },
  { file: 'public/icons/icon-512.png', size: 512, scale: 4.4 },
  { file: 'public/icons/icon-maskable-512.png', size: 512, scale: 3.4 },
];

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();

async function render(svg: string, size: number): Promise<Buffer> {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  return page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } });
}

if (process.argv.includes('--preview')) {
  // Vorschaubogen: groß, Homescreen-Größe mit iOS-Rundung, maskierbar mit Kreis-Maske
  const big = iconSvg(4.4);
  const mask = iconSvg(3.4);
  const html = `<style>body{margin:0;padding:24px;background:#e9e4dc;display:flex;gap:24px;align-items:center;font:14px system-ui}
    .ios{border-radius:22.5%;overflow:hidden;box-shadow:0 2px 6px #0003}.circle{border-radius:50%;overflow:hidden}
    svg{display:block}</style>
    <div class="ios" style="width:360px;height:360px">${big.replace('width="1024" height="1024"', 'width="360" height="360"')}</div>
    <div class="ios" style="width:120px;height:120px">${big.replace('width="1024" height="1024"', 'width="120" height="120"')}</div>
    <div class="ios" style="width:60px;height:60px">${big.replace('width="1024" height="1024"', 'width="60" height="60"')}</div>
    <div class="circle" style="width:200px;height:200px">${mask.replace('width="1024" height="1024"', 'width="200" height="200"')}</div>`;
  await page.setViewportSize({ width: 900, height: 410 });
  await page.setContent(html);
  writeFileSync('icon-preview.png', await page.screenshot());
  console.log('icon-preview.png');
} else {
  for (const t of targets) {
    writeFileSync(t.file, await render(iconSvg(t.scale), t.size));
    console.log(`${t.file} (${t.size}px)`);
  }
}
await browser.close();
