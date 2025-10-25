import { test, expect } from '@playwright/test';

test.describe('Auth Sequence Debug', () => {
  test('should debug exact auth initialization sequence', async ({ page }) => {
    // Capture ALL console messages with timestamps
    const logs: { time: number; type: string; text: string }[] = [];
    const startTime = Date.now();

    page.on('console', (msg) => {
      logs.push({
        time: Date.now() - startTime,
        type: msg.type(),
        text: msg.text(),
      });
    });

    // Step 1: Login
    console.log('=== STEP 1: LOGIN ===');
    await page.goto('http://localhost:4200/login');
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

    // Step 2: Check auth state after login
    const authAfterLogin = await page.evaluate(() => {
      return {
        token: !!localStorage.getItem('auth_token'),
        user: localStorage.getItem('auth_user'),
        remember: localStorage.getItem('auth_remember'),
      };
    });
    console.log('Auth state after login:', authAfterLogin);

    // Step 3: Navigate to admin (this triggers the issue)
    console.log('\n=== STEP 2: NAVIGATE TO ADMIN ===');
    await page.goto('http://localhost:4200/admin/plan-management');
    await page.waitForLoadState('networkidle');

    console.log('Final URL:', page.url());

    // Step 4: Check final auth state
    const authAfterNavigation = await page.evaluate(() => {
      return {
        token: !!localStorage.getItem('auth_token'),
        user: localStorage.getItem('auth_user'),
        remember: localStorage.getItem('auth_remember'),
      };
    });
    console.log('Auth state after navigation:', authAfterNavigation);

    // Print chronological logs
    console.log('\n=== CHRONOLOGICAL CONSOLE LOGS ===');
    logs.forEach((log) => {
      if (
        log.text.includes('AuthService') ||
        log.text.includes('AdminAuthGuard') ||
        log.text.includes('🔍') ||
        log.text.includes('✅') ||
        log.text.includes('❌')
      ) {
        console.log(`[${log.time}ms] [${log.type}] ${log.text}`);
      }
    });
  });
});
