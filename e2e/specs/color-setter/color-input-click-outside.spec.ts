import { test, expect } from '@playwright/test';
import {
  SELECTORS,
  setupColorSetterTest,
  setColorViaInput,
  logTestStep,
  logTestSection,
} from '../../utils';

/**
 * Test Suite: Color Input Click Outside Behavior
 *
 * Tests the click-outside-to-cancel functionality of the color input field.
 * This ensures users can easily cancel editing by clicking outside the input.
 */
test.describe('Color Input - Click Outside to Cancel', () => {
  test.beforeEach(async ({ page }) => {
    // Use centralized setup utility
    await setupColorSetterTest(page);

    // Set initial color for consistent starting state
    await setColorViaInput(page, '#FF0000');
  });

  test('CICO01 -  should cancel editing mode when clicking outside with empty input', async ({
    page,
  }) => {
    logTestStep('Entering edit mode by clicking display value');
    // Click on display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    // Wait for input field to appear
    logTestStep('Waiting for color input to appear');
    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Click outside the input (on the component container)
    logTestStep('Clicking outside to cancel editing');
    await page.click(SELECTORS.colorSetter.component);

    // Should return to display value
    logTestStep('Verifying return to display mode');
    await expect(colorInput).not.toBeVisible();
    await expect(
      page.locator(SELECTORS.colorSetter.displayValue)
    ).toBeVisible();

    // No error should be shown
    await expect(
      page.locator(SELECTORS.colorSetter.colorInputError)
    ).not.toBeVisible();
  });

  test('CICO02 - should cancel editing mode when clicking outside with invalid input', async ({
    page,
  }) => {
    logTestStep('Entering edit mode');
    // Click on display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Enter invalid color but don't press Enter
    logTestStep('Entering invalid color value');
    await colorInput.fill('invalidcolor123');

    // Click outside the input
    logTestStep('Clicking outside to cancel');
    await page.click(SELECTORS.colorSetter.component);

    // Should return to display value (canceling invalid input)
    logTestStep('Verifying return to display mode');
    await expect(colorInput).not.toBeVisible();
    await expect(
      page.locator(SELECTORS.colorSetter.displayValue)
    ).toBeVisible();

    // No error should be shown since we canceled
    await expect(
      page.locator(SELECTORS.colorSetter.colorInputError)
    ).not.toBeVisible();
  });

  test('CICO03 - should parse and update color when clicking outside with valid input', async ({
    page,
  }) => {
    logTestStep('Storing initial color value');
    // Store initial color value
    const initialDisplayValue = await page
      .locator(SELECTORS.colorSetter.displayValue)
      .textContent();

    logTestStep('Entering edit mode');
    // Click on display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Enter valid color (use blue instead of red to ensure it's different from initial #FF0000)
    logTestStep('Entering valid color "blue"');
    await colorInput.fill('blue');

    // Click outside the input
    logTestStep('Clicking outside to apply color change');
    await page.click(SELECTORS.colorSetter.component);

    // Should return to display value with updated color
    logTestStep('Verifying color was updated');
    await expect(colorInput).not.toBeVisible();
    await expect(
      page.locator(SELECTORS.colorSetter.displayValue)
    ).toBeVisible();

    // Display value should be different (updated)
    const newDisplayValue = await page
      .locator(SELECTORS.colorSetter.displayValue)
      .textContent();
    expect(newDisplayValue).not.toBe(initialDisplayValue);

    // Should switch to HEX format
    const activeFormatButton = page.locator(
      SELECTORS.colorSetter.activeFormatButton
    );
    await expect(activeFormatButton).toContainText('HEX');
  });

  test('CICO04 - should work with Escape key as alternative to clicking outside', async ({
    page,
  }) => {
    logTestStep('Entering edit mode');
    // Click on display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Enter some text
    logTestStep('Entering invalid input');
    await colorInput.fill('some invalid input');

    // Press Escape key
    logTestStep('Pressing Escape key to cancel');
    await colorInput.press('Escape');

    // Should return to display value
    logTestStep('Verifying return to display mode');
    await expect(colorInput).not.toBeVisible();
    await expect(
      page.locator(SELECTORS.colorSetter.displayValue)
    ).toBeVisible();

    // No error should be shown
    await expect(
      page.locator(SELECTORS.colorSetter.colorInputError)
    ).not.toBeVisible();
  });

  test('CICO05 - should maintain Enter key functionality for immediate parsing', async ({
    page,
  }) => {
    logTestStep('Entering edit mode');
    // Click on display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Enter invalid color and press Enter (should show error and stay in edit mode)
    logTestStep('Entering invalid color and pressing Enter');
    await colorInput.fill('invalidcolor123');
    await colorInput.press('Enter');

    // Should still be in edit mode with error
    logTestStep('Verifying error state is shown');
    await expect(colorInput).toBeVisible();
    await expect(
      page.locator(SELECTORS.colorSetter.colorInputError)
    ).toBeVisible({ timeout: 5000 });

    // Error should contain helpful message
    const errorMessage = page.locator(SELECTORS.colorSetter.colorInputError);
    await expect(errorMessage).toContainText('Cannot parse color');

    // Input border should be red
    await expect(colorInput).toHaveClass(/border-red-500/);
  });

  test('CICO06 - should clear input and errors when starting fresh edit session', async ({
    page,
  }) => {
    logTestStep('Entering edit mode');
    // Click on display value to enter edit mode
    await page.click(SELECTORS.colorSetter.displayValue);

    const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
    await expect(colorInput).toBeVisible({ timeout: 5000 });

    // Enter invalid color and press Enter to trigger error
    logTestStep('Entering invalid color to trigger error');
    await colorInput.fill('invalidcolor');
    await colorInput.press('Enter');

    // Verify error is shown
    logTestStep('Verifying error is displayed');
    await expect(
      page.locator(SELECTORS.colorSetter.colorInputError)
    ).toBeVisible({ timeout: 5000 });

    // Cancel by clicking outside
    logTestStep('Canceling by clicking outside');
    await page.click(SELECTORS.colorSetter.component);

    // Click display value again to start fresh
    logTestStep('Starting fresh edit session');
    await page.click(SELECTORS.colorSetter.displayValue);

    // Input should be empty and no error should be shown
    logTestStep('Verifying clean state');
    await expect(colorInput).toHaveValue('');
    await expect(
      page.locator(SELECTORS.colorSetter.colorInputError)
    ).not.toBeVisible();
    await expect(colorInput).not.toHaveClass(/border-red-500/);
  });
});
