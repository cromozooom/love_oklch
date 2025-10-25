import { test, expect } from '@playwright/test';

test.describe('Admin Access and Plan Management', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging to see debug messages
    page.on('console', (msg) => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`Browser Console [${msg.type()}]:`, msg.text());
      }
    });
  });

  test('should login as admin and access plan management', async ({ page }) => {
    console.log('Starting admin access test...');

    // Navigate to the application
    await page.goto('http://localhost:4200');
    console.log('Navigated to homepage');

    // Should redirect to login page or show login form
    await page.waitForSelector('form', { timeout: 10000 });
    console.log('Login form found');

    // Fill in admin credentials
    await page.fill(
      'input[type="email"], input[name="email"], #email',
      'admin@example.com'
    );
    await page.fill(
      'input[type="password"], input[name="password"], #password',
      'password123'
    );
    console.log('Filled admin credentials');

    // Click login button
    const loginButton = page.locator(
      'button[type="submit"], button:has-text("Login"), button:has-text("Sign In")'
    );
    await loginButton.click();
    console.log('Clicked login button');

    // Wait for navigation after login
    await page.waitForLoadState('networkidle');
    console.log('Waited for navigation');

    // Check current URL and page state
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/after-login.png' });

    // Check if we're authenticated by looking for user-specific elements
    const isLoggedIn = await page.locator('body').evaluate(() => {
      // Check localStorage for auth data
      const token = localStorage.getItem('auth_token');
      const user = localStorage.getItem('auth_user');
      console.log('Auth token exists:', !!token);
      console.log('User data:', user);
      return { hasToken: !!token, userData: user };
    });

    console.log('Authentication check:', isLoggedIn);
    expect(isLoggedIn.hasToken).toBe(true);

    // Parse user data to verify admin role
    if (isLoggedIn.userData) {
      const userData = JSON.parse(isLoggedIn.userData);
      console.log('Parsed user data:', userData);
      expect(userData.role).toBe('admin');
    }

    // Now try to navigate to admin area
    console.log('Attempting to navigate to admin area...');
    await page.goto('http://localhost:4200/admin/plan-management');

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Check final URL
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);

    // Take screenshot of admin page
    await page.screenshot({ path: 'test-results/admin-page.png' });

    // Check if we're on the admin page (should NOT be redirected to /home)
    expect(finalUrl).toContain('/admin');

    // Look for admin-specific content
    const pageContent = await page.content();
    console.log(
      'Page contains "Plan Management":',
      pageContent.includes('Plan Management')
    );
    console.log(
      'Page contains "admin":',
      pageContent.toLowerCase().includes('admin')
    );

    // Wait for and verify admin components are present
    await expect(page.locator('h1, h2')).toContainText('Plan Management');

    // Verify admin functionality buttons are present
    await expect(page.locator('button')).toContainText('Create New Plan');

    console.log('Admin access test completed successfully!');
  });

  test('should show debug information in console', async ({ page }) => {
    // This test specifically focuses on capturing console debug output
    const consoleMessages: string[] = [];

    page.on('console', (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Navigate to admin area directly (should trigger guard)
    await page.goto('http://localhost:4200/admin/plan-management');
    await page.waitForLoadState('networkidle');

    // Print all console messages
    console.log('=== Console Messages ===');
    consoleMessages.forEach((msg) => console.log(msg));
    console.log('=== End Console Messages ===');

    // Take screenshot for visual debugging
    await page.screenshot({ path: 'test-results/debug-page.png' });
  });

  test('should verify backend connectivity', async ({ page }) => {
    // Test if backend is responding
    const response = await page.request.get(
      'http://localhost:3001/api/v1/health'
    );
    console.log('Backend health check status:', response.status());
    expect(response.status()).toBe(200);

    // Test auth endpoint
    const authResponse = await page.request.post(
      'http://localhost:3001/api/v1/auth/login',
      {
        data: {
          email: 'admin@example.com',
          password: 'password123',
        },
      }
    );

    console.log('Auth response status:', authResponse.status());
    const authData = await authResponse.json();
    console.log('Auth response data:', authData);

    expect(authResponse.status()).toBe(200);
    expect(authData.success).toBe(true);
    expect(authData.data.user.role).toBe('admin');
  });
});
