import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Global setup for Playwright E2E tests
 * Seeds the database with a clean, consistent state before test runs
 */
async function globalSetup() {
  console.log('\n🌱 Seeding database for E2E tests...');

  try {
    const { stdout, stderr } = await execAsync('npm run db:seed:e2e', {
      cwd: '../backend',
    });

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('✅ Database seeded successfully\n');
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    throw error;
  }
}

export default globalSetup;
