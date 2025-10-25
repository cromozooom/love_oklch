import { test, expect } from '@playwright/test';

test.describe('Admin Guard Debug', () => {
  test('should show exact guard behavior', async ({ page }) => {
    // Capture all console messages
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // First login
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

    console.log('=== After Login ===');
    console.log('URL:', page.url());

    // Check auth state in browser
    const authState = await page.evaluate(() => {
      const token = localStorage.getItem('auth_token');
      const user = localStorage.getItem('auth_user');
      return { token: !!token, user: user ? JSON.parse(user) : null };
    });
    console.log('Auth State:', authState);

    // Now try to access admin directly
    console.log('\n=== Attempting Admin Access ===');
    await page.goto('http://localhost:4200/admin/plan-management');
    await page.waitForLoadState('networkidle');

    console.log('Final URL:', page.url());
    console.log('\n=== All Console Logs ===');
    consoleLogs.forEach((log) => console.log(log));

    // Take screenshot for debugging
    await page.screenshot({
      path: 'test-results/guard-debug.png',
      fullPage: true,
    });
  });
});
