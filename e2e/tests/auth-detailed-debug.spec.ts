import { test, expect } from '@playwright/test';

test('detailed authentication flow debug', async ({ page }) => {
  // Track all network requests
  const requests: Array<{
    url: string;
    method: string;
    headers: any;
    status?: number;
  }> = [];

  page.on('request', (request) => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
    });
  });

  page.on('response', (response) => {
    const request = requests.find(
      (r) => r.url === response.url() && !('status' in r)
    );
    if (request) {
      request.status = response.status();
    }
  });

  console.log('🔍 Starting detailed authentication debug...');

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
  console.log('✅ Login successful, redirected to home');

  // Check what's in storage after login
  const tokenAfterLogin = await page.evaluate(() =>
    localStorage.getItem('auth_token')
  );
  const userAfterLogin = await page.evaluate(() =>
    localStorage.getItem('auth_user')
  );

  console.log('📦 After login storage:');
  console.log('  Token exists:', !!tokenAfterLogin);
  console.log('  User exists:', !!userAfterLogin);
  if (tokenAfterLogin) {
    console.log('  Token preview:', tokenAfterLogin.substring(0, 50) + '...');
  }

  // Check network requests during login
  const loginRequests = requests.filter((r) => r.url.includes('/auth/login'));
  console.log('🌐 Login requests:', loginRequests.length);
  loginRequests.forEach((req) => {
    console.log(`  ${req.method} ${req.url} -> ${req.status || 'pending'}`);
  });

  // Clear request log for refresh test
  requests.length = 0;

  // Test page refresh
  console.log('🔄 Refreshing page to test persistence...');
  await page.reload();

  // Wait a bit for auth initialization
  await page.waitForTimeout(5000);

  const urlAfterRefresh = page.url();
  console.log('📍 URL after refresh:', urlAfterRefresh);

  // Check storage after refresh
  const tokenAfterRefresh = await page.evaluate(() =>
    localStorage.getItem('auth_token')
  );
  const userAfterRefresh = await page.evaluate(() =>
    localStorage.getItem('auth_user')
  );

  console.log('📦 After refresh storage:');
  console.log('  Token exists:', !!tokenAfterRefresh);
  console.log('  User exists:', !!userAfterRefresh);

  // Check what network requests happened during refresh
  console.log('🌐 Requests during refresh:');
  requests.forEach((req) => {
    console.log(`  ${req.method} ${req.url} -> ${req.status || 'pending'}`);
    if (req.url.includes('/auth/verify')) {
      console.log(
        `    Authorization header: ${req.headers.authorization || 'MISSING'}`
      );
    }
  });

  // Check for any verify requests
  const verifyRequests = requests.filter((r) => r.url.includes('/auth/verify'));
  console.log(`🔍 Auth verify requests: ${verifyRequests.length}`);
  verifyRequests.forEach((req) => {
    console.log(
      `  Status: ${req.status}, Headers: ${JSON.stringify(
        req.headers,
        null,
        2
      )}`
    );
  });

  if (urlAfterRefresh.includes('/home')) {
    console.log('🎉 SUCCESS: Authentication persisted!');
  } else {
    console.log('❌ FAILED: Authentication lost during refresh');
  }
});
