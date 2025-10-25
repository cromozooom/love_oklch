import { test, expect } from '@playwright/test';

test('authentication persistence fix validation', async ({ page }) => {
  console.log('🔍 Testing authentication persistence fix...');

  // Navigate to login
  await page.goto('http://localhost:4200');
  await expect(page).toHaveURL(/.*\/login/);

  // Login
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for redirect to home
  await page.waitForURL(/.*\/home/, { timeout: 10000 });
  console.log('✅ Login successful, redirected to home');

  // Check localStorage (should now have tokens)
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  const user = await page.evaluate(() => localStorage.getItem('auth_user'));

  console.log('🔍 After login:');
  console.log('LocalStorage Token:', token ? 'EXISTS' : 'MISSING');
  console.log('LocalStorage User:', user ? 'EXISTS' : 'MISSING');

  // Test page refresh
  console.log('🔄 Refreshing page...');
  await page.reload();

  // Wait for potential redirect or staying on home
  await page.waitForTimeout(3000);

  const urlAfterRefresh = page.url();
  console.log('📍 URL after refresh:', urlAfterRefresh);

  // Check if we stayed authenticated
  if (urlAfterRefresh.includes('/home')) {
    console.log('🎉 SUCCESS: Authentication persisted after refresh!');
  } else if (urlAfterRefresh.includes('/login')) {
    console.log('❌ FAILED: Still redirected to login after refresh');
  }

  // Double-check storage after refresh
  const tokenAfterRefresh = await page.evaluate(() =>
    localStorage.getItem('auth_token')
  );
  const userAfterRefresh = await page.evaluate(() =>
    localStorage.getItem('auth_user')
  );

  console.log('🔍 After refresh:');
  console.log('LocalStorage Token:', tokenAfterRefresh ? 'EXISTS' : 'MISSING');
  console.log('LocalStorage User:', userAfterRefresh ? 'EXISTS' : 'MISSING');
});
