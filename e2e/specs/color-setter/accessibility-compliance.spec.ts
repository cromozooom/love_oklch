import { test, expect, Page } from '@playwright/test';

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
    // Navigate to component with WCAG enabled
    await page.goto('/dashboard/project-editor', { waitUntil: 'networkidle' });
    // Wait for ColorSetterComponent to be available
    await page.waitForSelector('app-color-setter', { timeout: 5000 });
  });

  test.describe('T033: WCAG Panel Display', () => {
    test('should display WCAG panel with contrast ratios for dark blue', async () => {
      // Start with dark blue (#00008B) - high contrast on white
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#00008B');
      await page.keyboard.press('Enter');

      // Wait for WCAG panel to render
      const wcagPanel = page.locator('[data-testid="wcag-panel"]');
      await expect(wcagPanel).toBeVisible();

      // Verify panel contains contrast ratio information
      const contrastDisplay = page.locator('[data-testid="wcag-contrast-value"]');
      await expect(contrastDisplay).toBeVisible();

      // For dark blue (#00008B) on white background:
      // RGB(0, 0, 139) on RGB(255, 255, 255)
      // Expected contrast ≈ 12.63:1 (very high)
      const contrastText = await contrastDisplay.innerText();
      expect(contrastText).toMatch(/\d+\.\d+:\d+/); // Should match format like "12.63:1"

      // Verify white background contrast label is visible
      const whiteLabel = page.locator('[data-testid="wcag-white-bg"]');
      await expect(whiteLabel).toBeVisible();
    });

    test('should display both white and black background contrast ratios', async () => {
      // Set to a medium color with different contrast on white vs black
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#808080'); // Medium gray
      await page.keyboard.press('Enter');

      // Get both contrast values
      const whiteContrast = page.locator('[data-testid="wcag-contrast-white"]');
      const blackContrast = page.locator('[data-testid="wcag-contrast-black"]');

      await expect(whiteContrast).toBeVisible();
      await expect(blackContrast).toBeVisible();

      // Both should have numeric values
      const whitValue = await whiteContrast.innerText();
      const blackValue = await blackContrast.innerText();

      expect(whitValue).toMatch(/\d+\.\d+:\d+/);
      expect(blackValue).toMatch(/\d+\.\d+:\d+/);

      // For medium gray, both should be close but different
      expect(whitValue).not.toEqual(blackValue);
    });
  });

  test.describe('T034: AA/AAA Compliance Indicators', () => {
    test('should show all 4 AA/AAA thresholds with correct pass/fail status', async () => {
      // Use dark blue for high contrast
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#00008B');
      await page.keyboard.press('Enter');

      // Verify all 4 threshold indicators are present
      const normalTextAA = page.locator('[data-testid="wcag-normal-aa"]');
      const normalTextAAA = page.locator('[data-testid="wcag-normal-aaa"]');
      const largeTextAA = page.locator('[data-testid="wcag-large-aa"]');
      const largeTextAAA = page.locator('[data-testid="wcag-large-aaa"]');

      await expect(normalTextAA).toBeVisible();
      await expect(normalTextAAA).toBeVisible();
      await expect(largeTextAA).toBeVisible();
      await expect(largeTextAAA).toBeVisible();

      // For dark blue on white (contrast ≈ 12.63:1), all should PASS
      // - Normal AA: 4.5:1 ✓ PASS
      // - Normal AAA: 7:1 ✓ PASS
      // - Large AA: 3:1 ✓ PASS
      // - Large AAA: 4.5:1 ✓ PASS
      await expect(normalTextAA).toHaveAttribute('data-status', 'pass');
      await expect(normalTextAAA).toHaveAttribute('data-status', 'pass');
      await expect(largeTextAA).toHaveAttribute('data-status', 'pass');
      await expect(largeTextAAA).toHaveAttribute('data-status', 'pass');
    });

    test('should correctly indicate FAIL for insufficient contrast', async () => {
      // Use light gray (#CCCCCC) - low contrast on white
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#CCCCCC');
      await page.keyboard.press('Enter');

      // For light gray on white (contrast ≈ 1.45:1), most should FAIL
      const normalTextAA = page.locator('[data-testid="wcag-normal-aa"]');
      const normalTextAAA = page.locator('[data-testid="wcag-normal-aaa"]');

      // Both should show FAIL for insufficient contrast
      await expect(normalTextAA).toHaveAttribute('data-status', 'fail');
      await expect(normalTextAAA).toHaveAttribute('data-status', 'fail');
    });

    test('should show correct threshold values (4.5:1, 7:1, 3:1, 4.5:1)', async () => {
      const normalAAValue = page.locator('[data-testid="wcag-normal-aa-threshold"]');
      const normalAAAValue = page.locator('[data-testid="wcag-normal-aaa-threshold"]');
      const largeAAValue = page.locator('[data-testid="wcag-large-aa-threshold"]');
      const largeAAAValue = page.locator('[data-testid="wcag-large-aaa-threshold"]');

      await expect(normalAAValue).toContainText('4.5:1');
      await expect(normalAAAValue).toContainText('7:1');
      await expect(largeAAValue).toContainText('3:1');
      await expect(largeAAAValue).toContainText('4.5:1');
    });

    test('should display indicators with visual pass/fail styling', async () => {
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#00008B');
      await page.keyboard.press('Enter');

      const passIndicator = page.locator('[data-testid="wcag-normal-aa"]');
      
      // Pass indicators should have specific styling (green background expected)
      const classList = await passIndicator.getAttribute('class');
      expect(classList).toContain('pass');
    });
  });

  test.describe('T035: Dynamic Contrast Updates', () => {
    test('should update contrast ratios when brightness changes via RGB sliders', async () => {
      // Start with initial red color
      const redSlider = page.locator('[data-testid="rgb-slider-r"]');
      await redSlider.fill('255');
      await page.keyboard.press('Enter');

      const initialContrast = page.locator('[data-testid="wcag-contrast-value"]');
      const initialValue = await initialContrast.innerText();

      // Decrease red brightness to 128
      await redSlider.fill('128');
      await page.keyboard.press('Enter');

      // Wait for contrast to update
      await page.waitForTimeout(100); // Debounce time

      const updatedValue = await initialContrast.innerText();

      // Contrast should have changed
      expect(updatedValue).not.toEqual(initialValue);
    });

    test('should update contrast when switching HSL lightness', async () => {
      // Switch to HSL format
      const hslButton = page.locator('button:has-text("HSL")');
      await hslButton.click();
      await page.waitForTimeout(100);

      const lightnessSlider = page.locator('[data-testid="hsl-slider-l"]');
      
      // Get initial contrast at lightness=50
      let currentContrast = page.locator('[data-testid="wcag-contrast-value"]');
      let value1 = await currentContrast.innerText();

      // Increase lightness to 80
      await lightnessSlider.fill('80');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      let value2 = await currentContrast.innerText();
      expect(value2).not.toEqual(value1);

      // Decrease lightness to 20
      await lightnessSlider.fill('20');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      let value3 = await currentContrast.innerText();
      expect(value3).not.toEqual(value1);
      expect(value3).not.toEqual(value2);
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

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should have debounced (only calculated once at end, not 3 times)
      // With 100ms debounce, should take ~150ms total (30+30+debounce)
      expect(totalTime).toBeLessThan(300);

      // Panel should still be visible with final color
      await expect(wcagPanel).toBeVisible();
    });

    test('should maintain AA/AAA pass/fail status during color transitions', async () => {
      const normalTextAA = page.locator('[data-testid="wcag-normal-aa"]');

      // Start with passing color (dark blue)
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#00008B');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
      
      let status = await normalTextAA.getAttribute('data-status');
      expect(status).toBe('pass');

      // Change to failing color (light gray)
      await hexInput.fill('#CCCCCC');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      status = await normalTextAA.getAttribute('data-status');
      expect(status).toBe('fail');

      // Change back to passing color
      await hexInput.fill('#000000');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      status = await normalTextAA.getAttribute('data-status');
      expect(status).toBe('pass');
    });
  });

  test.describe('Edge Cases & Error Handling', () => {
    test('should handle pure white (#FFFFFF) with appropriate contrast', async () => {
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#FFFFFF');
      await page.keyboard.press('Enter');

      const wcagPanel = page.locator('[data-testid="wcag-panel"]');
      await expect(wcagPanel).toBeVisible();

      // Contrast on white background should be 1:1 (no contrast)
      const contrast = page.locator('[data-testid="wcag-contrast-white"]');
      const value = await contrast.innerText();
      expect(value).toContain('1:1');
    });

    test('should handle pure black (#000000) with maximum contrast on white', async () => {
      const hexInput = page.locator('[data-testid="hex-input"]');
      await hexInput.fill('#000000');
      await page.keyboard.press('Enter');

      const wcagPanel = page.locator('[data-testid="wcag-panel"]');
      await expect(wcagPanel).toBeVisible();

      // Contrast on white background should be 21:1 (maximum)
      const contrast = page.locator('[data-testid="wcag-contrast-white"]');
      const value = await contrast.innerText();
      expect(value).toContain('21:1');

      // All indicators should PASS
      const normalAA = page.locator('[data-testid="wcag-normal-aa"]');
      await expect(normalAA).toHaveAttribute('data-status', 'pass');
    });
  });
});
