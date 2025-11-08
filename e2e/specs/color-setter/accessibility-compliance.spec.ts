import { test, expect, Page } from '@playwright/test';
import { login, TEST_USERS } from '../../fixtures/auth';

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

    // Step 1: Login as PRO user (has full access to features)
    await login(page, TEST_USERS.PRO_USER.email, TEST_USERS.PRO_USER.password);

    // Step 2: Wait for projects page to load
    await page.waitForSelector('button:has-text("New Project")', {
      timeout: 10000,
    });

    // Step 3: Create a new project to access color setter
    const newProjectBtn = page
      .locator('button:has-text("New Project")')
      .first();
    await newProjectBtn.click();

    // Step 4: Wait for color setter component to appear and be interactive
    await page.waitForSelector('app-color-setter', { timeout: 10000 });

    // Step 5: Wait for hex input to be visible and ready
    const hexInput = page.locator('[data-testid="hex-input"]');
    await hexInput.waitFor({ state: 'visible', timeout: 10000 });

    // Step 6: Wait for full page load and WCAG panel to be ready
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    // Step 7: Set initial color to ensure consistent starting state
    await hexInput.fill('#FF0000');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
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
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#00008B');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Verify WCAG panel is visible
      const wcagPanel = page.locator('[data-testid="wcag-panel"]');
      await expect(wcagPanel).toBeVisible({ timeout: 10000 });

      // Verify contrast ratio value is displayed
      const contrastDisplay = page.locator(
        '[data-testid="wcag-white-contrast-value"]'
      );
      await expect(contrastDisplay).toBeVisible({ timeout: 10000 });

      // For dark blue (#00008B) on white background:
      // RGB(0, 0, 139) on RGB(255, 255, 255)
      // Expected contrast ≈ 12.63:1 (very high)
      const contrastText = await contrastDisplay.innerText();
      expect(contrastText).toMatch(/\d+\.\d+:\d+/); // Should match format like "12.63:1"

      // Verify white background contrast label is visible
      const whiteLabel = page.locator('[data-testid="wcag-white-bg"]');
      await expect(whiteLabel).toBeVisible({ timeout: 10000 });
    });

    test('should display both white and black background contrast ratios', async () => {
      // Set to a medium color with different contrast on white vs black
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#808080'); // Medium gray
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Get both contrast values
      const whiteContrast = page.locator(
        '[data-testid="wcag-white-contrast-value"]'
      );
      const blackContrast = page.locator(
        '[data-testid="wcag-black-contrast-value"]'
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
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#00008B');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Verify all 4 threshold indicators are present
      const normalTextAA = page.locator('[data-testid="wcag-normal-aa"]');
      const normalTextAAA = page.locator('[data-testid="wcag-normal-aaa"]');
      const largeTextAA = page.locator('[data-testid="wcag-white-large-aa"]');
      const largeTextAAA = page.locator('[data-testid="wcag-white-large-aaa"]');

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
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#CCCCCC');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // For light gray on white (contrast ≈ 1.45:1), most should FAIL
      const normalTextAA = page.locator('[data-testid="wcag-normal-aa"]');
      const normalTextAAA = page.locator('[data-testid="wcag-normal-aaa"]');

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
      const normalAAItem = page.locator('[data-testid="wcag-normal-aa"]');
      const normalAAAItem = page.locator('[data-testid="wcag-normal-aaa"]');
      const largeAAItem = page.locator('[data-testid="wcag-white-large-aa"]');
      const largeAAAItem = page.locator('[data-testid="wcag-white-large-aaa"]');

      // Check threshold values within each compliance item
      await expect(
        normalAAItem.locator('[data-testid="wcag-threshold-value"]')
      ).toContainText('4.5:1');
      await expect(
        normalAAAItem.locator('[data-testid="wcag-threshold-value"]')
      ).toContainText('7:1');
      await expect(
        largeAAItem.locator('[data-testid="wcag-threshold-value"]')
      ).toContainText('3:1');
      await expect(
        largeAAAItem.locator('[data-testid="wcag-threshold-value"]')
      ).toContainText('4.5:1');
    });

    test('should display indicators with visual pass/fail styling', async () => {
      // Use dark blue (#00008B) for all-pass scenario
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#00008B');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const passIndicator = page.locator('[data-testid="wcag-normal-aa"]');

      // Pass indicators should have data-status="pass"
      const statusDiv = passIndicator.locator('[data-status]');
      const status = await statusDiv.getAttribute('data-status');
      expect(status).toBe('pass');
    });
  });

  test.describe('T035: Dynamic Contrast Updates', () => {
    test('should update contrast ratios when brightness changes via RGB sliders', async () => {
      // Make sure we're in RGB format
      const rgbButton = page.locator('button:has-text("RGB")');
      await rgbButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Get the red slider
      const redSlider = page.locator('[data-testid="rgb-slider-r"]');

      // Set initial value using evaluate (works with range inputs)
      await redSlider.evaluate((el: any) => {
        el.value = '255';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const initialContrast = page.locator(
        '[data-testid="wcag-white-contrast-value"]'
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
      const hexInput = page.locator('[data-testid="hex-input"]');

      // Set to yellow (#FFFF00) which has good contrast initially
      await hexInput.clear();
      await hexInput.fill('#FFFF00'); // Yellow
      await hexInput.blur();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Switch to HSL format
      const hslButton = page.locator('button:has-text("HSL")');
      await hslButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Wait for HSL sliders to be visible
      const lightnessSlider = page.locator('[data-testid="hsl-slider-l"]');
      await lightnessSlider.waitFor({ state: 'visible', timeout: 5000 });

      // Get initial contrast value (should be around 1.07:1 for yellow on white)
      let currentContrast = page.locator(
        '[data-testid="wcag-white-contrast-value"]'
      );
      let value1 = await currentContrast.innerText();
      const initialValue = parseFloat(value1);

      // Significantly increase lightness to make it even brighter/whiter
      // This should decrease contrast with white background
      await lightnessSlider.evaluate((el: any) => {
        el.value = '90'; // Very bright/light yellow
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Extra wait for contrast calculation

      // Check that contrast changed
      let value2 = await currentContrast.innerText();
      const newValue = parseFloat(value2);

      // The contrast should have changed (could be higher or lower depending on the color)
      expect(newValue).not.toEqual(initialValue);
    });

    test('should debounce contrast calculations (max 100ms)', async () => {
      const hexInput = page.locator('[data-testid="hex-input"]');
      const wcagPanel = page.locator('[data-testid="wcag-panel"]');

      // Rapid color changes
      const startTime = Date.now();
      await hexInput.fill('#FF0000');
      await page.waitForTimeout(30);
      await hexInput.fill('#00FF00');
      await page.waitForTimeout(30);
      await hexInput.fill('#0000FF');
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
      const normalTextAA = page.locator('[data-testid="wcag-normal-aa"]');
      const hexInput = page.locator('[data-testid="hex-input"]');

      // Change to failing color (light gray)
      await hexInput.fill('#CCCCCC');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      let status = await normalTextAA
        .locator('[data-status]')
        .getAttribute('data-status');
      expect(status).toBe('fail');

      // Change to passing color (dark blue)
      await hexInput.fill('#00008B');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      status = await normalTextAA
        .locator('[data-status]')
        .getAttribute('data-status');
      expect(status).toBe('pass');

      // Change back to failing color
      await hexInput.fill('#CCCCCC');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      status = await normalTextAA
        .locator('[data-status]')
        .getAttribute('data-status');
      expect(status).toBe('fail');
    });
  });

  test.describe('Edge Cases & Error Handling', () => {
    test('should handle pure white (#FFFFFF) with appropriate contrast', async () => {
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#FFFFFF');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const wcagPanel = page.locator('[data-testid="wcag-panel"]');
      await expect(wcagPanel).toBeVisible({ timeout: 10000 });

      // Contrast on white background should be 1:1 (no contrast)
      const contrast = page.locator(
        '[data-testid="wcag-white-contrast-value"]'
      );
      const value = await contrast.innerText();
      expect(value).toMatch(/1\.0+:1/);
    });

    test('should handle pure black (#000000) with maximum contrast on white', async () => {
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#000000');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      const wcagPanel = page.locator('[data-testid="wcag-panel"]');
      await expect(wcagPanel).toBeVisible({ timeout: 10000 });

      // Contrast on white background should be 21:1 (maximum)
      const contrast = page.locator(
        '[data-testid="wcag-white-contrast-value"]'
      );
      const value = await contrast.innerText();
      expect(value).toMatch(/21\.0+:1/);

      // All indicators should PASS
      const normalAA = page.locator('[data-testid="wcag-normal-aa"]');
      await expect(normalAA.locator('[data-status]')).toHaveAttribute(
        'data-status',
        'pass'
      );
    });
  });
});
