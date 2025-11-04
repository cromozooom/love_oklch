import { defineConfig, devices } from '@playwright/test';

/**
 * E2E Test Configuration for Love OKLCH Project
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './',

  // Maximum time one test can run for
  timeout: 60 * 1000,

  // Run tests sequentially to avoid conflicts with database
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
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

    // Increased timeout for actions
    actionTimeout: 10000,

    // Force disable cache to ensure latest code is loaded
    javaScriptEnabled: true,
    bypassCSP: true,

    // Disable all caching
    ignoreHTTPSErrors: true,
  },

  // Configure projects for major browsers (simplified for testing)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Slow down actions to see what's happening
        launchOptions: {
          slowMo: process.env.SLOWMO ? 1000 : 0,
          // CRITICAL: Disable ALL browser caching
          args: [
            '--disable-cache',
            '--disable-application-cache',
            '--disable-offline-load-stale-cache',
            '--disk-cache-size=0',
            '--disable-gpu-shader-disk-cache',
          ],
        },
      },
    },
  ],

  // Run your local dev server before starting the tests
  // Note: Make sure backend is also running on http://localhost:3001
  webServer: {
    command: 'cd ../frontend && npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: true, // Use existing server if already running
    timeout: 120 * 1000,
  },
});
