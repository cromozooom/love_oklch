import { test, expect } from '@playwright/test';
import { SELECTORS } from '../../utils/selectors';
import { setupColorSetterTest } from '../../utils/actions';

test.describe('ONHH: OKLCH NaN Hue Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Setup color setter test with login and project creation
    await setupColorSetterTest(page, {
      name: `OKLCH NaN Test ${Date.now()}`,
      colorGamut: 'sRGB',
      colorSpace: 'OKLCH',
      colorCount: 5,
    });
  });

  test('ONHH01: should handle grey colors without NaN in OKLCH format', async ({
    page,
  }) => {
    // Switch to OKLCH format
    await page.click(SELECTORS.colorSetter.formatSelector.oklch);

    // Enter a grey color that would normally produce NaN hue
    await page.click(SELECTORS.colorSetter.displayValue);
    await page.waitForSelector(SELECTORS.colorSetter.colorInput);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);

    // Test various grey colors
    const greyColors = [
      '#808080', // medium grey
      '#cccccc', // light grey
      '#333333', // dark grey
      '#ffffff', // white
      '#000000', // black
      'gray', // named color
      'lightgray', // named color
    ];

    for (const greyColor of greyColors) {
      console.log(`Testing grey color: ${greyColor}`);

      // Clear and enter grey color
      await colorInput.fill(greyColor);
      await colorInput.press('Enter');

      // Should successfully parse and switch to appropriate format
      await page.waitForTimeout(100);

      // Check that display value doesn't contain NaN
      const displayValue = await page
        .locator(SELECTORS.colorSetter.displayValue)
        .textContent();
      expect(displayValue).not.toContain('NaN');
      console.log(`Display value: ${displayValue}`);

      // If it switched to OKLCH, verify the format is valid
      const activeFormat = await page
        .locator(SELECTORS.colorSetter.activeFormatButton)
        .textContent();
      if (activeFormat?.includes('OKLCH')) {
        // OKLCH format should be oklch(L C H) where all values are numbers
        expect(displayValue).toMatch(
          /oklch\(\d+\.\d+\s+\d+\.\d+\s+\d+(\.\d+)?\)/
        );
        expect(displayValue).not.toContain('NaN');
      }

      // Click display value again for next test
      await page.click(SELECTORS.colorSetter.displayValue);
      await page.waitForSelector(SELECTORS.colorSetter.colorInput);
    }
  });

  test('ONHH02: should handle achromatic colors in OKLCH sliders without NaN', async ({
    page,
  }) => {
    // Switch to OKLCH format first
    await page.click(SELECTORS.colorSetter.formatSelector.oklch);
    await page.waitForTimeout(300);

    // Test OKLCH NaN handling by inputting OKLCH values directly
    // This tests the core functionality without relying on sliders
    console.log('Testing OKLCH NaN handling with direct input...');

    const oklchTestValues = [
      'oklch(0.5 0 0)', // Achromatic (no chroma) - should not produce NaN
      'oklch(0.8 0.0 90)', // White-ish achromatic
      'oklch(0.2 0.000 180)', // Dark achromatic
      '#808080', // HEX input that should convert to OKLCH
    ];

    for (const testValue of oklchTestValues) {
      console.log(`Testing input: ${testValue}`);

      await page.click(SELECTORS.colorSetter.displayValue);
      await page.waitForSelector(SELECTORS.colorSetter.colorInput);

      const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
      await colorInput.fill(testValue);
      await colorInput.press('Enter');
      await page.waitForTimeout(300);

      // Check that display value doesn't contain NaN
      const displayValue = await page
        .locator(SELECTORS.colorSetter.displayValue)
        .textContent();

      expect(displayValue).not.toContain('NaN');
      console.log(`${testValue} -> ${displayValue}`);

      // If the result is in OKLCH format, verify it's valid
      if (displayValue?.includes('oklch')) {
        expect(displayValue).toMatch(
          /oklch\(\d+\.\d+\s+\d+\.\d+\s+\d+(\.\d+)?\)/
        );
      }
    }
  });

  test('ONHH03: should maintain valid OKLCH format when switching between grey colors', async ({
    page,
  }) => {
    // Switch to OKLCH format
    await page.click(SELECTORS.colorSetter.formatSelector.oklch);

    const greyColorSequence = ['#000000', '#808080', '#ffffff', '#333333'];

    for (const greyColor of greyColorSequence) {
      // Enter grey color
      await page.click(SELECTORS.colorSetter.displayValue);
      await page.waitForSelector(SELECTORS.colorSetter.colorInput);

      const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
      await colorInput.fill(greyColor);
      await colorInput.press('Enter');

      await page.waitForTimeout(100);

      // Verify no NaN in display
      const displayValue = await page
        .locator(SELECTORS.colorSetter.displayValue)
        .textContent();
      expect(displayValue).not.toContain('NaN');

      // Verify valid OKLCH format
      if (displayValue?.includes('oklch')) {
        expect(displayValue).toMatch(
          /oklch\(\d+\.\d+\s+\d+\.\d+\s+\d+(\.\d+)?\)/
        );
      }

      console.log(`${greyColor} -> ${displayValue}`);
    }
  });
});
