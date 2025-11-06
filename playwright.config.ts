import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Tests
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // Global setup to seed database before tests
  globalSetup: require.resolve('./e2e/global-setup.ts'),

  // Maximum time one test can run for
  timeout: 60 * 1000,

  // Run tests in parallel
  fullyParallel: false, // Sequential to avoid conflicts

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reporter to use
  reporter: [['html'], ['list']],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:4200',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: [
    {
      command: 'cd frontend && npm start',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: 'cd backend && npm run dev',
      url: 'http://localhost:3001/api/v1/health',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  ],
});
