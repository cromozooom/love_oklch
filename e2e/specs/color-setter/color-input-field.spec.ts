import { test, expect } from '@playwright/test';
import {
  SELECTORS,
  setupColorSetterTest,
  setColorViaInput,
  switchColorFormat,
  logTestStep,
  logTestSection,
} from '../../utils';

/**
 * Test Suite: Color Input Field Format Detection
 *
 * Tests that the color input field can detect various color formats
 * and automatically switch to the appropriate editor mode.
 */
test.describe('CIF - Color Input Field - Format Detection and Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Use centralized setup utility
    await setupColorSetterTest(page);

    // Set initial color for consistent starting state
    await setColorViaInput(page, '#808080'); // Gray as neutral starting point
  });

  test('CIF001: should accept HEX color and switch to HEX editor', async ({
    page,
  }) => {
    logTestStep('Entering edit mode by clicking display value');
    // Click display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    logTestStep('Waiting for color input to appear');
    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Type HEX color
    logTestStep('Entering HEX color #FF5733');
    await colorInput.fill('#FF5733');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify the color was applied (check display value)
    logTestStep('Verifying color was applied and format switched to HEX');
    const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
    await expect(displayValue).toBeVisible({ timeout: 5000 });

    const displayText = await displayValue.textContent();
    expect(displayText?.toLowerCase()).toContain('#ff5733');

    // Verify format switched to HEX
    const activeFormatButton = page.locator(
      SELECTORS.colorSetter.activeFormatButton
    );
    await expect(activeFormatButton).toContainText('HEX');
  });

  test('CIF002: should accept RGB color and switch to RGB editor', async ({
    page,
  }) => {
    logTestStep('Entering edit mode by clicking display value');
    // Click display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Type RGB color
    logTestStep('Entering RGB color rgb(255, 87, 51)');
    await colorInput.fill('rgb(255, 87, 51)');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify it switched to RGB editor (look for RGB sliders)
    logTestStep('Verifying format switched to RGB');
    const activeFormatButton = page.locator(
      SELECTORS.colorSetter.activeFormatButton
    );
    await expect(activeFormatButton).toContainText('RGB');

    // Verify RGB sliders are visible
    const redSlider = page.locator(SELECTORS.colorSetter.rgbSliders.redInput);
    await expect(redSlider).toBeVisible({ timeout: 5000 });
  });

  test('CIF003: should accept HSL color and switch to HSL editor', async ({
    page,
  }) => {
    logTestStep('Entering edit mode by clicking display value');
    // Click display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Type HSL color
    logTestStep('Entering HSL color hsl(120, 100%, 50%)');
    await colorInput.fill('hsl(120, 100%, 50%)');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify it switched to HSL editor
    logTestStep('Verifying format switched to HSL');
    const activeFormatButton = page.locator(
      SELECTORS.colorSetter.activeFormatButton
    );
    await expect(activeFormatButton).toContainText('HSL');

    // Verify HSL sliders are visible
    const hueSlider = page.locator(SELECTORS.colorSetter.hslSliders.hueInput);
    await expect(hueSlider).toBeVisible({ timeout: 5000 });
  });

  test('CIF004: should accept OKLCH color and switch to OKLCH editor', async ({
    page,
  }) => {
    logTestStep('Entering edit mode by clicking display value');
    // Click display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Type OKLCH color
    logTestStep('Entering OKLCH color oklch(0.7 0.15 180)');
    await colorInput.fill('oklch(0.7 0.15 180)');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify it switched to OKLCH editor
    logTestStep('Verifying format switched to OKLCH');
    const activeFormatButton = page.locator(
      SELECTORS.colorSetter.activeFormatButton
    );
    await expect(activeFormatButton).toContainText('OKLCH');

    // Verify OKLCH sliders are visible
    const lightnessSlider = page.locator(
      SELECTORS.colorSetter.oklchSliders.lightnessInput
    );
    await expect(lightnessSlider).toBeVisible({ timeout: 5000 });
  });

  test('CIF005: should accept LCH color and switch to LCH editor', async ({
    page,
  }) => {
    logTestStep('Entering edit mode by clicking display value');
    // Click display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Type LCH color
    logTestStep('Entering LCH color lch(70 50 180)');
    await colorInput.fill('lch(70 50 180)');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify it switched to LCH editor
    logTestStep('Verifying format switched to LCH');
    const activeFormatButton = page.locator(
      SELECTORS.colorSetter.activeFormatButton
    );
    await expect(activeFormatButton).toContainText('LCH');

    // Verify LCH sliders are visible
    const lightnessSlider = page.locator(
      SELECTORS.colorSetter.lchSliders.lightnessInput
    );
    await expect(lightnessSlider).toBeVisible({ timeout: 5000 });
  });

  test('CIF006: should accept LAB color and switch to LAB editor', async ({
    page,
  }) => {
    logTestStep('Entering edit mode by clicking display value');
    // Click display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Type LAB color
    logTestStep('Entering LAB color lab(70 20 -30)');
    await colorInput.fill('lab(70 20 -30)');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify it switched to LAB editor
    logTestStep('Verifying format switched to LAB');
    const activeFormatButton = page.locator(
      SELECTORS.colorSetter.activeFormatButton
    );
    await expect(activeFormatButton).toContainText('LAB');

    // Verify LAB sliders are visible
    const lightnessSlider = page.locator(
      SELECTORS.colorSetter.labSliders.lightnessInput
    );
    await expect(lightnessSlider).toBeVisible({ timeout: 5000 });
  });

  test('CIF007: should clear invalid color input', async ({ page }) => {
    logTestStep('Entering edit mode by clicking display value');
    // Click display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Type invalid color
    logTestStep('Entering invalid color "invalid-color-123"');
    await colorInput.fill('invalid-color-123');
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // Verify error is shown and input stays in edit mode for invalid color
    logTestStep('Verifying error handling for invalid color');
    const errorMessage = page.locator(SELECTORS.colorSetter.colorInputError);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Input should still be visible in error state
    await expect(colorInput).toBeVisible();
  });

  test('CIF008: should handle blur event same as enter key', async ({
    page,
  }) => {
    logTestStep('Entering edit mode by clicking display value');
    // Click display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Type HEX color and blur (click away)
    logTestStep('Entering HEX color #00FF00 and blurring');
    await colorInput.fill('#00FF00');
    await colorInput.blur();

    await page.waitForTimeout(300);

    // Verify it processed the color - check display value instead of color canvas
    logTestStep('Verifying color was processed via blur');
    const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
    await expect(displayValue).toBeVisible({ timeout: 5000 });

    const displayText = await displayValue.textContent();
    expect(displayText?.toLowerCase()).toContain('#00ff00');

    // Verify format switched to HEX
    const activeFormatButton = page.locator(
      SELECTORS.colorSetter.activeFormatButton
    );
    await expect(activeFormatButton).toContainText('HEX');
  });

  test('CIF009: should preserve existing color when input is empty', async ({
    page,
  }) => {
    const displayValue = page.locator(SELECTORS.colorSetter.displayValue);

    // Get initial color
    logTestStep('Getting initial color value');
    const initialColor = await displayValue.textContent();

    logTestStep('Entering edit mode by clicking display value');
    // Click display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Enter empty input and press enter
    logTestStep('Entering empty/whitespace input');
    await colorInput.fill('   '); // whitespace only
    await colorInput.press('Enter');

    await page.waitForTimeout(300);

    // For empty input, the system might stay in edit mode or show an error
    // Let's check what actually happens and adjust accordingly
    logTestStep('Checking behavior for empty input');

    // Option 1: Check if it stays in edit mode (input still visible)
    const isInputStillVisible = await colorInput.isVisible();

    if (isInputStillVisible) {
      // If input is still visible, cancel by clicking outside or pressing Escape
      logTestStep('Input still visible, canceling edit mode');
      await page.click(SELECTORS.colorSetter.component);
      await expect(displayValue).toBeVisible({ timeout: 5000 });
    } else {
      // If input disappeared, display should be visible
      await expect(displayValue).toBeVisible({ timeout: 5000 });
    }

    // Verify color remained unchanged
    const currentColor = await displayValue.textContent();
    expect(currentColor).toBe(initialColor);
  });
});
