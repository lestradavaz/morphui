import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'docs.spec.ts', workers: 1, timeout: 30_000,
  use: { baseURL: 'http://localhost:4321', trace: 'retain-on-failure' },
  projects: [
    { name: 'docs-desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'docs-mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'dark' } },
  ],
});
