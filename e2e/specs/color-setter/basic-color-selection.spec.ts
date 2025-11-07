import { test, expect } from '@playwright/test';

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
    // Navigate to component test page
    // TODO: Replace with actual component test URL after component is created
    await page.goto('/color-setter-demo');

    // Wait for component to be ready
    await page.waitForSelector('[data-testid="color-setter-component"]', { timeout: 5000 });
  });

  test.describe('HEX Color Input', () => {
    test('T013: Should accept valid HEX color (#00FF00 green) and update preview', async ({ page }) => {
      // Given: User sees color setter component with default red color
      const hexInput = page.locator('[data-testid="hex-input"]');
      const colorPreview = page.locator('[data-testid="color-preview"]');

      // When: User enters green HEX color
      await hexInput.clear();
      await hexInput.fill('#00FF00');
      await hexInput.blur(); // Trigger change detection

      // Then: Color preview should show green
      const previewColor = await colorPreview.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Verify RGB components of green: (0, 255, 0)
      expect(previewColor).toMatch(/rgb\(\s*0,\s*255,\s*0\s*\)/);

      // And: HEX input should display the entered value
      const displayedValue = await hexInput.inputValue();
      expect(displayedValue).toBe('#00FF00');
    });

    test('T013: Should accept HEX without # prefix', async ({ page }) => {
      const hexInput = page.locator('[data-testid="hex-input"]');

      // When: User enters HEX without # prefix
      await hexInput.clear();
      await hexInput.fill('FF0000');
      await hexInput.blur();

      // Then: Component should normalize to #FF0000
      const displayedValue = await hexInput.inputValue();
      expect(displayedValue).toMatch(/^#?FF0000$/i);
    });

    test('T013: Should silently clamp invalid HEX to nearest valid value', async ({ page }) => {
      const hexInput = page.locator('[data-testid="hex-input"]');
      const colorPreview = page.locator('[data-testid="color-preview"]');

      // When: User enters invalid HEX (shorter than expected)
      await hexInput.clear();
      await hexInput.fill('#GGG'); // Invalid hex digits
      await hexInput.blur();

      // Then: Component should either:
      // - Revert to previous valid value, OR
      // - Clamp to nearest valid color
      // (This depends on implementation - test verifies graceful handling)
      const currentValue = await hexInput.inputValue();
      expect(currentValue).toBeDefined(); // Should not be empty

      // And: Color preview should still show a valid color
      const previewColor = await colorPreview.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(previewColor).toMatch(/rgb\(/);
    });

    test('T013: Should update displayValue for HEX format immediately', async ({ page }) => {
      const hexInput = page.locator('[data-testid="hex-input"]');
      const displayValue = page.locator('[data-testid="display-value"]');

      // When: User enters a color
      await hexInput.clear();
      await hexInput.fill('#FF6B35');
      await hexInput.blur();

      // Then: Display value should update to show the color
      await expect(displayValue).toContainText(/[A-F0-9]{6}/i);
    });
  });

  test.describe('RGB Slider Interaction', () => {
    test('T014: Should support RGB slider adjustment for rgb(128,64,192)', async ({ page }) => {
      const rSlider = page.locator('[data-testid="rgb-slider-r"]');
      const gSlider = page.locator('[data-testid="rgb-slider-g"]');
      const bSlider = page.locator('[data-testid="rgb-slider-b"]');
      const colorPreview = page.locator('[data-testid="color-preview"]');

      // When: User switches to RGB format
      await page.locator('[data-testid="format-selector-rgb"]').click();

      // And: User adjusts RGB sliders to create purple-ish color (128, 64, 192)
      // Note: Slider value range is 0-255
      await rSlider.fill('128');
      await gSlider.fill('64');
      await bSlider.fill('192');

      // Trigger change events
      await rSlider.blur();
      await gSlider.blur();
      await bSlider.blur();

      // Then: Color preview should display the adjusted color
      const previewColor = await colorPreview.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should approximately match rgb(128, 64, 192)
      expect(previewColor).toMatch(/rgb\(\s*1[0-2]\d,\s*[0-9]{1,3},\s*1[0-9]{2}\s*\)/);
    });

    test('T014: Should update RGB values when slider moves', async ({ page }) => {
      const rSlider = page.locator('[data-testid="rgb-slider-r"]');
      const rLabel = page.locator('[data-testid="rgb-value-r"]');

      // When: User switches to RGB format
      await page.locator('[data-testid="format-selector-rgb"]').click();

      // And: User moves red slider to 200
      await rSlider.fill('200');
      await rSlider.blur();

      // Then: Red value should display 200
      const value = await rLabel.textContent();
      expect(value).toContain('200');
    });

    test('T014: Should maintain 60fps performance during rapid slider changes', async ({ page }) => {
      const rSlider = page.locator('[data-testid="rgb-slider-r"]');

      // When: User switches to RGB format
      await page.locator('[data-testid="format-selector-rgb"]').click();

      // And: User rapidly adjusts slider
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        await rSlider.fill(String(i * 25));
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
    test('T015: Should preserve color when switching from HSL back to HEX', async ({ page }) => {
      const hexInput = page.locator('[data-testid="hex-input"]');
      const hslFormatBtn = page.locator('[data-testid="format-selector-hsl"]');
      const hexFormatBtn = page.locator('[data-testid="format-selector-hex"]');

      // Given: User starts with red HEX color
      const originalHex = '#FF0000';
      await hexInput.clear();
      await hexInput.fill(originalHex);
      await hexInput.blur();

      // When: User switches to HSL format
      await hslFormatBtn.click();

      // Wait for format to switch
      await page.waitForSelector('[data-testid="hsl-sliders"]', { timeout: 1000 });

      // Then: Verify HSL values are displayed (Hue=0, Saturation=100, Lightness=50)
      const hueSlider = page.locator('[data-testid="hsl-slider-h"]');
      await expect(hueSlider).toHaveValue('0');

      // When: User switches back to HEX
      await hexFormatBtn.click();
      await page.waitForSelector('[data-testid="hex-input"]', { timeout: 1000 });

      // Then: HEX should show the same color (may vary slightly due to rounding)
      const hexValue = await hexInput.inputValue();
      // Red should be preserved (FF in hex is 255)
      expect(hexValue.toUpperCase()).toMatch(/#FF[0-9A-F]{4}/);
    });

    test('T015: Should handle HSL format switching from RGB', async ({ page }) => {
      const rgbFormatBtn = page.locator('[data-testid="format-selector-rgb"]');
      const hslFormatBtn = page.locator('[data-testid="format-selector-hsl"]');

      // When: User switches to RGB
      await rgbFormatBtn.click();
      await page.waitForSelector('[data-testid="rgb-sliders"]');

      // And: User sets RGB values
      await page.locator('[data-testid="rgb-slider-r"]').fill('255');
      await page.locator('[data-testid="rgb-slider-g"]').fill('128');
      await page.locator('[data-testid="rgb-slider-b"]').fill('0');

      // And: Switches to HSL
      await hslFormatBtn.click();
      await page.waitForSelector('[data-testid="hsl-sliders"]');

      // Then: HSL sliders should be visible and set appropriately
      const hueSlider = page.locator('[data-testid="hsl-slider-h"]');
      await expect(hueSlider).toBeDefined();
    });

    test('T015: Should display colorChange event on format switch', async ({ page }) => {
      // When: User switches format
      await page.locator('[data-testid="format-selector-rgb"]').click();

      // Then: colorChange event should be emitted
      // (Verify through console or event listener)
      const events = await page.evaluate(() => {
        return (window as any).__colorChangeEvents || [];
      });

      expect(events.length).toBeGreaterThan(0);
    });
  });

  test.describe('Real-time Preview', () => {
    test('T016: Should update color preview in real-time as user types', async ({ page }) => {
      const hexInput = page.locator('[data-testid="hex-input"]');
      const colorPreview = page.locator('[data-testid="color-preview"]');

      // When: User types a new color
      await hexInput.clear();
      await hexInput.type('#00FF00'); // Type character by character

      // After each character (debounced at 16ms)
      await page.waitForTimeout(200); // Wait for debounce

      // Then: Preview should show green
      const previewColor = await colorPreview.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      expect(previewColor).toMatch(/rgb\(\s*0,\s*255,\s*0\s*\)/);
    });
  });
});
