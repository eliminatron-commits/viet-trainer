import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// Versionszeile in den Einstellungen (src/lib/build.ts): package.json-Version, Commit, Build-Zeit.
// Im Workflow liefert GitHub den Commit als GITHUB_SHA.
function gitCommit(): string {
  try {
    return process.env.GITHUB_SHA ?? execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };
const build = { version: pkg.version, commit: gitCommit().slice(0, 7), time: new Date().toISOString() };

export default defineConfig({
  // GitHub Pages: https://eliminatron-commits.github.io/viet-trainer/
  base: '/viet-trainer/',
  define: { __APP_BUILD__: JSON.stringify(build) },
  plugins: [
    svelte(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      // → dist/sw.js = /viet-trainer/sw.js, gleicher Pfad wie der alte SW, damit er ihn ablöst
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Việt-Trainer',
        short_name: 'Việt',
        lang: 'de',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FBF5EC',
        theme_color: '#FBF5EC',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        // App-Shell, Fonts (nur woff2) und alle Audios vorab
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,mp3,webmanifest}'],
        // Startbilder holt iOS selbst beim Hinzufügen zum Homescreen – nicht vorab cachen.
        globIgnores: ['**/node_modules/**/*', 'splash/**'],
      },
    }),
  ],
});
