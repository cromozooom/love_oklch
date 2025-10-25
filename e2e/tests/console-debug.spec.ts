import { test, expect } from '@playwright/test';

test('console errors and auth initialization debug', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  // Capture console messages
  page.on('console', (msg) => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  // Capture errors
  page.on('pageerror', (error) => {
    const errorText = `[PAGE ERROR] ${error.message}`;
    errors.push(errorText);
    console.log(errorText);
  });

  console.log('🔍 Starting console debug...');

  // Navigate to login
  await page.goto('http://localhost:4200');
  await expect(page).toHaveURL(/.*\/login/);

  // Login
  console.log('🔐 Attempting login...');
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for redirect to home
  await page.waitForURL(/.*\/home/, { timeout: 10000 });
  console.log('✅ Login successful');

  // Check storage
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  console.log('📦 Token stored:', !!token);

  // Clear console messages for refresh test
  consoleMessages.length = 0;
  errors.length = 0;

  console.log('🔄 Refreshing page...');
  await page.reload();

  // Wait for app initialization
  await page.waitForTimeout(5000);

  console.log('\n📝 Console messages during refresh:');
  consoleMessages.forEach((msg) => console.log('  ' + msg));

  console.log('\n❌ Errors during refresh:');
  errors.forEach((err) => console.log('  ' + err));

  // Check final state
  const finalUrl = page.url();
  const tokenAfterRefresh = await page.evaluate(() =>
    localStorage.getItem('auth_token')
  );

  console.log('\n📍 Final URL:', finalUrl);
  console.log('📦 Token after refresh:', !!tokenAfterRefresh);

  // Look for AuthService messages
  const authMessages = consoleMessages.filter(
    (msg) =>
      msg.includes('AuthService') ||
      msg.includes('Token validation') ||
      msg.includes('verify') ||
      msg.includes('authentication')
  );

  console.log('\n🔍 Auth-related messages:');
  authMessages.forEach((msg) => console.log('  ' + msg));
});
