import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// Das Svelte-Plugin übersetzt Runes-Module (*.svelte.ts), damit auch game.svelte.ts testbar ist.
export default defineConfig({
  plugins: [svelte()],
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
