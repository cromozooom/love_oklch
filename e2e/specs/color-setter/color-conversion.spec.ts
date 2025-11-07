import { test, expect } from '@playwright/test';
import { loginAsUser, TEST_USERS } from '../../fixtures/auth';

/**
 * Test Suite: Color Format Conversion
 *
 * Tests that colors are correctly preserved when switching between
 * different color formats (HEX, RGB, HSL).
 *
 * Critical for ensuring no color data loss during format switching.
 */
test.describe('Color Setter Component - Color Format Conversion', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await loginAsUser(page, TEST_USERS.PRO_USER);

    // Wait for projects page to load
    await page.waitForSelector('button:has-text("New Project")', {
      timeout: 10000,
    });
    await page.waitForLoadState('networkidle');

    // Create a new project to access color setter
    await page.click('button:has-text("New Project")');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Fill minimal form to create project
    const projectName = `Test ${Date.now()}`;
    await page.fill('#name', projectName);
    await page.selectOption('select#colorGamut', 'sRGB');
    await page.selectOption('select#colorSpace', 'OKLCH');
    await page.fill('input#colorCount', '5');

    // Submit form to create project
    await page.click('button[type="submit"]:has-text("Create")');

    // Wait for project editor/color setter to load
    await page.waitForSelector('app-color-setter', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Wait a bit more for Angular change detection
    await page.waitForTimeout(500);
  });

  test.describe('RGB to HSL Conversion', () => {
    test('T020: Should correctly convert RGB(255, 157, 21) to HSL', async ({
      page,
    }) => {
      // Given: Switch to RGB format
      const rgbFormatBtn = page.locator('[data-testid="format-selector-rgb"]');
      await rgbFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // When: Set RGB values to orange (255, 157, 21)
      const rSlider = page.locator('[data-testid="rgb-slider-r"]');
      const gSlider = page.locator('[data-testid="rgb-slider-g"]');
      const bSlider = page.locator('[data-testid="rgb-slider-b"]');

      await rSlider.waitFor({ state: 'visible', timeout: 5000 });

      await rSlider.evaluate((el: any) => {
        el.value = '255';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await gSlider.evaluate((el: any) => {
        el.value = '157';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await bSlider.evaluate((el: any) => {
        el.value = '21';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // And: Switch to HSL format
      const hslFormatBtn = page.locator('[data-testid="format-selector-hsl"]');
      await hslFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const hueSlider = page.locator('[data-testid="hsl-slider-h"]');
      await hueSlider.waitFor({ state: 'visible', timeout: 5000 });

      // Then: HSL values should correctly represent the orange color
      const hValue = await hueSlider.inputValue();
      const sValue = await page
        .locator('[data-testid="hsl-slider-s"]')
        .inputValue();
      const lValue = await page
        .locator('[data-testid="hsl-slider-l"]')
        .inputValue();

      console.log(`HSL Values - H: ${hValue}°, S: ${sValue}%, L: ${lValue}%`);
      console.log(`Expected: H: ~35°, S: ~100%, L: ~54%`);

      // RGB(255, 157, 21) converts to HSL(34.87°, 100%, 54.12%)
      // This is correct per HSL formula: fully saturated orange
      expect(parseFloat(hValue)).toBeGreaterThan(33);
      expect(parseFloat(hValue)).toBeLessThan(37);
      expect(parseFloat(sValue)).toBeGreaterThan(98); // Nearly fully saturated
      expect(parseFloat(lValue)).toBeGreaterThan(52);
      expect(parseFloat(lValue)).toBeLessThan(56);
    });

    test('T021: Should correctly convert RGB(0, 128, 255) to HSL', async ({
      page,
    }) => {
      // Given: Switch to RGB format
      const rgbFormatBtn = page.locator('[data-testid="format-selector-rgb"]');
      await rgbFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // When: Set RGB values to blue (0, 128, 255)
      const rSlider = page.locator('[data-testid="rgb-slider-r"]');
      const gSlider = page.locator('[data-testid="rgb-slider-g"]');
      const bSlider = page.locator('[data-testid="rgb-slider-b"]');

      await rSlider.waitFor({ state: 'visible', timeout: 5000 });

      await rSlider.evaluate((el: any) => {
        el.value = '0';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await gSlider.evaluate((el: any) => {
        el.value = '128';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await bSlider.evaluate((el: any) => {
        el.value = '255';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // And: Switch to HSL format
      const hslFormatBtn = page.locator('[data-testid="format-selector-hsl"]');
      await hslFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const hueSlider = page.locator('[data-testid="hsl-slider-h"]');
      await hueSlider.waitFor({ state: 'visible', timeout: 5000 });

      // Then: HSL values should correctly represent the blue color
      const hValue = await hueSlider.inputValue();
      const sValue = await page
        .locator('[data-testid="hsl-slider-s"]')
        .inputValue();
      const lValue = await page
        .locator('[data-testid="hsl-slider-l"]')
        .inputValue();

      // RGB(0, 128, 255) should convert to approximately HSL(210°, 100%, 50%)
      expect(parseFloat(hValue)).toBeGreaterThan(208);
      expect(parseFloat(hValue)).toBeLessThan(212);
      expect(parseFloat(sValue)).toBeGreaterThan(98);
      expect(parseFloat(lValue)).toBeGreaterThan(48);
      expect(parseFloat(lValue)).toBeLessThan(52);
    });
  });

  test.describe('HSL to RGB Conversion', () => {
    test('T022: Should correctly convert HSL(85°, 76%, 35%) to RGB', async ({
      page,
    }) => {
      const hexInput = page.locator('[data-testid="hex-input"]');

      // Given: Start with a base color
      await hexInput.clear();
      await hexInput.fill('#00FF00'); // Green
      await hexInput.blur();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // When: Switch to HSL format
      const hslFormatBtn = page.locator('[data-testid="format-selector-hsl"]');
      await hslFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const hueSlider = page.locator('[data-testid="hsl-slider-h"]');
      await hueSlider.waitFor({ state: 'visible', timeout: 5000 });

      // And: Set HSL values to (85°, 76%, 35%)
      await hueSlider.evaluate((el: any) => {
        el.value = '85';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.locator('[data-testid="hsl-slider-s"]').evaluate((el: any) => {
        el.value = '76';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.locator('[data-testid="hsl-slider-l"]').evaluate((el: any) => {
        el.value = '35';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // And: Switch to RGB format
      const rgbFormatBtn = page.locator('[data-testid="format-selector-rgb"]');
      await rgbFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const rSlider = page.locator('[data-testid="rgb-slider-r"]');
      await rSlider.waitFor({ state: 'visible', timeout: 5000 });

      // Then: RGB values should correctly represent the yellowish-green color
      const rValue = await rSlider.inputValue();
      const gValue = await page
        .locator('[data-testid="rgb-slider-g"]')
        .inputValue();
      const bValue = await page
        .locator('[data-testid="rgb-slider-b"]')
        .inputValue();

      // HSL(85°, 76%, 35%) converts to RGB(101, 157, 21) per colorjs.io
      expect(parseFloat(rValue)).toBeGreaterThan(98);
      expect(parseFloat(rValue)).toBeLessThan(105);
      expect(parseFloat(gValue)).toBeGreaterThan(154);
      expect(parseFloat(gValue)).toBeLessThan(160);
      expect(parseFloat(bValue)).toBeGreaterThan(18);
      expect(parseFloat(bValue)).toBeLessThan(25);
    });
  });

  test.describe('Round-Trip Conversion', () => {
    test('T023: Should preserve color through HEX → RGB → HSL → HEX conversion', async ({
      page,
    }) => {
      const hexInput = page.locator('[data-testid="hex-input"]');

      // Given: Start with a specific HEX color (magenta)
      const originalHex = '#FF00FF';
      await hexInput.clear();
      await hexInput.fill(originalHex);
      await hexInput.blur();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // When: Convert to RGB
      const rgbFormatBtn = page.locator('[data-testid="format-selector-rgb"]');
      await rgbFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const rSlider = page.locator('[data-testid="rgb-slider-r"]');
      await rSlider.waitFor({ state: 'visible', timeout: 5000 });

      // Verify RGB values are correct for magenta
      const rValue = await rSlider.inputValue();
      const gValue = await page
        .locator('[data-testid="rgb-slider-g"]')
        .inputValue();
      const bValue = await page
        .locator('[data-testid="rgb-slider-b"]')
        .inputValue();

      expect(parseFloat(rValue)).toBe(255);
      expect(parseFloat(gValue)).toBe(0);
      expect(parseFloat(bValue)).toBe(255);

      // And: Convert to HSL
      const hslFormatBtn = page.locator('[data-testid="format-selector-hsl"]');
      await hslFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const hueSlider = page.locator('[data-testid="hsl-slider-h"]');
      await hueSlider.waitFor({ state: 'visible', timeout: 5000 });

      // Verify HSL values are correct for magenta
      const hValue = await hueSlider.inputValue();
      const sValue = await page
        .locator('[data-testid="hsl-slider-s"]')
        .inputValue();
      const lValue = await page
        .locator('[data-testid="hsl-slider-l"]')
        .inputValue();

      // Magenta should be around HSL(300°, 100%, 50%)
      expect(parseFloat(hValue)).toBeGreaterThan(298);
      expect(parseFloat(hValue)).toBeLessThan(302);
      expect(parseFloat(sValue)).toBeGreaterThan(98);
      expect(parseFloat(lValue)).toBeGreaterThan(48);
      expect(parseFloat(lValue)).toBeLessThan(52);

      // And: Convert back to HEX
      const hexFormatBtn = page.locator('[data-testid="format-selector-hex"]');
      await hexFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Then: HEX should match the original (or be very close)
      const finalHex = await hexInput.inputValue();
      expect(finalHex.toUpperCase()).toBe('#FF00FF');
    });

    test('T024: Should handle achromatic colors (black, white, gray) correctly', async ({
      page,
    }) => {
      const hexInput = page.locator('[data-testid="hex-input"]');

      // Test black
      await hexInput.clear();
      await hexInput.fill('#000000');
      await hexInput.blur();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Switch to HSL
      const hslFormatBtn = page.locator('[data-testid="format-selector-hsl"]');
      await hslFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const hueSlider = page.locator('[data-testid="hsl-slider-h"]');
      await hueSlider.waitFor({ state: 'visible', timeout: 5000 });

      // Black should have hue=0, saturation=0, lightness=0
      const hValue = await hueSlider.inputValue();
      const sValue = await page
        .locator('[data-testid="hsl-slider-s"]')
        .inputValue();
      const lValue = await page
        .locator('[data-testid="hsl-slider-l"]')
        .inputValue();

      expect(parseFloat(hValue)).toBe(0); // Hue defaults to 0 for achromatic colors
      expect(parseFloat(sValue)).toBe(0);
      expect(parseFloat(lValue)).toBe(0);

      // Test white
      const hexFormatBtn = page.locator('[data-testid="format-selector-hex"]');
      await hexFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      await hexInput.clear();
      await hexInput.fill('#FFFFFF');
      await hexInput.blur();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      await hslFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const hValue2 = await hueSlider.inputValue();
      const sValue2 = await page
        .locator('[data-testid="hsl-slider-s"]')
        .inputValue();
      const lValue2 = await page
        .locator('[data-testid="hsl-slider-l"]')
        .inputValue();

      // White should have hue=0, saturation=0, lightness=100
      expect(parseFloat(hValue2)).toBe(0); // Hue defaults to 0 for achromatic colors
      expect(parseFloat(sValue2)).toBe(0);
      expect(parseFloat(lValue2)).toBe(100);
    });
  });

  test.describe('Edge Cases', () => {
    test('T025: Should handle RGB values at maximum (255, 255, 255)', async ({
      page,
    }) => {
      const rgbFormatBtn = page.locator('[data-testid="format-selector-rgb"]');
      await rgbFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const rSlider = page.locator('[data-testid="rgb-slider-r"]');
      await rSlider.waitFor({ state: 'visible', timeout: 5000 });

      // Set all RGB to max (white)
      await rSlider.evaluate((el: any) => {
        el.value = '255';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.locator('[data-testid="rgb-slider-g"]').evaluate((el: any) => {
        el.value = '255';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.locator('[data-testid="rgb-slider-b"]').evaluate((el: any) => {
        el.value = '255';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Switch to HSL
      const hslFormatBtn = page.locator('[data-testid="format-selector-hsl"]');
      await hslFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const lSlider = page.locator('[data-testid="hsl-slider-l"]');
      await lSlider.waitFor({ state: 'visible', timeout: 5000 });

      const lValue = await lSlider.inputValue();

      // White should have lightness = 100%
      expect(parseFloat(lValue)).toBe(100);
    });

    test('T026: Should handle single-channel RGB colors', async ({ page }) => {
      const rgbFormatBtn = page.locator('[data-testid="format-selector-rgb"]');
      await rgbFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const rSlider = page.locator('[data-testid="rgb-slider-r"]');
      await rSlider.waitFor({ state: 'visible', timeout: 5000 });

      // Set only red channel (pure red)
      await rSlider.evaluate((el: any) => {
        el.value = '255';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.locator('[data-testid="rgb-slider-g"]').evaluate((el: any) => {
        el.value = '0';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.locator('[data-testid="rgb-slider-b"]').evaluate((el: any) => {
        el.value = '0';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Switch to HSL
      const hslFormatBtn = page.locator('[data-testid="format-selector-hsl"]');
      await hslFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const hueSlider = page.locator('[data-testid="hsl-slider-h"]');
      await hueSlider.waitFor({ state: 'visible', timeout: 5000 });

      const hValue = await hueSlider.inputValue();
      const sValue = await page
        .locator('[data-testid="hsl-slider-s"]')
        .inputValue();
      const lValue = await page
        .locator('[data-testid="hsl-slider-l"]')
        .inputValue();

      // Pure red should be HSL(0°, 100%, 50%)
      expect(parseFloat(hValue)).toBe(0);
      expect(parseFloat(sValue)).toBe(100);
      expect(parseFloat(lValue)).toBe(50);
    });
  });
});
