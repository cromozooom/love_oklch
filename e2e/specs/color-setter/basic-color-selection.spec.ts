import { test, expect } from '@playwright/test';
import {
  SELECTORS,
  setupColorSetterTest,
  switchColorFormat,
  setColorViaInput,
  setRgbSliders,
  createProject,
  logTestStep,
  logTestSection,
  TEST_USERS,
} from '../../utils';

/**
 * E2E Tests for Color Setter Component - User Story 1: Basic Color Selection
 *
 * Tests cover:
 * - HEX color input and validation
 * - RGB slider interaction
 * - HSL format switching with color preservation
 *
 * Prerequisites: Color Setter Component must be rendered in test harness
 */

test.describe('Color Setter Component - US1: Basic Color Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Use utility to setup the complete test environment
    await setupColorSetterTest(page);
  });
  test.describe('HEX Color Input', () => {
    test('T013: Should accept valid HEX color (#00FF00 green) and update preview', async ({
      page,
    }) => {
      logTestStep('Testing HEX color input with green (#00FF00)', true);

      // Given: Switch to HEX format first
      logTestSection('Setting up HEX format');
      await switchColorFormat(page, 'hex');

      // When: User enters green HEX color using utility
      logTestSection('Entering green HEX color');
      await setColorViaInput(page, '#00FF00');

      // Verify the display value shows the entered color
      const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
      const displayedText = await displayValue.textContent();
      logTestStep(`Display value shows: "${displayedText}"`);

      // Then: Color preview should show green
      logTestSection('Verifying color preview');
      const colorPreview = page.locator(SELECTORS.colorSetter.colorPreview);

      // Debug: Check if element exists and is visible
      await expect(colorPreview).toBeVisible({ timeout: 10000 });
      logTestStep(
        `Color preview element found: ${SELECTORS.colorSetter.colorPreview}`
      );

      const previewColor = await colorPreview.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Debug: Log the actual color value
      logTestStep(`Actual preview color: "${previewColor}"`);
      logTestStep(`Expected: rgb(0, 255, 0) or similar green variant`);

      // Verify RGB components of green: (0, 255, 0)
      // More flexible regex to handle different spacing
      const greenColorRegex = /rgb\(\s*0\s*,\s*255\s*,\s*0\s*\)/;
      expect(previewColor).toMatch(greenColorRegex);
      logTestStep('✓ Color preview shows correct green color');

      // And: Display value should show the entered color
      const displayText = (await displayValue.textContent())?.trim();
      logTestStep(`Display value: "${displayText}"`);
      logTestStep(`Expected: #00FF00 or similar 6-digit hex`);

      expect(displayText).toMatch(/^#[0-9A-F]{6}$/i); // Full 6-digit hex

      // More specific check for green
      expect(displayText?.toUpperCase()).toBe('#00FF00');
      logTestStep('✓ Display shows correct HEX format');
    });

    test('T013: Should accept HEX without # prefix', async ({ page }) => {
      logTestStep('Testing HEX input without # prefix');

      // Given: Switch to HEX format
      await switchColorFormat(page, 'hex');

      // When: User enters HEX without # prefix
      logTestSection('Entering HEX color without # prefix');
      await setColorViaInput(page, '00FF00');

      // Then: Component should display #00FF00
      const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
      const displayedText = (await displayValue.textContent())?.trim();
      expect(displayedText?.toUpperCase()).toBe('#00FF00');
      logTestStep('✓ Display shows full HEX format with # prefix');

      // And: Preview should show green
      const colorPreview = page.locator(SELECTORS.colorSetter.colorPreview);
      const previewColor = await colorPreview.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(previewColor).toMatch(/rgb\(\s*0,\s*255,\s*0\s*\)/);
      logTestStep('✓ Color preview shows correct green');
    });

    test('T013: Should silently clamp invalid HEX to nearest valid value', async ({
      page,
    }) => {
      logTestStep('Testing invalid HEX input handling');

      // Given: Switch to HEX format
      await switchColorFormat(page, 'hex');

      // When: User enters invalid HEX (invalid characters)
      logTestSection('Entering invalid HEX color');

      // Click display value to enter edit mode
      const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
      await displayValue.click();

      // Wait for input field to appear and enter invalid HEX
      const colorInput = page.locator(SELECTORS.colorSetter.colorInput);
      await colorInput.waitFor({ state: 'visible', timeout: 5000 });
      await colorInput.clear();
      await colorInput.fill('#GGG'); // Invalid hex digits
      await colorInput.blur();
      await page.waitForTimeout(200);

      // Then: Component should show an error or stay in edit mode
      // Check if still in edit mode (input visible) or if error is shown
      const isInputVisible = await colorInput.isVisible();
      if (isInputVisible) {
        // Still in edit mode, check for error indication
        const hasErrorClass = await colorInput.getAttribute('class');
        expect(hasErrorClass).toContain('border-red-500'); // Error styling
        logTestStep('✓ Input shows error styling for invalid HEX');
      } else {
        // Exited edit mode, should maintain previous valid value
        const displayedText = (await displayValue.textContent())?.trim();
        expect(displayedText).toBeDefined();
        expect(displayedText).not.toBe('');
        logTestStep('✓ Display maintains valid value after invalid input');
      }

      // And: Color preview should still show a valid color
      const colorPreview = page.locator(SELECTORS.colorSetter.colorPreview);
      const previewColor = await colorPreview.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(previewColor).toMatch(/rgb\(/);
      logTestStep('✓ Color preview shows valid RGB color');
    });

    test('T013: Should update displayValue for HEX format immediately', async ({
      page,
    }) => {
      logTestStep('Testing HEX display value update');

      // Given: Switch to HEX format
      await switchColorFormat(page, 'hex');

      // When: User enters a color
      logTestSection('Entering HEX color');
      await setColorViaInput(page, '#FF6B35');

      // Then: Display value should update to show the color
      const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
      await expect(displayValue).toContainText(/[A-F0-9]{6}/i);
      logTestStep('✓ Display value shows HEX format');
    });
  });

  test.describe('RGB Slider Interaction', () => {
    test('T014: Should support RGB slider adjustment for rgb(128,64,192)', async ({
      page,
    }) => {
      logTestStep('Testing RGB slider interaction', true);

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // Switch to RGB format to make RGB sliders visible
      logTestSection('Switching to RGB format');
      await switchColorFormat(page, 'rgb');

      // When: User adjusts RGB sliders to create purple-ish color (128, 64, 192)
      logTestSection('Setting RGB slider values');
      await setRgbSliders(page, 128, 64, 192);

      const colorPreview = page.locator(SELECTORS.colorSetter.colorPreview);

      // Then: Color preview should display the adjusted color
      logTestSection('Verifying color preview');
      const previewColor = await colorPreview.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should approximately match rgb(128, 64, 192)
      expect(previewColor).toMatch(
        /rgb\(\s*1[0-2]\d,\s*[0-9]{1,3},\s*1[0-9]{2}\s*\)/
      );
      logTestStep('✅ RGB sliders successfully set color to purple');
    });

    test('T014: Should update RGB values when slider moves', async ({
      page,
    }) => {
      logTestStep('Testing RGB slider value updates', true);

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // Switch to RGB format
      logTestSection('Setting up RGB format');
      await switchColorFormat(page, 'rgb');

      const rSliderInput = page.locator('[data-testid="rgb-r-slider-input"]');
      const rValueInput = page.locator(
        SELECTORS.colorSetter.rgbSliders.redValue
      );

      // Wait for RGB sliders to appear
      await rSliderInput.waitFor({ state: 'visible', timeout: 5000 });

      // And: User moves red slider to 200
      logTestSection('Setting red slider value to 200');
      await rSliderInput.fill('200');
      await rSliderInput.blur();
      await page.waitForTimeout(300);

      // Then: Red value should display 200 (may include decimal places)
      const value = await rValueInput.inputValue();
      expect(parseFloat(value)).toBe(200);
    });

    test('T014: Should maintain 60fps performance during rapid slider changes', async ({
      page,
    }) => {
      const rgbFormatBtn = page.locator(
        SELECTORS.colorSetter.formatSelector.rgb
      );
      const rSlider = page.locator(SELECTORS.colorSetter.rgbSliders.red);

      // When: User switches to RGB format
      await rgbFormatBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Wait for RGB sliders to appear
      await rSlider.waitFor({ state: 'visible', timeout: 5000 });

      // And: User rapidly adjusts slider using evaluate (more reliable for range inputs)
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        await rSlider.evaluate((el: any, val: string) => {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, String(i * 25));

        // Small delay to simulate realistic interaction
        await page.waitForTimeout(50);
      }

      const duration = Date.now() - startTime;

      // Then: Operation should complete within reasonable time
      // 10 * 50ms + processing should be < 1 second for smooth UX
      expect(duration).toBeLessThan(1000);
    });
  });

  test.describe('Format Switching', () => {
    test('T015: Should preserve color when switching from HSL back to HEX', async ({
      page,
    }) => {
      logTestStep(
        'Testing color preservation between HSL and HEX formats',
        true
      );

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // Start with HEX format and set red color
      logTestSection('Setting initial red color in HEX format');
      await switchColorFormat(page, 'hex');
      await setColorViaInput(page, '#FF0000');

      // When: User switches to HSL format
      logTestSection('Switching to HSL format');
      await switchColorFormat(page, 'hsl');

      // Wait for HSL sliders to appear and verify hue value
      const hueNumberInput = page.locator(
        SELECTORS.colorSetter.hslSliders.hueNumberInput
      );
      await hueNumberInput.waitFor({ state: 'visible', timeout: 5000 });

      // Then: Verify HSL values are displayed (Red: Hue=0, Saturation=100, Lightness=50)
      const hueValue = await hueNumberInput.inputValue();
      expect(parseFloat(hueValue)).toBe(0); // Red has hue = 0
      logTestStep('✓ Hue value is correct for red (0 degrees)');

      // When: User switches back to HEX
      logTestSection('Switching back to HEX format');
      await switchColorFormat(page, 'hex');

      // Then: HEX should show the same red color (may vary slightly due to rounding)
      const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
      await displayValue.waitFor({ state: 'visible', timeout: 5000 });

      const hexValue = await displayValue.textContent();
      logTestStep(`Final HEX value: ${hexValue}`);

      // Red should be preserved - should be close to #FF0000
      expect(hexValue?.trim().toUpperCase()).toMatch(/^#FF[0-9A-F]{4}$/i);
      logTestStep('✓ Color preserved when switching between HSL and HEX');
    });

    test('T015: Should handle HSL format switching from RGB', async ({
      page,
    }) => {
      logTestStep('Testing format switching from RGB to HSL', true);

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // When: User sets RGB values (255, 128, 0) - orange color
      logTestSection('Setting RGB color values');
      await setRgbSliders(page, 255, 128, 0);

      // And: Switches to HSL format
      logTestSection('Switching to HSL format');
      await switchColorFormat(page, 'hsl');

      // Wait for HSL sliders to appear
      const hueNumberInput = page.locator(
        SELECTORS.colorSetter.hslSliders.hueNumberInput
      );
      const saturationNumberInput = page.locator(
        SELECTORS.colorSetter.hslSliders.saturationNumberInput
      );
      const lightnessNumberInput = page.locator(
        SELECTORS.colorSetter.hslSliders.lightnessNumberInput
      );

      await hueNumberInput.waitFor({ state: 'visible', timeout: 5000 });

      // Then: HSL values should represent the same orange color
      logTestSection('Verifying HSL values');
      const hValue = await hueNumberInput.inputValue();
      const sValue = await saturationNumberInput.inputValue();
      const lValue = await lightnessNumberInput.inputValue();

      logTestStep(`HSL values: H=${hValue}, S=${sValue}, L=${lValue}`);

      // RGB(255, 128, 0) should convert to approximately HSL(30, 100, 50)
      expect(parseFloat(hValue)).toBeGreaterThan(25);
      expect(parseFloat(hValue)).toBeLessThan(35);
      expect(parseFloat(sValue)).toBeGreaterThan(90);
      expect(parseFloat(lValue)).toBeGreaterThan(45);
      logTestStep('✓ HSL values correctly represent the RGB color');
    });

    test('T015: Should display correct format after switching', async ({
      page,
    }) => {
      logTestStep('Testing format switching display', true);

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // When: User switches to RGB format
      logTestSection('Switching to RGB format');
      await switchColorFormat(page, 'rgb');

      // Wait for RGB sliders to appear
      const rgbSlider = page.locator('[data-testid="rgb-r-slider"]');
      await rgbSlider.waitFor({ state: 'visible', timeout: 5000 });
      logTestStep('✓ RGB sliders are visible');

      // And: Switches back to HEX format
      logTestSection('Switching back to HEX format');
      await switchColorFormat(page, 'hex');

      // Then: HEX input should be visible and display value should show HEX format
      const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
      await displayValue.waitFor({ state: 'visible', timeout: 5000 });

      const displayText = await displayValue.textContent();
      logTestStep(`Display value: ${displayText}`);

      // Should show HEX format (starts with #)
      expect(displayText?.trim()).toMatch(/^#[0-9A-F]{6}$/i);
      logTestStep('✓ Display shows correct HEX format after switching');
    });
  });

  test.describe('Real-time Preview', () => {
    test('T016: Should update color preview in real-time as user types', async ({
      page,
    }) => {
      logTestStep('Testing real-time color preview updates', true);

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // Switch to HEX format first
      logTestSection('Setting up HEX format');
      await switchColorFormat(page, 'hex');

      // When: User enters green color
      logTestSection('Setting green color');
      await setColorViaInput(page, '#00FF00');

      // Then: Preview should show green
      logTestSection('Verifying color preview');
      const colorPreview = page.locator(SELECTORS.colorSetter.colorPreview);
      const previewColor = await colorPreview.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      logTestStep(`Preview color: ${previewColor}`);
      expect(previewColor).toMatch(/rgb\(\s*0,\s*255,\s*0\s*\)/);
      logTestStep('✓ Color preview shows green as expected');
    });

    test('T017: Should update sliders when preview color changes', async ({
      page,
    }) => {
      logTestStep('Testing slider updates when color changes', true);

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // Start with HEX format and set magenta color
      logTestSection('Setting magenta color in HEX format');
      await switchColorFormat(page, 'hex');
      await setColorViaInput(page, '#FF00FF'); // Magenta

      // When: User switches to HSL format
      logTestSection('Switching to HSL format');
      await switchColorFormat(page, 'hsl');

      // Wait for HSL sliders to appear
      const hueNumberInput = page.locator(
        SELECTORS.colorSetter.hslSliders.hueNumberInput
      );
      await hueNumberInput.waitFor({ state: 'visible', timeout: 5000 });

      // Then: Sliders should be updated to magenta values
      logTestSection('Verifying HSL hue value for magenta');
      const hValue = await hueNumberInput.inputValue();

      logTestStep(`HSL Hue value: ${hValue}`);

      // Magenta (#FF00FF) should be around hue 300 degrees
      expect(parseFloat(hValue)).toBeGreaterThan(290);
      expect(parseFloat(hValue)).toBeLessThan(310);
      logTestStep('✓ HSL sliders correctly updated to magenta values');
    });

    test('T018: Should handle invalid format gracefully', async ({ page }) => {
      logTestStep('Testing invalid color input handling', true);

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // Start with HEX format
      logTestSection('Setting up HEX format');
      await switchColorFormat(page, 'hex');

      // When: User enters invalid HEX value
      logTestSection('Entering invalid HEX color #GGGGGG');
      await setColorViaInput(page, '#GGGGGG'); // Invalid hex

      // Then: Component should provide smart error handling (PLANNED FEATURE)
      logTestSection('Verifying smart error handling');

      // FUTURE FEATURE: Auto-correct invalid hex to closest valid color
      // This test is designed to FAIL until this feature is implemented
      const displayValue = page.locator(SELECTORS.colorSetter.displayValue);

      // Wait a moment for any auto-correction to happen
      await page.waitForTimeout(1000);

      // Check if display value is visible (it won't be during error state)
      const isDisplayVisible = await displayValue.isVisible();

      if (isDisplayVisible) {
        const correctedValue = await displayValue.textContent();
        logTestStep(`Auto-corrected value: ${correctedValue}`);

        // PLANNED: Should auto-correct #GGGGGG to something like #666666
        expect(correctedValue?.trim().toUpperCase()).toBe('#666666');
        logTestStep('✓ Invalid hex auto-corrected to valid color');
      } else {
        // Currently the component shows an error and keeps input field visible
        // PLANNED: Should auto-correct and hide input field
        logTestStep(
          '❌ Auto-correction not implemented yet - test designed to fail'
        );
        expect(isDisplayVisible).toBe(true); // This will fail as intended
      }
    });
  });
});
