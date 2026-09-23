import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['morph.spec.ts', 'playground-trials.spec.ts'],
  workers: 1,
  timeout: 30_000,
  use: { baseURL: 'http://localhost:5180', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-light', use: { viewport: { width: 1440, height: 1000 }, colorScheme: 'light' } },
    { name: 'mobile-dark', use: { viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'pnpm --filter @morphui/playground dev --host localhost',
    url: 'http://localhost:5180', reuseExistingServer: !process.env.CI,
  },
});
