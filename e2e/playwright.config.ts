import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Love OKLCH
 *
 * Two modes:
 * - DEV mode (default): Fast, minimal config for development
 *   - Single browser (Chromium)
 *   - Sequential execution (workers: 1)
 *   - Reuses existing dev server
 *
 * - NIGHTLY mode: Comprehensive testing across all browsers
 *   - All desktop browsers (Chromium, Firefox, WebKit, Edge, Chrome)
 *   - Parallel execution for speed
 *   - Retries on failure
 *
 * Usage:
 *   Dev: npm run test:ui:seed (default)
 *   Nightly: NIGHTLY=true npx playwright test
 *
 * @see https://playwright.dev/docs/test-configuration
 */

const isNightly = process.env.NIGHTLY === 'true';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './',
  globalSetup: './global-setup.ts',

  // Dev: sequential, Nightly: parallel
  fullyParallel: isNightly || isCI,

  // Fail build if test.only is left in code (CI/Nightly only)
  forbidOnly: isNightly || isCI,

  // Retry on failure (Nightly/CI only)
  retries: isNightly || isCI ? 2 : 0,

  // Dev: 1 worker (sequential), Nightly: multiple workers
  workers: isNightly || isCI ? 3 : 1,

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },

  // Dev: Chromium only, Nightly: All browsers
  projects:
    isNightly || isCI
      ? [
          {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
          },
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
          {
            name: 'Microsoft Edge',
            use: { ...devices['Desktop Edge'], channel: 'msedge' },
          },
          {
            name: 'Google Chrome',
            use: { ...devices['Desktop Chrome'], channel: 'chrome' },
          },
        ]
      : [
          {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
          },
        ],

  webServer: {
    command: 'cd ../frontend && npm run start',
    url: 'http://localhost:4200',
    // Always reuse existing server for local development
    // CI will handle server lifecycle
    reuseExistingServer: !isCI,
  },
});
