import { test, expect } from '@playwright/test';
import {
  SELECTORS,
  setupColorSetterTest,
  setColorViaInput,
  logTestStep,
  logTestSection,
} from '../../utils';

/**
 * Test Suite: Color Input Named Colors Support
 *
 * Tests that the color input field can handle CSS named colors
 * and properly convert them to appropriate formats.
 */
test.describe('CINCS: Color Input - Named Colors Support', () => {
  test.beforeEach(async ({ page }) => {
    // Use centralized setup utility
    await setupColorSetterTest(page);

    // Set initial neutral color
    await setColorViaInput(page, '#808080'); // Gray as neutral starting point
  });

  test('CINCS01: should handle named colors and convert to HEX format', async ({
    page,
  }) => {
    logTestSection('Testing named colors conversion to HEX format');

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
      logTestStep(`Testing named color: ${colorTest.name}`);

      // Enter edit mode
      await page.click(SELECTORS.colorSetter.displayValue);
      const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
      await expect(colorInput).toBeVisible({ timeout: 5000 });

      // Enter named color
      await colorInput.fill(colorTest.name);
      await colorInput.press('Enter');

      // Should switch to HEX format
      await page.waitForTimeout(200);
      const activeFormatButton = page.locator(
        SELECTORS.colorSetter.activeFormatButton
      );
      await expect(activeFormatButton).toContainText('HEX');

      // Verify the display value shows the correct hex color
      const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
      await expect(displayValue).toBeVisible({ timeout: 5000 });

      const displayText = await displayValue.textContent();
      expect(displayText?.toLowerCase()).toContain(
        colorTest.expectedHex.toLowerCase()
      );

      // Verify color preview updated
      const colorPreview = page.locator(SELECTORS.colorSetter.colorPreview);
      await expect(colorPreview).toBeVisible();
    }
  });

  test('CINCS02: should show error for invalid named colors', async ({
    page,
  }) => {
    logTestStep('Testing invalid named color error handling');

    // Enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);
    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Enter invalid named color
    logTestStep('Entering invalid named color');
    await colorInput.fill('invalidcolorname');
    await colorInput.press('Enter');

    // Should show error message
    logTestStep('Verifying error message appears');
    const errorMessage = page.locator(SELECTORS.colorSetter.colorInputError);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toContainText('Cannot parse color');

    // Input field should still be visible (not closed due to error)
    await expect(colorInput).toBeVisible();

    // Input border should be red (error state)
    await expect(colorInput).toHaveClass(/border-red-500/);
  });

  test('CINCS03: should handle mixed case named colors', async ({ page }) => {
    logTestStep('Testing mixed case named color handling');

    // Enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);
    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Test mixed case
    logTestStep('Entering mixed case "CrImSoN"');
    await colorInput.fill('CrImSoN');
    await colorInput.press('Enter');

    // Should still work and switch to HEX
    await page.waitForTimeout(200);
    logTestStep('Verifying format switched to HEX');
    const activeFormatButton = page.locator(
      SELECTORS.colorSetter.activeFormatButton
    );
    await expect(activeFormatButton).toContainText('HEX');

    // Should exit edit mode
    await expect(colorInput).not.toBeVisible();
    const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
    await expect(displayValue).toBeVisible();

    // Verify crimson color was applied
    const displayText = await displayValue.textContent();
    expect(displayText?.toLowerCase()).toContain('#dc143c');
  });

  test('CINCS04: should handle named colors with extra spaces', async ({
    page,
  }) => {
    logTestStep('Testing named colors with extra whitespace');

    // Enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);
    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Test with extra spaces
    logTestStep('Entering "  red  " with extra spaces');
    await colorInput.fill('  red  ');
    await colorInput.press('Enter');

    // Should still work and switch to HEX
    await page.waitForTimeout(200);
    logTestStep('Verifying format switched to HEX');
    const activeFormatButton = page.locator(
      SELECTORS.colorSetter.activeFormatButton
    );
    await expect(activeFormatButton).toContainText('HEX');

    // Should exit edit mode
    await expect(colorInput).not.toBeVisible();

    // Verify red color was applied
    const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
    await expect(displayValue).toBeVisible();
    const displayText = await displayValue.textContent();
    expect(displayText?.toLowerCase()).toContain('#ff0000');
  });
});
