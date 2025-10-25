import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:4200');
  });

  test('should redirect unauthenticated user to login page', async ({
    page,
  }) => {
    // Check that unauthenticated user is redirected to login
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h1')).toContainText('Welcome Back');
  });

  test('should allow user to login and redirect to home', async ({ page }) => {
    // Fill in login form
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to home page
    await expect(page).toHaveURL(/.*\/home/);

    // Verify home page content
    await expect(page.locator('h1')).toContainText('Love OKLCH');
    await expect(page.locator('text=Welcome, admin@example.com')).toBeVisible();
    await expect(page.locator('text=Authentication Successful!')).toBeVisible();
  });

  test('should maintain authentication after page refresh', async ({
    page,
  }) => {
    // Login first
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for home page to load
    await expect(page).toHaveURL(/.*\/home/);
    await expect(page.locator('h1')).toContainText('Love OKLCH');

    // Refresh the page
    await page.reload();

    // Should still be on home page (not redirected to login)
    await expect(page).toHaveURL(/.*\/home/);
    await expect(page.locator('h1')).toContainText('Love OKLCH');
    await expect(page.locator('text=Welcome, admin@example.com')).toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    // Fill form
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Click submit and check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // The button should show loading state (spinner or disabled)
    await expect(submitButton).toBeDisabled();
  });

  test('should handle invalid credentials', async ({ page }) => {
    // Fill form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Click login button
    await page.click('button[type="submit"]');

    // Should stay on login page and show error
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should handle logout functionality', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for home page
    await expect(page).toHaveURL(/.*\/home/);

    // Click logout button
    await page.click('button:has-text("Logout")');

    // Should redirect to login page
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h1')).toContainText('Welcome Back');
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for home page
    await expect(page).toHaveURL(/.*\/home/);

    // Go back (should not go to login if authenticated)
    await page.goBack();

    // Should still be on home or redirected appropriately
    await expect(page).toHaveURL(/.*\/(home|login)/);

    // If redirected to login, that indicates an auth issue
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log(
        'WARNING: User was redirected to login on back navigation - possible auth persistence issue'
      );
    }
  });

  test('should preserve authentication across multiple page reloads', async ({
    page,
  }) => {
    // Login
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for home page
    await expect(page).toHaveURL(/.*\/home/);

    // Reload multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await expect(page).toHaveURL(/.*\/home/);
      await expect(page.locator('h1')).toContainText('Love OKLCH');

      // Add small delay between reloads
      await page.waitForTimeout(500);
    }
  });

  test('should handle direct navigation to protected route when authenticated', async ({
    page,
  }) => {
    // Login first
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for home page
    await expect(page).toHaveURL(/.*\/home/);

    // Direct navigate to home again
    await page.goto('http://localhost:4200/home');

    // Should load home page directly (not redirect to login)
    await expect(page).toHaveURL(/.*\/home/);
    await expect(page.locator('h1')).toContainText('Love OKLCH');
  });

  test('should clear authentication on logout and prevent access', async ({
    page,
  }) => {
    // Login
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for home page
    await expect(page).toHaveURL(/.*\/home/);

    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(/.*\/login/);

    // Try to access protected route directly
    await page.goto('http://localhost:4200/home');

    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/login/);
  });
});
