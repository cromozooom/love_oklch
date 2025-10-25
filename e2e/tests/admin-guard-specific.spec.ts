import { test, expect } from '@playwright/test';

test.describe('Admin Guard Specific Test', () => {
  test('should trigger admin guard and show logs', async ({ page }) => {
    // Capture ALL console messages
    const logs: { time: number; type: string; text: string }[] = [];
    const startTime = Date.now();

    page.on('console', (msg) => {
      logs.push({
        time: Date.now() - startTime,
        type: msg.type(),
        text: msg.text(),
      });
    });

    // Step 1: Login first
    console.log('=== STEP 1: LOGIN ===');
    await page.goto('http://localhost:4200/login');
    await page.waitForLoadState('networkidle');

    await page.fill(
      'input[type="email"], input[name="email"], #email',
      'admin@example.com'
    );
    await page.fill(
      'input[type="password"], input[name="password"], #password',
      'password123'
    );
    await page.click(
      'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")'
    );
    await page.waitForLoadState('networkidle');

    console.log('After login URL:', page.url());

    // Wait a bit for auth to stabilize
    await page.waitForTimeout(2000);

    // Step 2: Check auth state after login and wait
    const authAfterLogin = await page.evaluate(() => {
      return {
        token: !!localStorage.getItem('auth_token'),
        user: localStorage.getItem('auth_user'),
        remember: localStorage.getItem('auth_remember'),
      };
    });
    console.log('Auth state after login and wait:', authAfterLogin);

    // Step 3: Now try direct navigation to admin
    console.log('\n=== STEP 2: DIRECT ADMIN NAVIGATION ===');
    await page.goto('http://localhost:4200/admin/plan-management');
    await page.waitForLoadState('networkidle');

    console.log('Final URL after admin navigation:', page.url());

    // Wait additional time to see if there are delayed redirects
    await page.waitForTimeout(1000);
    console.log('URL after additional wait:', page.url());

    // Print all console logs, especially focusing on guard logs
    console.log('\n=== ALL CONSOLE LOGS (focusing on Guard/Auth) ===');
    logs.forEach((log) => {
      if (
        log.text.includes('AdminAuthGuard') ||
        log.text.includes('AuthService') ||
        log.text.includes('🔍') ||
        log.text.includes('✅') ||
        log.text.includes('❌') ||
        log.text.includes('guard') ||
        log.text.includes('Guard')
      ) {
        console.log(`[${log.time}ms] [${log.type}] ${log.text}`);
      }
    });

    // Also print any error logs
    console.log('\n=== ERROR LOGS ===');
    logs.forEach((log) => {
      if (log.type === 'error') {
        console.log(`[${log.time}ms] [ERROR] ${log.text}`);
      }
    });
  });
});
