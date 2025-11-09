import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../../fixtures/auth';

test.describe('HEX Color Picker - Hue Preservation', () => {
  test.beforeEach(async ({ page }) => {
    // Login and setup
    await login(page, TEST_USERS.PRO_USER.email, TEST_USERS.PRO_USER.password);
    await page.waitForSelector('button:has-text("New Project")', {
      timeout: 10000,
    });
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("New Project")');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const projectName = `Hue Input Test ${Date.now()}`;
    await page.fill('#name', projectName);
    await page.selectOption('select#colorGamut', 'sRGB');
    await page.selectOption('select#colorSpace', 'OKLCH');
    await page.fill('input#colorCount', '5');
    await page.click('button[type="submit"]:has-text("Create")');

    await page.waitForSelector('app-color-setter', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Switch to HEX format
    await page.click('[data-testid="format-selector-hex"]');
    await page.waitForTimeout(100);
  });

  test('should preserve hue value during canvas drag operations', async ({
    page,
  }) => {
    // Find the hue number input and set it to 320
    const hueInput = page.locator(
      '[data-testid="hex-hue-slider-number-input"]'
    );
    await expect(hueInput).toBeVisible({ timeout: 10000 });

    // Set initial hue value
    await hueInput.fill('320');
    await hueInput.blur();
    await page.waitForTimeout(500);

    // Verify initial hue value is set
    await expect(hueInput).toHaveValue('320.00');

    // Find the canvas and color indicator
    const canvas = page.locator('[data-testid="color-canvas"]');
    const colorIndicator = page.locator('[data-testid="color-indicator"]');

    await expect(canvas).toBeVisible();
    await expect(colorIndicator).toBeVisible();

    // Get canvas bounds for drag operations
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    // Perform multiple drag operations on different areas of the canvas
    if (canvasBox) {
      // Drag to top-left (high saturation, high brightness)
      await page.mouse.move(canvasBox.x + 10, canvasBox.y + 10);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + 50, canvasBox.y + 50);
      await page.mouse.up();
      await page.waitForTimeout(100);

      // Verify hue is still 320
      await expect(hueInput).toHaveValue('320.00');

      // Drag to center (medium saturation, medium brightness)
      await page.mouse.move(
        canvasBox.x + canvasBox.width / 2,
        canvasBox.y + canvasBox.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        canvasBox.x + canvasBox.width / 2 + 20,
        canvasBox.y + canvasBox.height / 2 + 20
      );
      await page.mouse.up();
      await page.waitForTimeout(100);

      // Verify hue is still 320
      await expect(hueInput).toHaveValue('320.00');

      // Drag to bottom-right (low saturation, low brightness)
      await page.mouse.move(
        canvasBox.x + canvasBox.width - 10,
        canvasBox.y + canvasBox.height - 10
      );
      await page.mouse.down();
      await page.mouse.move(
        canvasBox.x + canvasBox.width - 30,
        canvasBox.y + canvasBox.height - 30
      );
      await page.mouse.up();
      await page.waitForTimeout(100);

      // Final verification that hue is preserved
      await expect(hueInput).toHaveValue('320.00');
    }
  });
});
