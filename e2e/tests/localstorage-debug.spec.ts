import { test, expect } from '@playwright/test';

test.describe('LocalStorage Debug', () => {
  test('should debug localStorage timing issue', async ({ page }) => {
    // Login first
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

    // Check localStorage after login
    const afterLogin = await page.evaluate(() => {
      const token = localStorage.getItem('auth_token');
      const user = localStorage.getItem('auth_user');
      const remember = localStorage.getItem('auth_remember');
      return {
        token: token ? token.substring(0, 20) + '...' : null,
        user,
        remember,
        allKeys: Object.keys(localStorage),
      };
    });
    console.log('After Login - localStorage:', afterLogin);

    // Wait a bit more
    await page.waitForTimeout(1000);

    // Navigate to admin but inject debug first
    await page.addInitScript(() => {
      const originalGetItem = localStorage.getItem.bind(localStorage);
      const originalSetItem = localStorage.setItem.bind(localStorage);

      localStorage.getItem = function (key) {
        const value = originalGetItem(key);
        if (key === 'auth_token' || key === 'auth_user') {
          console.log(
            `🔍 localStorage.getItem('${key}') =`,
            value
              ? key === 'auth_token'
                ? value.substring(0, 20) + '...'
                : value
              : null
          );
        }
        return value;
      };

      localStorage.setItem = function (key, value) {
        if (key === 'auth_token' || key === 'auth_user') {
          console.log(
            `💾 localStorage.setItem('${key}', ...)`,
            key === 'auth_token' ? value.substring(0, 20) + '...' : value
          );
        }
        return originalSetItem(key, value);
      };
    });

    // Capture all console messages
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Now navigate to admin
    await page.goto('http://localhost:4200/admin/plan-management');
    await page.waitForLoadState('networkidle');

    // Check localStorage after navigation
    const afterNavigation = await page.evaluate(() => {
      const token = localStorage.getItem('auth_token');
      const user = localStorage.getItem('auth_user');
      const remember = localStorage.getItem('auth_remember');
      return {
        token: token ? token.substring(0, 20) + '...' : null,
        user,
        remember,
        allKeys: Object.keys(localStorage),
      };
    });
    console.log('After Navigation - localStorage:', afterNavigation);
    console.log('Final URL:', page.url());

    console.log('\n=== Console Logs ===');
    consoleLogs.forEach((log) => console.log(log));
  });
});
