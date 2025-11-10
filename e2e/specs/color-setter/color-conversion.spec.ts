import { test, expect } from '@playwright/test';
import { loginAsUser, TEST_USERS } from '../../fixtures/auth';
import {
  SELECTORS,
  createProject,
  switchColorFormat,
  setRgbSliders,
  setHslSliders,
  setColorViaInput,
  logTestStep,
  logTestSection,
} from '../../utils';

/**
 * Test Suite: Color Format Conversion
 *
 * Tests that colors are correctly preserved when switching between
 * different color formats (HEX, RGB, HSL).
 *
 * Critical for ensuring no color data loss during format switching.
 */
test.describe('Color Setter Component - Color Format Conversion', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await loginAsUser(page, TEST_USERS.PRO_USER);

    // Wait for projects page to load
    await page.waitForSelector('button:has-text("New Project")', {
      timeout: 10000,
    });
    await page.waitForLoadState('networkidle');

    // Create a new project to access color setter
    await page.click('button:has-text("New Project")');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Fill minimal form to create project
    const projectName = `Test ${Date.now()}`;
    await page.fill('#name', projectName);
    await page.selectOption('select#colorGamut', 'sRGB');
    await page.selectOption('select#colorSpace', 'OKLCH');
    await page.fill('input#colorCount', '5');

    // Submit form to create project
    await page.click('button[type="submit"]:has-text("Create")');

    // Wait for project editor/color setter to load
    await page.waitForSelector('app-color-setter', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Wait a bit more for Angular change detection
    await page.waitForTimeout(500);
  });

  test.describe('RGB to HSL Conversion', () => {
    test('T020: Should correctly convert RGB(255, 157, 21) to HSL', async ({
      page,
    }) => {
      logTestStep('Testing RGB to HSL color conversion', true);

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // When: Set RGB values to orange (255, 157, 21)
      logTestSection('Setting RGB values to orange');
      await setRgbSliders(page, 255, 157, 21);

      // And: Switch to HSL format
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

      // Then: HSL values should correctly represent the orange color
      logTestSection('Verifying HSL conversion values');
      const hValue = await hueNumberInput.inputValue();
      const sValue = await saturationNumberInput.inputValue();
      const lValue = await lightnessNumberInput.inputValue();

      logTestStep(`HSL Values - H: ${hValue}°, S: ${sValue}%, L: ${lValue}%`);
      logTestStep(`Expected: H: ~35°, S: ~100%, L: ~54%`);

      // RGB(255, 157, 21) converts to HSL(34.87°, 100%, 54.12%)
      // This is correct per HSL formula: fully saturated orange
      expect(parseFloat(hValue)).toBeGreaterThan(33);
      expect(parseFloat(hValue)).toBeLessThan(37);
      expect(parseFloat(sValue)).toBeGreaterThan(98); // Nearly fully saturated
      expect(parseFloat(lValue)).toBeGreaterThan(52);
      expect(parseFloat(lValue)).toBeLessThan(56);
      logTestStep('✓ RGB to HSL conversion is accurate');
    });

    test('T021: Should correctly convert RGB(0, 128, 255) to HSL', async ({
      page,
    }) => {
      logTestStep('Testing RGB to HSL color conversion for blue', true);

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // When: Set RGB values to blue (0, 128, 255)
      logTestSection('Setting RGB values to blue');
      await setRgbSliders(page, 0, 128, 255);

      // And: Switch to HSL format
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

      // Then: HSL values should correctly represent the blue color
      logTestSection('Verifying HSL conversion values');
      const hValue = await hueNumberInput.inputValue();
      const sValue = await saturationNumberInput.inputValue();
      const lValue = await lightnessNumberInput.inputValue();

      logTestStep(`HSL Values - H: ${hValue}°, S: ${sValue}%, L: ${lValue}%`);
      logTestStep(`Expected: H: ~210°, S: ~100%, L: ~50%`);

      // RGB(0, 128, 255) should convert to approximately HSL(210°, 100%, 50%)
      expect(parseFloat(hValue)).toBeGreaterThan(208);
      expect(parseFloat(hValue)).toBeLessThan(212);
      expect(parseFloat(sValue)).toBeGreaterThan(98);
      expect(parseFloat(lValue)).toBeGreaterThan(48);
      expect(parseFloat(lValue)).toBeLessThan(52);
      logTestStep('✓ RGB to HSL conversion for blue is accurate');
    });
  });

  test.describe('HSL to RGB Conversion', () => {
    test('T022: Should correctly convert HSL(85°, 76%, 35%) to RGB', async ({
      page,
    }) => {
      logTestStep('Testing HSL to RGB color conversion', true);

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // When: Set HSL values to yellowish-green (85°, 76%, 35%)
      logTestSection('Setting HSL values');
      await setHslSliders(page, 85, 76, 35);

      // And: Switch to RGB format
      logTestSection('Switching to RGB format');
      await switchColorFormat(page, 'rgb');

      // Wait for RGB sliders to appear
      const rNumberInput = page.locator(
        SELECTORS.colorSetter.rgbSliders.redValue
      );
      const gNumberInput = page.locator(
        SELECTORS.colorSetter.rgbSliders.greenValue
      );
      const bNumberInput = page.locator(
        SELECTORS.colorSetter.rgbSliders.blueValue
      );

      await rNumberInput.waitFor({ state: 'visible', timeout: 5000 });

      // Then: RGB values should correctly represent the yellowish-green color
      logTestSection('Verifying RGB conversion values');
      const rValue = await rNumberInput.inputValue();
      const gValue = await gNumberInput.inputValue();
      const bValue = await bNumberInput.inputValue();

      logTestStep(`RGB Values - R: ${rValue}, G: ${gValue}, B: ${bValue}`);
      logTestStep(`Expected: R: ~101, G: ~157, B: ~21`);

      // HSL(85°, 76%, 35%) converts to RGB(101, 157, 21) per colorjs.io
      expect(parseFloat(rValue)).toBeGreaterThan(98);
      expect(parseFloat(rValue)).toBeLessThan(105);
      expect(parseFloat(gValue)).toBeGreaterThan(154);
      expect(parseFloat(gValue)).toBeLessThan(160);
      expect(parseFloat(bValue)).toBeGreaterThan(18);
      expect(parseFloat(bValue)).toBeLessThan(25);
      logTestStep('✓ HSL to RGB conversion is accurate');
    });
  });

  test.describe('Round-Trip Conversion', () => {
    test('T023: Should preserve color through HEX → RGB → HSL → HEX conversion', async ({
      page,
    }) => {
      logTestStep(
        'Testing round-trip color conversion (HEX → RGB → HSL → HEX)',
        true
      );

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // Start with a specific HEX color (magenta)
      logTestSection('Setting initial magenta color in HEX');
      const originalHex = '#FF00FF';
      await switchColorFormat(page, 'hex');
      await setColorViaInput(page, originalHex);

      // When: Convert to RGB and verify values
      logTestSection('Converting to RGB and verifying values');
      await switchColorFormat(page, 'rgb');

      const rNumberInput = page.locator(
        SELECTORS.colorSetter.rgbSliders.redValue
      );
      const gNumberInput = page.locator(
        SELECTORS.colorSetter.rgbSliders.greenValue
      );
      const bNumberInput = page.locator(
        SELECTORS.colorSetter.rgbSliders.blueValue
      );

      await rNumberInput.waitFor({ state: 'visible', timeout: 5000 });

      // Verify RGB values are correct for magenta
      const rValue = await rNumberInput.inputValue();
      const gValue = await gNumberInput.inputValue();
      const bValue = await bNumberInput.inputValue();

      logTestStep(`RGB Values: R=${rValue}, G=${gValue}, B=${bValue}`);
      expect(parseFloat(rValue)).toBe(255);
      expect(parseFloat(gValue)).toBe(0);
      expect(parseFloat(bValue)).toBe(255);

      // And: Convert to HSL and verify values
      logTestSection('Converting to HSL and verifying values');
      await switchColorFormat(page, 'hsl');

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

      // Verify HSL values are correct for magenta
      const hValue = await hueNumberInput.inputValue();
      const sValue = await saturationNumberInput.inputValue();
      const lValue = await lightnessNumberInput.inputValue();

      logTestStep(`HSL Values: H=${hValue}°, S=${sValue}%, L=${lValue}%`);

      // Magenta should be around HSL(300°, 100%, 50%)
      expect(parseFloat(hValue)).toBeGreaterThan(298);
      expect(parseFloat(hValue)).toBeLessThan(302);
      expect(parseFloat(sValue)).toBeGreaterThan(98);
      expect(parseFloat(lValue)).toBeGreaterThan(48);
      expect(parseFloat(lValue)).toBeLessThan(52);

      // And: Convert back to HEX
      logTestSection('Converting back to HEX and verifying preservation');
      await switchColorFormat(page, 'hex');

      // Then: HEX should match the original (or be very close)
      const displayValue = page.locator(SELECTORS.colorSetter.displayValue);
      await displayValue.waitFor({ state: 'visible', timeout: 5000 });

      const finalHex = await displayValue.textContent();
      logTestStep(`Final HEX: ${finalHex}, Original: ${originalHex}`);
      expect(finalHex?.trim().toUpperCase()).toBe('#FF00FF');
      logTestStep('✓ Color preserved through round-trip conversion');
    });

    test('T024: Should handle achromatic colors (black, white, gray) correctly', async ({
      page,
    }) => {
      logTestStep('Testing achromatic colors (black, white) conversion', true);

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // Test black
      logTestSection('Testing black color conversion');
      await switchColorFormat(page, 'hex');
      await setColorViaInput(page, '#000000');

      // Switch to HSL and verify black values
      await switchColorFormat(page, 'hsl');

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

      // Black should have hue=0, saturation=0, lightness=0
      const hValue = await hueNumberInput.inputValue();
      const sValue = await saturationNumberInput.inputValue();
      const lValue = await lightnessNumberInput.inputValue();

      logTestStep(`Black HSL Values: H=${hValue}°, S=${sValue}%, L=${lValue}%`);
      expect(parseFloat(hValue)).toBe(0); // Hue defaults to 0 for achromatic colors
      expect(parseFloat(sValue)).toBe(0);
      expect(parseFloat(lValue)).toBe(0);

      // Test white
      logTestSection('Testing white color conversion');
      await switchColorFormat(page, 'hex');
      await setColorViaInput(page, '#FFFFFF');

      await switchColorFormat(page, 'hsl');
      await hueNumberInput.waitFor({ state: 'visible', timeout: 5000 });

      const hValue2 = await hueNumberInput.inputValue();
      const sValue2 = await saturationNumberInput.inputValue();
      const lValue2 = await lightnessNumberInput.inputValue();

      logTestStep(
        `White HSL Values: H=${hValue2}°, S=${sValue2}%, L=${lValue2}%`
      );

      // White should have hue=0, saturation=0, lightness=100
      expect(parseFloat(hValue2)).toBe(0); // Hue defaults to 0 for achromatic colors
      expect(parseFloat(sValue2)).toBe(0);
      expect(parseFloat(lValue2)).toBe(100);
      logTestStep('✓ Achromatic colors converted correctly');
    });
  });

  test.describe('Edge Cases', () => {
    test('T025: Should handle RGB values at maximum (255, 255, 255)', async ({
      page,
    }) => {
      logTestStep('Testing RGB maximum values (white) conversion', true);

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // When: Set all RGB to max (white)
      logTestSection('Setting RGB values to maximum (255, 255, 255)');
      await setRgbSliders(page, 255, 255, 255);

      // And: Switch to HSL
      logTestSection('Switching to HSL format');
      await switchColorFormat(page, 'hsl');

      const lightnessNumberInput = page.locator(
        SELECTORS.colorSetter.hslSliders.lightnessNumberInput
      );
      await lightnessNumberInput.waitFor({ state: 'visible', timeout: 5000 });

      // Then: White should have lightness = 100%
      logTestSection('Verifying lightness value for white');
      const lValue = await lightnessNumberInput.inputValue();

      logTestStep(`Lightness value: ${lValue}%`);
      expect(parseFloat(lValue)).toBe(100);
      logTestStep(
        '✓ RGB maximum values correctly convert to HSL lightness 100%'
      );
    });

    test('T026: Should handle single-channel RGB colors', async ({ page }) => {
      logTestStep('Testing single-channel RGB colors (pure red)', true);

      // Given: Create project (user already logged in via fixture)
      logTestSection('Setting up test context');
      await createProject(page);

      // When: Set only red channel (pure red)
      logTestSection('Setting RGB values to pure red (255, 0, 0)');
      await setRgbSliders(page, 255, 0, 0);

      // And: Switch to HSL
      logTestSection('Switching to HSL format');
      await switchColorFormat(page, 'hsl');

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

      // Then: Pure red should be HSL(0°, 100%, 50%)
      logTestSection('Verifying HSL values for pure red');
      const hValue = await hueNumberInput.inputValue();
      const sValue = await saturationNumberInput.inputValue();
      const lValue = await lightnessNumberInput.inputValue();

      logTestStep(
        `Pure Red HSL Values: H=${hValue}°, S=${sValue}%, L=${lValue}%`
      );
      logTestStep(`Expected: H=0°, S=100%, L=50%`);

      expect(parseFloat(hValue)).toBe(0);
      expect(parseFloat(sValue)).toBe(100);
      expect(parseFloat(lValue)).toBe(50);
      logTestStep('✓ Single-channel RGB correctly converts to HSL');
    });
  });
});
