import { test, expect, Page } from '@playwright/test';
import {
  SELECTORS,
  setupColorSetterTest,
  switchColorFormat,
  setColorViaInput,
  setHslSliders,
  setRgbSliders,
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
    test('T033-01 should display WCAG panel with contrast ratios for dark blue', async () => {
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

    test('T033-02 should display both white and black background contrast ratios', async () => {
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
    test('T034-01 should show all 4 AA/AAA thresholds with correct pass/fail status', async () => {
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

    test('T034-02 should correctly indicate FAIL for insufficient contrast', async () => {
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

    test('T034-03 should show correct threshold values (4.5:1, 7:1, 3:1, 4.5:1)', async () => {
      // Use same color as T034-01 to ensure WCAG analysis is triggered
      await setHexColor(page, '#00008B');

      // Get the compliance items and check their threshold values (same strategy as T034-01)
      const normalAAItem = page.locator(SELECTORS.colorSetter.wcagNormalAA);
      const normalAAAItem = page.locator(SELECTORS.colorSetter.wcagNormalAAA);
      const largeAAItem = page.locator(SELECTORS.colorSetter.wcagWhiteLargeAA);
      const largeAAAItem = page.locator(
        SELECTORS.colorSetter.wcagWhiteLargeAAA
      );

      // Wait for each compliance item to be visible before checking threshold values
      await expect(normalAAItem).toBeVisible({ timeout: 10000 });
      await expect(normalAAAItem).toBeVisible({ timeout: 10000 });
      await expect(largeAAItem).toBeVisible({ timeout: 10000 });
      await expect(largeAAAItem).toBeVisible({ timeout: 10000 });

      // Check threshold values within each compliance item with explicit timeouts
      await expect(
        normalAAItem.locator(SELECTORS.colorSetter.wcagThresholdValue)
      ).toContainText('4.5:1', { timeout: 10000 });
      await expect(
        normalAAAItem.locator(SELECTORS.colorSetter.wcagThresholdValue)
      ).toContainText('7:1', { timeout: 10000 });
      await expect(
        largeAAItem.locator(SELECTORS.colorSetter.wcagThresholdValue)
      ).toContainText('3:1', { timeout: 10000 });
      await expect(
        largeAAAItem.locator(SELECTORS.colorSetter.wcagThresholdValue)
      ).toContainText('4.5:1', { timeout: 10000 });
    });

    test('T034-04 should display indicators with visual pass/fail styling', async () => {
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
    test('T035-01 should update contrast ratios when brightness changes via RGB sliders', async () => {
      // Start by setting a color via HEX to ensure WCAG analysis is active (same pattern as working tests)
      await setHexColor(page, '#FF0000'); // Pure red (255, 0, 0)

      // Wait for WCAG analysis to be available
      const initialContrast = page.locator(
        SELECTORS.colorSetter.wcagWhiteContrastValue
      );
      await initialContrast.waitFor({ state: 'visible', timeout: 10000 });
      const initialValue = await initialContrast.innerText();

      // Now switch to RGB and change only the red value to 128 (keeping green=0, blue=0)
      await setRgbSliders(page, 128, 0, 0);

      // Wait for contrast calculation to update
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Extra wait for contrast calculation

      const updatedValue = await initialContrast.innerText();

      // Contrast should have changed (darker red should have different contrast)
      expect(updatedValue).not.toEqual(initialValue);
    });

    test('T035-02 should update contrast when switching HSL lightness', async () => {
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

    test('T035-03 should update contrast calculations reactively during rapid changes', async () => {
      // First ensure WCAG analysis is active with initial red color
      await setHexColor(page, '#FF0000');

      // Wait for initial WCAG analysis to be available
      const wcagContrast = page.locator(
        SELECTORS.colorSetter.wcagWhiteContrastValue
      );
      await wcagContrast.waitFor({ state: 'visible', timeout: 10000 });
      const initialContrast = await wcagContrast.innerText();

      // Perform rapid color changes using utility functions to test reactive updates
      // This tests that WCAG analysis updates properly during frequent changes
      await setHexColor(page, '#00FF00'); // Green
      await page.waitForTimeout(50); // Small wait between changes

      // Verify WCAG analysis updated to green
      const greenContrast = await wcagContrast.innerText();
      expect(greenContrast).not.toEqual(initialContrast);
      expect(greenContrast).toMatch(/\d+\.\d+:\d+/);

      // Change to blue
      await setHexColor(page, '#0000FF'); // Blue
      await page.waitForTimeout(50);

      // Verify WCAG analysis updated to blue
      const blueContrast = await wcagContrast.innerText();
      expect(blueContrast).not.toEqual(greenContrast);
      expect(blueContrast).toMatch(/\d+\.\d+:\d+/);

      // Verify WCAG panel elements are still functional after rapid changes
      const normalAAItem = page.locator(SELECTORS.colorSetter.wcagNormalAA);
      await expect(normalAAItem).toBeVisible({ timeout: 5000 });

      // Verify the final state shows compliance indicators for blue color
      const complianceStatus = await normalAAItem
        .locator('[data-status]')
        .getAttribute('data-status');
      expect(complianceStatus).toMatch(/pass|fail/);
    });

    test('T035-04 should maintain AA/AAA pass/fail status during color transitions', async () => {
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
    test('T036-01 should handle pure white (#FFFFFF) with appropriate contrast', async () => {
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

    test('T036-02 should handle pure black (#000000) with maximum contrast on white', async () => {
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
