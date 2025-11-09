import { test, expect } from '@playwright/test';

test.describe('Color Input - Named Colors Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="color-setter-component"]');
  });

  test('should handle named colors and convert to HEX format', async ({
    page,
  }) => {
    // Click on display value to enter edit mode
    await page.click('[data-testid="display-value"]');

    // Wait for input field to appear
    await page.waitForSelector('[data-testid="color-input"]');

    const colorInput = page.locator('[data-testid="color-input"]');

    // Test various named colors
    const namedColors = [
      { name: 'red', expectedHex: '#ff0000' },
      { name: 'blue', expectedHex: '#0000ff' },
      { name: 'green', expectedHex: '#008000' },
      { name: 'crimson', expectedHex: '#dc143c' },
      { name: 'hotpink', expectedHex: '#ff69b4' },
      { name: 'navy', expectedHex: '#000080' },
      { name: 'gold', expectedHex: '#ffd700' },
    ];

    for (const colorTest of namedColors) {
      // Enter named color
      await colorInput.fill(colorTest.name);
      await colorInput.press('Enter');

      // Should switch to HEX format
      await page.waitForTimeout(100); // Small delay for state update
      const activeFormatButton = page.locator('[data-active="true"]');
      await expect(activeFormatButton).toContainText('HEX');

      // Check that the color preview updated
      const colorPreview = page.locator('[data-testid="color-preview"]');
      const backgroundColor = await colorPreview.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );

      // Convert RGB to HEX for comparison
      const rgbMatch = backgroundColor.match(
        /rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/
      );
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch;
        const hex =
          '#' +
          [r, g, b]
            .map((x) => parseInt(x).toString(16).padStart(2, '0'))
            .join('');
        expect(hex.toLowerCase()).toBe(colorTest.expectedHex.toLowerCase());
      }

      // Click display value again to test next color
      await page.click('[data-testid="display-value"]');
      await page.waitForSelector('[data-testid="color-input"]');
    }
  });

  test('should show error for invalid named colors', async ({ page }) => {
    // Click on display value to enter edit mode
    await page.click('[data-testid="display-value"]');

    // Wait for input field to appear
    await page.waitForSelector('[data-testid="color-input"]');

    const colorInput = page.locator('[data-testid="color-input"]');

    // Enter invalid named color
    await colorInput.fill('invalidcolorname');
    await colorInput.press('Enter');

    // Should show error message
    await page.waitForSelector('[data-testid="color-input-error"]');
    const errorMessage = page.locator('[data-testid="color-input-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Cannot parse color');

    // Input field should still be visible (not closed due to error)
    await expect(colorInput).toBeVisible();

    // Input border should be red
    await expect(colorInput).toHaveClass(/border-red-500/);
  });

  test('should handle mixed case named colors', async ({ page }) => {
    // Click on display value to enter edit mode
    await page.click('[data-testid="display-value"]');

    const colorInput = page.locator('[data-testid="color-input"]');

    // Test mixed case
    await colorInput.fill('CrImSoN');
    await colorInput.press('Enter');

    // Should still work and switch to HEX
    await page.waitForTimeout(100);
    const activeFormatButton = page.locator('[data-active="true"]');
    await expect(activeFormatButton).toContainText('HEX');

    // Should exit edit mode
    await expect(colorInput).not.toBeVisible();
    await expect(page.locator('[data-testid="display-value"]')).toBeVisible();
  });

  test('should handle named colors with extra spaces', async ({ page }) => {
    // Click on display value to enter edit mode
    await page.click('[data-testid="display-value"]');

    const colorInput = page.locator('[data-testid="color-input"]');

    // Test with extra spaces
    await colorInput.fill('  red  ');
    await colorInput.press('Enter');

    // Should still work
    await page.waitForTimeout(100);
    const activeFormatButton = page.locator('[data-active="true"]');
    await expect(activeFormatButton).toContainText('HEX');

    // Should exit edit mode
    await expect(colorInput).not.toBeVisible();
  });
});
