import { test, expect } from '@playwright/test';

test.describe('ONHH: OKLCH NaN Hue Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="color-setter-component"]');
  });

  test('ONHH01: should handle grey colors without NaN in OKLCH format', async ({
    page,
  }) => {
    // Switch to OKLCH format
    await page.click('[data-testid="format-selector-oklch"]');

    // Enter a grey color that would normally produce NaN hue
    await page.click('[data-testid="display-value"]');
    await page.waitForSelector('[data-testid="color-input"]');

    const colorInput = page.locator('[data-testid="color-input"]');

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
        .locator('[data-testid="display-value"]')
        .textContent();
      expect(displayValue).not.toContain('NaN');
      console.log(`Display value: ${displayValue}`);

      // If it switched to OKLCH, verify the format is valid
      const activeFormat = await page
        .locator('[data-active="true"]')
        .textContent();
      if (activeFormat?.includes('OKLCH')) {
        // OKLCH format should be oklch(L C H) where all values are numbers
        expect(displayValue).toMatch(
          /oklch\(\d+\.\d+\s+\d+\.\d+\s+\d+(\.\d+)?\)/
        );
        expect(displayValue).not.toContain('NaN');
      }

      // Click display value again for next test
      await page.click('[data-testid="display-value"]');
      await page.waitForSelector('[data-testid="color-input"]');
    }
  });

  test('ONHH02: should handle achromatic colors in OKLCH sliders without NaN', async ({
    page,
  }) => {
    // Switch to OKLCH format first
    await page.click('[data-testid="format-selector-oklch"]');

    // Set a grey color first
    await page.click('[data-testid="display-value"]');
    await page.waitForSelector('[data-testid="color-input"]');

    const colorInput = page.locator('[data-testid="color-input"]');
    await colorInput.fill('#808080');
    await colorInput.press('Enter');

    // Should be in OKLCH mode now
    await page.waitForTimeout(100);

    // Find the chroma slider and set it to 0 (making color achromatic)
    const chromaSlider = page.locator('input[type="range"]').nth(1); // Assuming chroma is second slider
    await chromaSlider.fill('0');

    // Wait for update
    await page.waitForTimeout(100);

    // Check that display value doesn't contain NaN after making color achromatic
    const displayValue = await page
      .locator('[data-testid="display-value"]')
      .textContent();
    expect(displayValue).not.toContain('NaN');
    expect(displayValue).toMatch(/oklch\(\d+\.\d+\s+0\.000\s+\d+(\.\d+)?\)/);

    console.log(`Achromatic OKLCH value: ${displayValue}`);
  });

  test('ONHH03: should maintain valid OKLCH format when switching between grey colors', async ({
    page,
  }) => {
    // Switch to OKLCH format
    await page.click('[data-testid="format-selector-oklch"]');

    const greyColorSequence = ['#000000', '#808080', '#ffffff', '#333333'];

    for (const greyColor of greyColorSequence) {
      // Enter grey color
      await page.click('[data-testid="display-value"]');
      await page.waitForSelector('[data-testid="color-input"]');

      const colorInput = page.locator('[data-testid="color-input"]');
      await colorInput.fill(greyColor);
      await colorInput.press('Enter');

      await page.waitForTimeout(100);

      // Verify no NaN in display
      const displayValue = await page
        .locator('[data-testid="display-value"]')
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
