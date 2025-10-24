import { test, expect } from '@playwright/test';

test.describe('Love OKLCH Application', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle(/Love OKLCH/);

    // Check for Angular app loading
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/');

    // Basic accessibility checks
    await expect(page.locator('h1')).toBeVisible();

    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('app-root')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('app-root')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('app-root')).toBeVisible();
  });
});
