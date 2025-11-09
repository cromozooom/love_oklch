import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../../fixtures/auth';

/**
 * Quick test to verify hue preservation when dragging to achromatic colors
 */
test.describe('HEX Color Picker - Hue Preservation Bug Fix', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.PRO_USER.email, TEST_USERS.PRO_USER.password);

    await page.waitForSelector('button:has-text("New Project")', {
      timeout: 10000,
    });
    await page.click('button:has-text("New Project")');
    await page.waitForSelector('form', { timeout: 10000 });

    const projectName = `Hue Bug Test ${Date.now()}`;
    await page.fill('#name', projectName);
    await page.selectOption('select#colorGamut', 'sRGB');
    await page.selectOption('select#colorSpace', 'OKLCH');
    await page.fill('input#colorCount', '5');

    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForSelector('app-color-setter', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Ensure HEX picker is visible
    const hexCanvas = page.locator('[data-testid="color-canvas"]');
    if (!(await hexCanvas.isVisible())) {
      const hexTab = page
        .locator('text=HEX')
        .or(page.locator('[data-testid="hex-tab"]'));
      if (await hexTab.isVisible()) {
        await hexTab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should preserve hue when dragging to top-left corner (pure white)', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');
    const hexInput = page.locator('[data-testid="hex-input"]');

    // Start with red hue (0°)
    await hueSlider.fill('0');
    await page.waitForTimeout(200);

    // Get initial hue value
    const initialHue = await hueSlider.inputValue();
    console.log(`Initial hue: ${initialHue}°`);

    // Click on top-left corner (pure white - saturation = 0)
    await canvas.click({
      position: { x: 0, y: 0 },
    });
    await page.waitForTimeout(300);

    // Check the hue after clicking white
    const hueAfterWhite = await hueSlider.inputValue();
    const hexValue = await hexInput.inputValue();

    console.log(`After clicking white: hue=${hueAfterWhite}°, hex=${hexValue}`);

    // The hue should NOT change when selecting white
    expect(hueAfterWhite).toBe(initialHue);

    // The hex should be white or very close to white
    expect(hexValue.toLowerCase()).toMatch(/^#f[c-f]f[c-f]f[c-f]$/);
  });

  test('should preserve hue when dragging across left edge (changing saturation)', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');
    const indicator = page.locator('[data-testid="color-indicator"]');

    // Start with blue hue (240°) for more obvious color changes
    await hueSlider.fill('240');
    await page.waitForTimeout(200);

    const initialHue = await hueSlider.inputValue();
    console.log(`Initial hue: ${initialHue}° (blue)`);

    // Test multiple points along the left edge (saturation = 0)
    const testPositions = [
      { x: 0, y: 50, name: 'light gray' },
      { x: 0, y: 100, name: 'medium gray' },
      { x: 0, y: 150, name: 'dark gray' },
      { x: 0, y: 200, name: 'darker gray' },
    ];

    for (const pos of testPositions) {
      await canvas.click({
        position: { x: pos.x, y: pos.y },
      });
      await page.waitForTimeout(200);

      const currentHue = await hueSlider.inputValue();
      console.log(`${pos.name} (${pos.x},${pos.y}): hue=${currentHue}°`);

      // Hue should remain unchanged
      expect(currentHue).toBe(initialHue);
    }
  });

  test('should preserve hue during continuous drag to white', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');
    const indicator = page.locator('[data-testid="color-indicator"]');

    // Start with green hue (120°)
    await hueSlider.fill('120');
    await page.waitForTimeout(200);

    const initialHue = await hueSlider.inputValue();
    console.log(`Initial hue: ${initialHue}° (green)`);

    // Start from right side (saturated) and drag to left side (white)
    await indicator.hover();
    await page.mouse.down();

    const canvasBox = await canvas.boundingBox();

    // Drag from right to left across multiple points
    const steps = [
      { x: 200, y: 50 }, // Saturated color
      { x: 150, y: 50 }, // Less saturated
      { x: 100, y: 50 }, // Even less saturated
      { x: 50, y: 50 }, // Low saturation
      { x: 0, y: 50 }, // No saturation (white)
    ];

    for (const step of steps) {
      await page.mouse.move(canvasBox!.x + step.x, canvasBox!.y + step.y);
      await page.waitForTimeout(100);

      const currentHue = await hueSlider.inputValue();
      console.log(`Drag step (${step.x},${step.y}): hue=${currentHue}°`);

      // Hue should never change during drag
      expect(currentHue).toBe(initialHue);
    }

    await page.mouse.up();
    await page.waitForTimeout(200);

    // Final hue check
    const finalHue = await hueSlider.inputValue();
    console.log(`Final hue after drag: ${finalHue}°`);
    expect(finalHue).toBe(initialHue);
  });
});
