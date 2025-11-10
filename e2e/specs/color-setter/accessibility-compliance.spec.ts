import { test, expect, Page } from '@playwright/test';
import {
  SELECTORS,
  setupColorSetterTest,
  switchColorFormat,
  setColorViaInput,
  setHslSliders,
  logTestStep,
  logTestSection,
  TEST_USERS,
} from '../../utils';

/**
 * Helper function to set a hex color value using our utilities
 */
async function setHexColor(page: Page, hexValue: string) {
  await switchColorFormat(page, 'hex');
  await setColorViaInput(page, hexValue);
}

/**
 * E2E Tests: User Story 2 - Accessibility Compliance Checking
 * Goal: Display WCAG contrast ratios against white/black backgrounds with AA/AAA compliance indicators
 *
 * Tests verify:
 * - WCAG panel displays correctly
 * - Contrast ratios are calculated accurately
 * - AA/AAA indicators show correct pass/fail status
 * - Dynamic updates when color changes
 *
 * WCAG Thresholds:
 * - Normal text AA: 4.5:1
 * - Normal text AAA: 7:1
 * - Large text AA: 3:1
 * - Large text AAA: 4.5:1
 */

test.describe('User Story 2: Accessibility Compliance Checking', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Use utility to setup the complete test environment
    await setupColorSetterTest(page);

    // Set initial color to ensure consistent starting state
    await setHexColor(page, '#FF0000');
  });

  test.afterEach(async () => {
    // Navigate back to projects to reset state between tests
    await page.goto('http://localhost:4200/projects', {
      waitUntil: 'networkidle',
    });
  });

  test.describe('T033: WCAG Panel Display', () => {
    test('should display WCAG panel with contrast ratios for dark blue', async () => {
      // Change to dark blue (#00008B) - high contrast on white
      await setHexColor(page, '#00008B');

      // Verify WCAG panel is visible
      const wcagPanel = page.locator(SELECTORS.colorSetter.wcagPanel);
      await expect(wcagPanel).toBeVisible({ timeout: 10000 });

      // Verify contrast ratio value is displayed
      const contrastDisplay = page.locator(
        SELECTORS.colorSetter.wcagWhiteContrastValue
      );
      await expect(contrastDisplay).toBeVisible({ timeout: 10000 });

      // For dark blue (#00008B) on white background:
      // RGB(0, 0, 139) on RGB(255, 255, 255)
      // Expected contrast ≈ 12.63:1 (very high)
      const contrastText = await contrastDisplay.innerText();
      expect(contrastText).toMatch(/\d+\.\d+:\d+/); // Should match format like "12.63:1"

      // Verify white background contrast label is visible
      const whiteLabel = page.locator(SELECTORS.colorSetter.wcagWhiteBg);
      await expect(whiteLabel).toBeVisible({ timeout: 10000 });
    });

    test('should display both white and black background contrast ratios', async () => {
      // Set to a medium color with different contrast on white vs black
      await setHexColor(page, '#808080'); // Medium gray

      // Get both contrast values
      const whiteContrast = page.locator(
        SELECTORS.colorSetter.wcagWhiteContrastValue
      );
      const blackContrast = page.locator(
        SELECTORS.colorSetter.wcagBlackContrastValue
      );

      await expect(whiteContrast).toBeVisible({ timeout: 10000 });
      await expect(blackContrast).toBeVisible({ timeout: 10000 });

      // Both should have numeric values
      const whiteValue = await whiteContrast.innerText();
      const blackValue = await blackContrast.innerText();

      expect(whiteValue).toMatch(/\d+\.\d+:\d+/);
      expect(blackValue).toMatch(/\d+\.\d+:\d+/);

      // For medium gray, both should be close but different
      expect(whiteValue).not.toEqual(blackValue);
    });
  });

  test.describe('T034: AA/AAA Compliance Indicators', () => {
    test('should show all 4 AA/AAA thresholds with correct pass/fail status', async () => {
      // Use dark blue for high contrast
      await setHexColor(page, '#00008B'); // Verify all 4 threshold indicators are present
      const normalTextAA = page.locator(SELECTORS.colorSetter.wcagNormalAA);
      const normalTextAAA = page.locator(SELECTORS.colorSetter.wcagNormalAAA);
      const largeTextAA = page.locator(SELECTORS.colorSetter.wcagWhiteLargeAA);
      const largeTextAAA = page.locator(
        SELECTORS.colorSetter.wcagWhiteLargeAAA
      );

      await expect(normalTextAA).toBeVisible({ timeout: 10000 });
      await expect(normalTextAAA).toBeVisible({ timeout: 10000 });
      await expect(largeTextAA).toBeVisible({ timeout: 10000 });
      await expect(largeTextAAA).toBeVisible({ timeout: 10000 });

      // For dark blue on white (contrast ≈ 12.63:1), all should PASS
      // - Normal AA: 4.5:1 ✓ PASS
      // - Normal AAA: 7:1 ✓ PASS
      // - Large AA: 3:1 ✓ PASS
      // - Large AAA: 4.5:1 ✓ PASS
      await expect(normalTextAA.locator('[data-status]')).toHaveAttribute(
        'data-status',
        'pass'
      );
      await expect(normalTextAAA.locator('[data-status]')).toHaveAttribute(
        'data-status',
        'pass'
      );
      await expect(largeTextAA.locator('[data-status]')).toHaveAttribute(
        'data-status',
        'pass'
      );
      await expect(largeTextAAA.locator('[data-status]')).toHaveAttribute(
        'data-status',
        'pass'
      );
    });

    test('should correctly indicate FAIL for insufficient contrast', async () => {
      // Use light gray (#CCCCCC) - low contrast on white
      await setHexColor(page, '#CCCCCC');

      // For light gray on white (contrast ≈ 1.45:1), most should FAIL
      const normalTextAA = page.locator(SELECTORS.colorSetter.wcagNormalAA);
      const normalTextAAA = page.locator(SELECTORS.colorSetter.wcagNormalAAA);

      // Both should show FAIL for insufficient contrast
      await expect(normalTextAA.locator('[data-status]')).toHaveAttribute(
        'data-status',
        'fail',
        {
          timeout: 10000,
        }
      );
      await expect(normalTextAAA.locator('[data-status]')).toHaveAttribute(
        'data-status',
        'fail',
        {
          timeout: 10000,
        }
      );
    });

    test('should show correct threshold values (4.5:1, 7:1, 3:1, 4.5:1)', async () => {
      // Get the compliance items and check their threshold values
      const normalAAItem = page.locator(SELECTORS.colorSetter.wcagNormalAA);
      const normalAAAItem = page.locator(SELECTORS.colorSetter.wcagNormalAAA);
      const largeAAItem = page.locator(SELECTORS.colorSetter.wcagWhiteLargeAA);
      const largeAAAItem = page.locator(
        SELECTORS.colorSetter.wcagWhiteLargeAAA
      );

      // Check threshold values within each compliance item
      await expect(
        normalAAItem.locator(SELECTORS.colorSetter.wcagThresholdValue)
      ).toContainText('4.5:1');
      await expect(
        normalAAAItem.locator(SELECTORS.colorSetter.wcagThresholdValue)
      ).toContainText('7:1');
      await expect(
        largeAAItem.locator(SELECTORS.colorSetter.wcagThresholdValue)
      ).toContainText('3:1');
      await expect(
        largeAAAItem.locator(SELECTORS.colorSetter.wcagThresholdValue)
      ).toContainText('4.5:1');
    });

    test('should display indicators with visual pass/fail styling', async () => {
      // Use dark blue (#00008B) for all-pass scenario
      await setHexColor(page, '#00008B');

      const passIndicator = page.locator(SELECTORS.colorSetter.wcagNormalAA);

      // Pass indicators should have data-status="pass"
      const statusDiv = passIndicator.locator('[data-status]');
      const status = await statusDiv.getAttribute('data-status');
      expect(status).toBe('pass');
    });
  });

  test.describe('T035: Dynamic Contrast Updates', () => {
    test('should update contrast ratios when brightness changes via RGB sliders', async () => {
      // Make sure we're in RGB format
      await switchColorFormat(page, 'rgb');

      // Get the red slider
      const redSlider = page.locator(SELECTORS.colorSetter.rgbSliders.redInput);

      // Set initial value using evaluate (works with range inputs)
      await redSlider.evaluate((el: any) => {
        el.value = '255';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const initialContrast = page.locator(
        SELECTORS.colorSetter.wcagWhiteContrastValue
      );
      const initialValue = await initialContrast.innerText();

      // Decrease red brightness to 128
      await redSlider.evaluate((el: any) => {
        el.value = '128';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const updatedValue = await initialContrast.innerText();

      // Contrast should have changed
      expect(updatedValue).not.toEqual(initialValue);
    });

    test('should update contrast when switching HSL lightness', async () => {
      logTestStep('Setting initial yellow color (#FFFF00)');
      await setColorViaInput(page, '#FFFF00'); // Yellow

      // Switch to HSL format
      logTestStep('Switching to HSL format');
      await switchColorFormat(page, 'hsl');

      // Wait for HSL sliders to be visible and get initial contrast
      logTestStep('Getting initial contrast value');
      const currentContrast = page.locator(
        SELECTORS.colorSetter.wcagWhiteContrastValue
      );
      await currentContrast.waitFor({ state: 'visible', timeout: 5000 });

      const value1 = await currentContrast.innerText();
      const initialValue = parseFloat(value1);
      logTestStep(`Initial contrast: ${initialValue}`);

      // Significantly increase lightness to make it even brighter/whiter
      // This should decrease contrast with white background
      // Yellow is H=60, S=100, L=50 by default, we'll increase L to 90
      logTestStep('Updating HSL lightness to 90%');
      await setHslSliders(page, 60, 100, 90);

      // Wait for contrast calculation to update
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Extra wait for contrast calculation

      // Check that contrast changed
      logTestStep('Verifying contrast has changed');
      const value2 = await currentContrast.innerText();
      const newValue = parseFloat(value2);
      logTestStep(`New contrast: ${newValue}`);

      // The contrast should have changed (could be higher or lower depending on the color)
      expect(newValue).not.toEqual(initialValue);
    });

    test('should debounce contrast calculations (max 100ms)', async () => {
      const hexInput = page.locator(SELECTORS.colorSetter.colorInput);
      const wcagPanel = page.locator(SELECTORS.colorSetter.wcagPanel);

      // Rapid color changes - for debouncing test, use direct input method
      const startTime = Date.now();

      // Click to enter editing mode first
      const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
      await displayValue.click();
      const colorInput = page.locator(SELECTORS.colorSetter.colorInput);

      // Rapid fills without waiting
      await colorInput.fill('#FF0000');
      await page.waitForTimeout(30);
      await colorInput.fill('#00FF00');
      await page.waitForTimeout(30);
      await colorInput.fill('#0000FF');
      await page.keyboard.press('Enter');

      // Wait for debounced update
      await page.waitForTimeout(120); // Wait beyond debounce threshold
      await page.waitForLoadState('networkidle');

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should have debounced (only calculated once at end, not 3 times)
      // With 100ms debounce, should take ~150ms total (30+30+debounce)
      expect(totalTime).toBeLessThan(300);

      // Panel should still be visible with final color
      await expect(wcagPanel).toBeVisible({ timeout: 10000 });
    });

    test('should maintain AA/AAA pass/fail status during color transitions', async () => {
      const normalTextAA = page.locator(SELECTORS.colorSetter.wcagNormalAA);
      const hexInput = page.locator(SELECTORS.colorSetter.colorInput);

      // Change to failing color (light gray)
      await setHexColor(page, '#CCCCCC');

      let status = await normalTextAA
        .locator('[data-status]')
        .getAttribute('data-status');
      expect(status).toBe('fail');

      // Change to passing color (dark blue)
      await setHexColor(page, '#00008B');

      status = await normalTextAA
        .locator('[data-status]')
        .getAttribute('data-status');
      expect(status).toBe('pass');

      // Change back to failing color
      await setHexColor(page, '#CCCCCC');

      status = await normalTextAA
        .locator('[data-status]')
        .getAttribute('data-status');
      expect(status).toBe('fail');
    });
  });

  test.describe('Edge Cases & Error Handling', () => {
    test('should handle pure white (#FFFFFF) with appropriate contrast', async () => {
      await setHexColor(page, '#FFFFFF');

      const wcagPanel = page.locator(SELECTORS.colorSetter.wcagPanel);
      await expect(wcagPanel).toBeVisible({ timeout: 10000 });

      // Contrast on white background should be 1:1 (no contrast)
      const contrast = page.locator(
        SELECTORS.colorSetter.wcagWhiteContrastValue
      );
      const value = await contrast.innerText();
      expect(value).toMatch(/1\.0+:1/);
    });

    test('should handle pure black (#000000) with maximum contrast on white', async () => {
      await setHexColor(page, '#000000');

      const wcagPanel = page.locator(SELECTORS.colorSetter.wcagPanel);
      await expect(wcagPanel).toBeVisible({ timeout: 10000 });

      // Contrast on white background should be 21:1 (maximum)
      const contrast = page.locator(
        SELECTORS.colorSetter.wcagWhiteContrastValue
      );
      const value = await contrast.innerText();
      expect(value).toMatch(/21\.0+:1/);

      // All indicators should PASS
      const normalAA = page.locator(SELECTORS.colorSetter.wcagNormalAA);
      await expect(normalAA.locator('[data-status]')).toHaveAttribute(
        'data-status',
        'pass'
      );
    });
  });
});
