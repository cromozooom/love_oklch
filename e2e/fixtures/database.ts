import { test as base } from '@playwright/test';

/**
 * Database fixture for resetting DB state between test groups
 *
 * Usage in your test file:
 * ```typescript
 * import { test, expect } from '../../fixtures/database';
 *
 * test.use({ resetDatabase: true });
 *
 * test.describe('Your Tests', () => {
 *   // Tests will run with fresh database
 * });
 * ```
 */
export const test = base.extend<{ resetDatabase: boolean }>({
  resetDatabase: [
    async ({}, use, testInfo) => {
      // This runs before the test/group
      if (testInfo.project.name === 'setup-only') {
        await use(true);
        return;
      }

      console.log('🔄 Resetting database for:', testInfo.titlePath[0]);

      try {
        // Using dynamic import to avoid Node.js module issues
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        // Determine the correct backend path
        const backendPath = '../backend';

        await execAsync('npm run db:seed:e2e', {
          cwd: backendPath,
        });
        console.log('✅ Database reset complete');
      } catch (error) {
        console.error('❌ Failed to reset database:', error);
        throw error;
      }

      // Run the test
      await use(true);

      // Cleanup after test (if needed)
      // console.log('🧹 Test cleanup complete');
    },
    { auto: true, scope: 'test' }, // Runs per test when enabled
  ],
});

export { expect } from '@playwright/test';
