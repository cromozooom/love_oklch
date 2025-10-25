import { test, expect } from '@playwright/test';

test('token validation debug', async ({ page }) => {
  console.log('🔍 Testing token validation...');

  // Navigate to login
  await page.goto('http://localhost:4200');
  await expect(page).toHaveURL(/.*\/login/);

  // Login
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for redirect to home
  await page.waitForURL(/.*\/home/, { timeout: 10000 });

  // Check the token that was stored
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  const user = await page.evaluate(() => localStorage.getItem('auth_user'));

  console.log('📦 Stored data:');
  console.log('  Token:', token || 'MISSING');
  console.log('  User:', user || 'MISSING');

  if (token) {
    // Validate token format manually
    const parts = token.split('.');
    console.log('🔍 Token analysis:');
    console.log('  Parts count:', parts.length);
    console.log('  Part 1 length:', parts[0]?.length || 0);
    console.log('  Part 2 length:', parts[1]?.length || 0);
    console.log('  Part 3 length:', parts[2]?.length || 0);

    // Check base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const allPartsValid = parts.every(
      (part) => part.length > 0 && base64Regex.test(part)
    );
    console.log('  Valid JWT format:', allPartsValid);

    // Try to decode payload
    try {
      const payload = JSON.parse(atob(parts[1]));
      console.log('  Payload decoded:', JSON.stringify(payload, null, 2));
      console.log(
        '  Token expires:',
        new Date(payload.exp * 1000).toISOString()
      );
      console.log('  Token is expired:', Date.now() > payload.exp * 1000);
    } catch (error) {
      console.log('  Payload decode error:', error);
    }
  }

  // Now test what happens during page refresh with console logging
  await page.addInitScript(() => {
    // Override console methods to capture them
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args) => {
      originalLog('[LOG]', ...args);
    };

    console.warn = (...args) => {
      originalLog('[WARN]', ...args);
    };

    console.info = (...args) => {
      originalLog('[INFO]', ...args);
    };
  });

  console.log('🔄 Refreshing page with console logging...');
  await page.reload();

  // Wait for auth initialization
  await page.waitForTimeout(3000);

  const urlAfterRefresh = page.url();
  console.log('📍 URL after refresh:', urlAfterRefresh);

  // Check storage after refresh
  const tokenAfterRefresh = await page.evaluate(() =>
    localStorage.getItem('auth_token')
  );
  const userAfterRefresh = await page.evaluate(() =>
    localStorage.getItem('auth_user')
  );

  console.log('📦 After refresh:');
  console.log('  Token:', tokenAfterRefresh || 'MISSING');
  console.log('  User:', userAfterRefresh || 'MISSING');
});
