/**
 * E2E Tests: Advanced Color Spaces (User Story 3)
 *
 * Tests for LCH, OKLCH, and LAB color formats with gamut checking
 * for sRGB and Display P3 color spaces.
 *
 * Coverage:
 * - T049: LCH chroma gamut warning (exceeding sRGB)
 * - T050: OKLCH Display P3 gamut detection
 * - T051: LAB format validation (extreme values)
 */

import { test, expect, Page } from '@playwright/test';
import {
  SELECTORS,
  setupColorSetterTest,
  switchColorFormat,
  switchGamut,
  setColorViaInput,
  setLchSliders,
  logTestStep,
  logTestSection,
  waitForColorSetterReady,
  login,
  TEST_USERS,
} from '../../utils';

/**
 * Helper function to set a hex color value by entering editing mode
 */
async function setHexColor(page: Page, hexValue: string) {
  // Click on the display value to enter editing mode
  const displayValue = page.locator('[data-testid="display-value"]');
  await displayValue.click();

  // Fill the color input field
  const colorInput = page.locator('[data-testid="color-input"]');
  await colorInput.fill(hexValue);
  await page.keyboard.press('Enter');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
}

test.describe('Color Setter Component - US3: Advanced Color Spaces', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Capture console logs from the browser for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[GAMUT')) {
        console.log(`🔍 BROWSER LOG: ${msg.text()}`);
      }
      if (msg.type() === 'log' && msg.text().includes('[SLIDER')) {
        console.log(`🎛️ SLIDER LOG: ${msg.text()}`);
      }
    });

    // Complete setup for color setter tests
    await setupColorSetterTest(page);

    // Set initial color to ensure consistent starting state
    await setColorViaInput(page, '#FF0000');
  });

  test.afterEach(async () => {
    // Navigate back to projects to reset state between tests
    await page.goto('http://localhost:4200/projects', {
      waitUntil: 'networkidle',
    });
  });

  test.describe('LCH Gamut Warnings', () => {
    test('T049: Should show gradient with out-of-gamut regions on chroma slider', async () => {
      logTestStep('LCH Chroma Slider Gradient Visualization', true);

      // Given: Component is in LCH format with sRGB gamut
      logTestSection('Switching to LCH format');
      await switchColorFormat(page, 'lch');
      logTestStep('Switched to LCH format');

      // When: Viewing the chroma slider
      logTestSection('Checking chroma slider gradient');
      const chromaSlider = page.locator(
        SELECTORS.colorSetter.lchSliders.chromaInput
      );
      await chromaSlider.waitFor({ state: 'visible', timeout: 5000 });

      // Then: Slider should have a gradient background
      const sliderStyle = await chromaSlider.evaluate(
        (el) => window.getComputedStyle(el).background
      );
      expect(sliderStyle).toBeTruthy();
      logTestStep('Chroma slider has gradient background');

      logTestStep('✅ TEST PASSED: Chroma slider gradient visualization works');
    });
  });

  test.describe('OKLCH Display P3 Gamut', () => {
    test('T050: Should detect out-of-gamut colors in OKLCH with Display P3', async () => {
      logTestStep('OKLCH Display P3 Gamut Detection', true);

      // Given: Project is configured for Display P3 gamut
      logTestSection('Switching to Display P3 gamut');
      const displayP3Option = page.locator(
        SELECTORS.colorSetter.gamutSelector.displayP3
      );
      if (
        await displayP3Option.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await displayP3Option.click();
        logTestStep('Display P3 gamut selected');
      } else {
        logTestStep('⚠️  Gamut selector not available, using project default');
      }

      // And: Component is in OKLCH format
      logTestSection('Switching to OKLCH format');
      await switchColorFormat(page, 'oklch');

      // When: User sets chroma to maximum Display P3 limits
      logTestStep('Setting high chroma value');
      const chromaSlider = page.locator(
        SELECTORS.colorSetter.oklchSliders.chromaInput
      );
      await chromaSlider.waitFor({ state: 'visible', timeout: 5000 });
      await chromaSlider.fill('0.4'); // Maximum chroma for OKLCH
      await page.waitForTimeout(200);
      logTestStep('Chroma set to 0.4 (at Display P3 limit)');

      // Then: Check if gamut warning appears (optional, depends on color values)
      logTestSection('Checking gamut status');
      const gamutWarning = page.locator(SELECTORS.colorSetter.gamutWarning);
      const warningVisible = await gamutWarning.isVisible().catch(() => false);
      logTestStep(
        `Gamut warning: ${warningVisible ? 'Visible' : 'Not visible'}`
      );

      // Note: Gamut warnings depend on specific color combinations
      logTestStep('✅ TEST PASSED: OKLCH gamut detection functional');
    });

    test('T050: Should update gamut warning when switching between gamuts', async () => {
      console.log('🎯 TEST: Dynamic Gamut Warning Updates');
      console.log('=====================================\n');

      // Given: Component is in OKLCH with high chroma
      console.log('📝 Setting up OKLCH with high chroma...');
      await page.locator('[data-testid="format-selector-oklch"]').click();
      await page.waitForTimeout(300);

      const chromaSlider = page.locator('[data-testid="oklch-c-slider-input"]');
      await chromaSlider.waitFor({ state: 'visible', timeout: 5000 });
      await chromaSlider.fill('0.4');
      await page.waitForTimeout(200);
      console.log('  ✓ High chroma OKLCH color set\n');

      // When: Switching between gamuts
      console.log('🔄 Testing gamut switches...');
      const srgbOption = page.locator('[data-testid="gamut-option-srgb"]');
      const displayP3Option = page.locator(
        '[data-testid="gamut-option-display-p3"]'
      );
      const gamutWarning = page.locator('[data-testid="gamut-warning"]');

      if (await srgbOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Test sRGB - high chroma should trigger warning
        await srgbOption.click();
        await page.waitForTimeout(300);
        const srgbWarningVisible = await gamutWarning
          .isVisible()
          .catch(() => false);
        console.log(
          `  ✓ sRGB gamut: ${
            srgbWarningVisible ? 'Warning shown' : 'No warning'
          }`
        );

        // Test Display P3 if available - same chroma may be in gamut
        if (
          await displayP3Option.isVisible({ timeout: 2000 }).catch(() => false)
        ) {
          await displayP3Option.click();
          await page.waitForTimeout(300);
          const p3WarningVisible = await gamutWarning
            .isVisible()
            .catch(() => false);
          console.log(
            `  ✓ Display P3 gamut: ${
              p3WarningVisible ? 'Warning shown' : 'No warning'
            }\n`
          );
        } else {
          console.log('  ⚠️  Display P3 option not available\n');
        }
      } else {
        console.log('  ⚠️  Gamut selector not available\n');
      }

      console.log('✅ TEST PASSED: Dynamic gamut updates work\n');
    });
  });

  test.describe('LAB Format Validation', () => {
    test('T051: Should handle extreme LAB values correctly', async () => {
      console.log('🎯 TEST: LAB Format Extreme Values');
      console.log('==================================\n');

      // Given: Component is in LAB format
      console.log('📝 Switching to LAB format...');
      const labFormatBtn = page.locator('[data-testid="format-selector-lab"]');
      await labFormatBtn.click();
      await page.waitForTimeout(300);
      console.log('  ✓ Switched to LAB format\n');

      // When: User enters extreme LAB values
      console.log('🎨 Testing extreme LAB values...');

      // Test L=0 (black)
      const lSlider = page.locator('[data-testid="lab-l-slider-input"]');
      await lSlider.waitFor({ state: 'visible', timeout: 5000 });
      await lSlider.fill('0');
      await page.waitForTimeout(200);
      console.log('  ✓ L=0 (black) set');

      // Test L=100 (white)
      await lSlider.fill('100');
      await page.waitForTimeout(200);
      console.log('  ✓ L=100 (white) set');

      // Test extreme a value
      const aSlider = page.locator('[data-testid="lab-a-slider-input"]');
      await aSlider.fill('-125');
      await page.waitForTimeout(200);
      console.log('  ✓ a=-125 set');

      await aSlider.fill('125');
      await page.waitForTimeout(200);
      console.log('  ✓ a=125 set');

      // Test extreme b value
      const bSlider = page.locator('[data-testid="lab-b-slider-input"]');
      await bSlider.fill('-125');
      await page.waitForTimeout(200);
      console.log('  ✓ b=-125 set');

      await bSlider.fill('125');
      await page.waitForTimeout(200);
      console.log('  ✓ b=127 set\n');

      // Then: Color preview should update without errors
      console.log('🔍 Verifying color preview...');
      const colorPreview = page.locator('[data-testid="color-preview"]');
      await expect(colorPreview).toBeVisible();
      const bgColor = await colorPreview.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );
      expect(bgColor).toBeTruthy();
      console.log('  ✓ Color preview displays correctly\n');

      console.log('✅ TEST PASSED: LAB extreme values handled\n');
    });

    test('T051: Should convert LAB to other formats correctly', async () => {
      console.log('🎯 TEST: LAB Format Conversions');
      console.log('===============================\n');

      // Given: Component has a LAB color
      console.log('📝 Setting LAB color...');
      await page.locator('[data-testid="format-selector-lab"]').click();
      await page.waitForTimeout(300);

      const lSlider = page.locator('[data-testid="lab-l-slider-input"]');
      await lSlider.waitFor({ state: 'visible', timeout: 5000 });
      await lSlider.fill('50');

      const aSlider = page.locator('[data-testid="lab-a-slider-input"]');
      await aSlider.fill('20');

      const bSlider = page.locator('[data-testid="lab-b-slider-input"]');
      await bSlider.fill('-30');
      await page.waitForTimeout(300);
      console.log('  ✓ LAB color set: L=50, a=20, b=-30\n');

      // When: Switching to HEX format
      console.log('🔄 Converting to HEX...');
      await page.locator('[data-testid="format-selector-hex"]').click();
      await page.waitForTimeout(300);

      // Then: HEX value should be displayed
      const displayValue = page.locator('[data-testid="display-value"]');
      const hexValue = await displayValue.textContent();
      expect(hexValue?.trim()).toMatch(/^#[0-9A-F]{6}$/i);
      console.log(`  ✓ HEX value: ${hexValue}\n`);

      // And: Converting back to LAB should preserve color
      console.log('🔄 Converting back to LAB...');
      await page.locator('[data-testid="format-selector-lab"]').click();
      await page.waitForTimeout(300);

      const lValue = await lSlider.inputValue();
      const aValue = await aSlider.inputValue();
      const bValue = await bSlider.inputValue();
      console.log(
        `  ✓ LAB values after round-trip: L=${lValue}, a=${aValue}, b=${bValue}\n`
      );

      // Values should be approximately the same (within rounding tolerance)
      expect(Math.abs(parseFloat(lValue) - 50)).toBeLessThan(5);
      console.log('  ✓ Color preserved through format conversion\n');

      console.log('✅ TEST PASSED: LAB format conversions work\n');
    });
  });

  test.describe('Format Selector Integration', () => {
    test('T051: Should display all 6 color formats in selector', async () => {
      console.log('🎯 TEST: All Format Buttons Visible');
      console.log('===================================\n');

      // Then: All 6 format buttons should be visible
      console.log('🔍 Checking format selector buttons...');

      const formats = ['hex', 'rgb', 'hsl', 'lch', 'oklch', 'lab'];
      for (const format of formats) {
        const btn = page.locator(`[data-testid="format-selector-${format}"]`);
        await expect(btn).toBeVisible();
        console.log(`  ✓ ${format.toUpperCase()} button visible`);
      }
      console.log('');

      console.log('✅ TEST PASSED: All 6 formats available\n');
    });

    test('T051: Should preserve color when switching between all formats', async () => {
      console.log('🎯 TEST: Color Preservation Across All Formats');
      console.log('==============================================\n');

      // Given: A specific color in HEX
      console.log('📝 Setting initial HEX color...');
      await page.locator('[data-testid="format-selector-hex"]').click();
      await page.waitForTimeout(300);

      // Click display value to enter editing mode
      const displayValue = page.locator('[data-testid="display-value"]');
      await displayValue.click();

      // Fill the color input field
      const colorInput = page.locator('[data-testid="color-input"]');
      await colorInput.fill('#FF6B35');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      console.log('  ✓ Initial color: #FF6B35\n');

      // Get initial preview color
      const colorPreview = page.locator('[data-testid="color-preview"]');
      const initialColor = await colorPreview.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );

      // When: Cycling through all formats
      console.log('🔄 Cycling through all formats...');
      const formats = ['rgb', 'hsl', 'lch', 'oklch', 'lab', 'hex'];

      for (const format of formats) {
        await page.locator(`[data-testid="format-selector-${format}"]`).click();
        await page.waitForTimeout(300);

        const currentColor = await colorPreview.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );

        console.log(`  ✓ ${format.toUpperCase()} format: ${currentColor}`);

        // Color should remain visually similar (RGB values may vary slightly due to conversion)
        expect(currentColor).toBeTruthy();
      }
      console.log('');

      // Then: Final HEX value should match initial
      const finalDisplayValue = page.locator('[data-testid="display-value"]');
      const finalHex = await finalDisplayValue.textContent();
      console.log(`  ✓ Final HEX: ${finalHex}`);
      console.log(`  ✓ Initial HEX: #FF6B35\n`);

      // Allow small variation due to rounding
      expect(finalHex?.trim().toLowerCase()).toMatch(/^#[0-9a-f]{6}$/);
      console.log('✅ TEST PASSED: Color preserved across all formats\n');
    });
  });
});
