import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages: https://eliminatron-commits.github.io/viet-trainer/
  base: '/viet-trainer/',
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
        ],
      },
      injectManifest: {
        // App-Shell, Fonts (nur woff2) und alle Audios vorab
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,mp3,webmanifest}'],
      },
    }),
  ],
});
