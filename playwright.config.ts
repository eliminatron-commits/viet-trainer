import { defineConfig, devices } from '@playwright/test';

/** E2E im Produktions-Build (mit Service Worker), WebKit im iPhone-Viewport. */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 300_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'iphone-webkit', use: { ...devices['iPhone 15'] } }],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/viet-trainer/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
