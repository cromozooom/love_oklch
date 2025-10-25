import { test, expect } from '@playwright/test';

test.describe('Authentication Debugging', () => {
  test('debug localStorage and token flow', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:4200');
    await expect(page).toHaveURL(/.*\/login/);

    // Login
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL(/.*\/home/, { timeout: 10000 });

    // Check what's stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    const user = await page.evaluate(() => localStorage.getItem('auth_user'));
    const remember = await page.evaluate(() =>
      localStorage.getItem('auth_remember')
    );

    console.log('🔍 After login:');
    console.log('Token:', token ? 'EXISTS' : 'MISSING');
    console.log('User:', user ? 'EXISTS' : 'MISSING');
    console.log('Remember:', remember);

    // Check sessionStorage too
    const sessionToken = await page.evaluate(() =>
      sessionStorage.getItem('auth_token')
    );
    const sessionUser = await page.evaluate(() =>
      sessionStorage.getItem('auth_user')
    );

    console.log('Session Token:', sessionToken ? 'EXISTS' : 'MISSING');
    console.log('Session User:', sessionUser ? 'EXISTS' : 'MISSING');

    // Check network requests during page refresh
    const responses: Array<{ url: string; status: number; headers: any }> = [];
    page.on('response', (response) => {
      if (response.url().includes('/auth/verify')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
        });
      }
    });

    // Refresh the page
    console.log('🔄 Refreshing page...');
    await page.reload();

    // Wait a bit for auth state to initialize
    await page.waitForTimeout(2000);

    // Check what happens after refresh
    const currentUrl = page.url();
    console.log('URL after refresh:', currentUrl);

    // Check storage after refresh
    const tokenAfter = await page.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    const userAfter = await page.evaluate(() =>
      localStorage.getItem('auth_user')
    );

    console.log('🔍 After refresh:');
    console.log('Token:', tokenAfter ? 'EXISTS' : 'MISSING');
    console.log('User:', userAfter ? 'EXISTS' : 'MISSING');

    // Check network requests
    console.log('🌐 Auth verify requests:', responses);

    // Manual test: try to navigate to home
    await page.goto('http://localhost:4200/home');
    await page.waitForTimeout(1000);

    const finalUrl = page.url();
    console.log('Final URL after direct navigation:', finalUrl);
  });
});
