import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../../fixtures/auth';

/**
 * E2E Tests for HEX Color Picker Component
 *
 * Tests cover:
 * - Canvas color selection with proper edge handling
 * - Color indicator positioning and dragging
 * - Hue slider integration
 * - HEX input field synchronization
 * - Corner color selection (pure white, red, black)
 * - Color indicator extending outside canvas boundaries
 *
 * Prerequisites: Color Setter Component with HEX color picker must be rendered
 */

test.describe('HEX Color Picker Component', () => {
  test.beforeEach(async ({ page }) => {
    // Login as PRO user and create a new project
    await login(page, TEST_USERS.PRO_USER.email, TEST_USERS.PRO_USER.password);

    await page.waitForSelector('button:has-text("New Project")', {
      timeout: 10000,
    });
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("New Project")');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Create project with minimal configuration
    const projectName = `HEX Picker Test ${Date.now()}`;
    await page.fill('#name', projectName);
    await page.selectOption('select#colorGamut', 'sRGB');
    await page.selectOption('select#colorSpace', 'OKLCH');
    await page.fill('input#colorCount', '5');

    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForSelector('app-color-setter', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Navigate to HEX color picker if not already visible
    const hexCanvas = page.locator('[data-testid="color-canvas"]');
    if (!(await hexCanvas.isVisible())) {
      // Look for HEX tab or switch to HEX mode
      const hexTab = page
        .locator('text=HEX')
        .or(page.locator('[data-testid="hex-tab"]'));
      if (await hexTab.isVisible()) {
        await hexTab.click();
        await page.waitForTimeout(300);
      }
    }

    // Ensure HEX color picker components are visible
    await expect(page.locator('[data-testid="color-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="color-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="hex-input"]')).toBeVisible();
  });

  test('should display HEX color picker components', async ({ page }) => {
    // Verify all components are present
    await expect(page.locator('[data-testid="color-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="color-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="hex-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="hex-hue-slider"]')).toBeVisible();

    // Verify canvas dimensions
    const canvas = page.locator('[data-testid="color-canvas"]');
    await expect(canvas).toHaveAttribute('width', '256');
    await expect(canvas).toHaveAttribute('height', '256');

    // Verify color indicator is positioned
    const indicator = page.locator('[data-testid="color-indicator"]');
    const indicatorBox = await indicator.boundingBox();
    expect(indicatorBox).toBeTruthy();
    // Rotated 45deg square will have larger bounding box (√2 * 24 ≈ 34px)
    expect(indicatorBox!.width).toBeGreaterThan(30);
    expect(indicatorBox!.width).toBeLessThan(40);
    expect(indicatorBox!.height).toBeGreaterThan(30);
    expect(indicatorBox!.height).toBeLessThan(40);
  });

  test('should select pure white color at top-left corner', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const hexInput = page.locator('[data-testid="hex-input"]');
    const indicator = page.locator('[data-testid="color-indicator"]');

    // Set hue to red (0°) first
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');
    await hueSlider.fill('0');

    // Click on top-left corner of canvas (pure white)
    const canvasBox = await canvas.boundingBox();
    await canvas.click({
      position: { x: 0, y: 0 },
    });

    // Wait for color update
    await page.waitForTimeout(200);

    // Verify HEX input shows white (allow slight variations due to rounding)
    const hexValue = await hexInput.inputValue();
    const hexLower = hexValue.toLowerCase();
    expect(hexLower).toMatch(/^#f[c-f]f[c-f]f[c-f]$/); // Accept near-white values

    // Verify indicator position is at top-left corner
    const indicatorBox = await indicator.boundingBox();
    const canvasPosition = await canvas.boundingBox();

    // The indicator center should be at canvas top-left (allowing extension outside)
    const indicatorCenterX = indicatorBox!.x + indicatorBox!.width / 2;
    const indicatorCenterY = indicatorBox!.y + indicatorBox!.height / 2;

    expect(Math.abs(indicatorCenterX - canvasPosition!.x)).toBeLessThan(2);
    expect(Math.abs(indicatorCenterY - canvasPosition!.y)).toBeLessThan(2);
  });

  test('should select pure red color at top-right corner', async ({ page }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const hexInput = page.locator('[data-testid="hex-input"]');
    const indicator = page.locator('[data-testid="color-indicator"]');

    // Set hue to red (0°)
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');
    await hueSlider.fill('0');

    // Click on top-right corner of canvas (pure red)
    const canvasBox = await canvas.boundingBox();
    await canvas.click({
      position: { x: 255, y: 0 },
    });

    await page.waitForTimeout(200);

    // Verify HEX input shows red (allow slight variations due to rounding)
    const hexValue = await hexInput.inputValue();
    const hexLower = hexValue.toLowerCase();
    expect(hexLower).toMatch(/^#f[c-f]0000$/); // Accept near-red values

    // Verify indicator position is at top-right corner
    const indicatorBox = await indicator.boundingBox();
    const canvasPosition = await canvas.boundingBox();

    const indicatorCenterX = indicatorBox!.x + indicatorBox!.width / 2;
    const indicatorCenterY = indicatorBox!.y + indicatorBox!.height / 2;

    expect(Math.abs(indicatorCenterX - (canvasPosition!.x + 255))).toBeLessThan(
      2
    );
    expect(Math.abs(indicatorCenterY - canvasPosition!.y)).toBeLessThan(2);
  });

  test('should select pure black color at bottom-left corner', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const hexInput = page.locator('[data-testid="hex-input"]');
    const indicator = page.locator('[data-testid="color-indicator"]');

    // Set hue to red (0°)
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');
    await hueSlider.fill('0');

    // Click on bottom-left corner of canvas (pure black)
    await canvas.click({
      position: { x: 0, y: 255 },
    });

    await page.waitForTimeout(200);

    // Verify HEX input shows black
    const hexValue = await hexInput.inputValue();
    expect(hexValue.toLowerCase()).toBe('#000000');

    // Verify indicator position is at bottom-left corner
    const indicatorBox = await indicator.boundingBox();
    const canvasPosition = await canvas.boundingBox();

    const indicatorCenterX = indicatorBox!.x + indicatorBox!.width / 2;
    const indicatorCenterY = indicatorBox!.y + indicatorBox!.height / 2;

    expect(Math.abs(indicatorCenterX - canvasPosition!.x)).toBeLessThan(2);
    expect(Math.abs(indicatorCenterY - (canvasPosition!.y + 255))).toBeLessThan(
      2
    );
  });

  test('should allow dragging color indicator to canvas edges', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const indicator = page.locator('[data-testid="color-indicator"]');
    const hexInput = page.locator('[data-testid="hex-input"]');

    // Set hue to red for consistent testing
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');
    await hueSlider.fill('0');

    // Get canvas boundaries
    const canvasBox = await canvas.boundingBox();

    // Start dragging from center
    await indicator.dragTo(canvas, {
      targetPosition: { x: 128, y: 128 },
    });
    await page.waitForTimeout(100);

    // Drag to top-right corner (pure red)
    await indicator.dragTo(canvas, {
      targetPosition: { x: 255, y: 0 },
    });
    await page.waitForTimeout(200);

    let hexValue = await hexInput.inputValue();
    const hexLower = hexValue.toLowerCase();
    expect(hexLower).toMatch(/^#f[c-f]0000$/); // Allow slight color variations

    // Drag to top-left corner (pure white)
    await indicator.dragTo(canvas, {
      targetPosition: { x: 0, y: 0 },
    });
    await page.waitForTimeout(200);

    hexValue = await hexInput.inputValue();
    expect(hexValue.toLowerCase()).toBe('#ffffff');

    // Drag to bottom-left corner (pure black)
    await indicator.dragTo(canvas, {
      targetPosition: { x: 0, y: 255 },
    });
    await page.waitForTimeout(200);

    hexValue = await hexInput.inputValue();
    expect(hexValue.toLowerCase()).toBe('#000000');
  });

  test('should synchronize with HEX input field', async ({ page }) => {
    const hexInput = page.locator('[data-testid="hex-input"]');
    const indicator = page.locator('[data-testid="color-indicator"]');
    const canvas = page.locator('[data-testid="color-canvas"]');

    // Type a HEX color directly
    await hexInput.fill('#00ff00'); // Green
    await hexInput.blur();
    await page.waitForTimeout(300);

    // Verify indicator moved to correct position
    // Green should be at top-right when hue is set to green
    const indicatorBox = await indicator.boundingBox();
    expect(indicatorBox).toBeTruthy();

    // Type another color
    await hexInput.fill('#0080ff'); // Blue-ish
    await hexInput.blur();
    await page.waitForTimeout(300);

    // Verify the color updated (indicator should move)
    const newIndicatorBox = await indicator.boundingBox();
    expect(newIndicatorBox).toBeTruthy();

    // Positions should be different
    expect(
      Math.abs(indicatorBox!.x - newIndicatorBox!.x) > 5 ||
        Math.abs(indicatorBox!.y - newIndicatorBox!.y) > 5
    ).toBeTruthy();
  });

  test('should update HEX value when hue slider changes', async ({ page }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const hexInput = page.locator('[data-testid="hex-input"]');
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');

    // Click on top-right corner (pure saturated color)
    await canvas.click({
      position: { x: 255, y: 0 },
    });
    await page.waitForTimeout(200);

    // Change hue to green (120°)
    await hueSlider.fill('120');
    await page.waitForTimeout(300);

    let hexValue = await hexInput.inputValue();
    expect(hexValue.toLowerCase()).toBe('#00ff00'); // Green

    // Change hue to blue (240°)
    await hueSlider.fill('240');
    await page.waitForTimeout(300);

    hexValue = await hexInput.inputValue();
    expect(hexValue.toLowerCase()).toBe('#0000ff'); // Blue
  });

  test('should handle invalid HEX input gracefully', async ({ page }) => {
    const hexInput = page.locator('[data-testid="hex-input"]');

    const initialValue = await hexInput.inputValue();

    // Try invalid HEX values
    await hexInput.fill('invalid');
    await hexInput.blur();
    await page.waitForTimeout(200);

    // Should revert to previous valid value or stay unchanged
    const afterInvalidValue = await hexInput.inputValue();
    expect(afterInvalidValue).toBe(initialValue);

    // Try another invalid format
    await hexInput.fill('#gggggg');
    await hexInput.blur();
    await page.waitForTimeout(200);

    const afterInvalid2Value = await hexInput.inputValue();
    expect(afterInvalid2Value).toBe(initialValue);

    // Valid HEX should work
    await hexInput.fill('#ff5500');
    await hexInput.blur();
    await page.waitForTimeout(200);

    const validValue = await hexInput.inputValue();
    expect(validValue.toLowerCase()).toBe('#ff5500');
  });

  test('should maintain indicator visibility when positioned at canvas edges', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const indicator = page.locator('[data-testid="color-indicator"]');

    // Test all four corners to ensure indicator remains visible
    const corners = [
      { x: 0, y: 0, name: 'top-left' },
      { x: 255, y: 0, name: 'top-right' },
      { x: 0, y: 255, name: 'bottom-left' },
      { x: 255, y: 255, name: 'bottom-right' },
    ];

    for (const corner of corners) {
      await canvas.click({
        position: { x: corner.x, y: corner.y },
      });
      await page.waitForTimeout(200);

      // Verify indicator is still visible
      await expect(indicator).toBeVisible();

      // Verify indicator has proper size (not clipped)
      const indicatorBox = await indicator.boundingBox();
      expect(indicatorBox!.width).toBe(24);
      expect(indicatorBox!.height).toBe(24);
    }
  });

  test('should show diamond-shaped color indicator', async ({ page }) => {
    const indicator = page.locator('[data-testid="color-indicator"]');

    // Verify indicator has the diamond rotation transform
    const transform = await indicator.evaluate(
      (el) => window.getComputedStyle(el).transform
    );

    // Should have rotation (matrix with rotation values)
    expect(transform).not.toBe('none');
    expect(transform).toContain('matrix');

    // Verify it's styled as a diamond (has the expected CSS classes)
    await expect(indicator).toHaveClass(/color-indicator/);
  });

  test('should position diamond indicator center exactly where canvas is clicked', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const indicator = page.locator('[data-testid="color-indicator"]');
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');

    // Set hue to red for consistent testing
    await hueSlider.fill('0');
    await page.waitForTimeout(100);

    // Get canvas boundaries for calculations
    const canvasBox = await canvas.boundingBox();

    // Test multiple click positions across the canvas
    const testPositions = [
      { x: 50, y: 50, name: 'near top-left' },
      { x: 128, y: 64, name: 'center-left area' },
      { x: 200, y: 100, name: 'right side' },
      { x: 75, y: 180, name: 'bottom-left area' },
      { x: 180, y: 200, name: 'bottom-right area' },
      { x: 10, y: 10, name: 'very close to corner' },
      { x: 245, y: 245, name: 'near bottom-right corner' },
    ];

    for (const testPos of testPositions) {
      // Click at the test position
      await canvas.click({
        position: { x: testPos.x, y: testPos.y },
      });

      // Wait for the indicator to update
      await page.waitForTimeout(150);

      // Get the indicator's current position
      const indicatorBox = await indicator.boundingBox();

      // Calculate the indicator's center coordinates
      const indicatorCenterX = indicatorBox!.x + indicatorBox!.width / 2;
      const indicatorCenterY = indicatorBox!.y + indicatorBox!.height / 2;

      // Calculate the expected position (canvas position + click offset)
      const expectedX = canvasBox!.x + testPos.x;
      const expectedY = canvasBox!.y + testPos.y;

      // Verify the indicator center is positioned exactly where we clicked
      // Allow 4px tolerance for precision (accounts for browser sub-pixel rendering)
      const xDiff = Math.abs(indicatorCenterX - expectedX);
      const yDiff = Math.abs(indicatorCenterY - expectedY);

      expect(xDiff).toBeLessThan(4); // Allow up to 4px tolerance
      expect(yDiff).toBeLessThan(4); // Allow up to 4px tolerance      // Log position for debugging if needed
      console.log(
        `${testPos.name}: clicked(${testPos.x},${
          testPos.y
        }) -> indicator center(${Math.round(
          indicatorCenterX - canvasBox!.x
        )},${Math.round(indicatorCenterY - canvasBox!.y)}) diff(${Math.round(
          xDiff
        )},${Math.round(yDiff)})`
      );
    }
  });

  test('should maintain precise click-to-center positioning at canvas edges', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const indicator = page.locator('[data-testid="color-indicator"]');
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');

    // Set hue to red for consistent testing
    await hueSlider.fill('0');
    await page.waitForTimeout(100);

    const canvasBox = await canvas.boundingBox();

    // Test edge positions where the indicator should extend outside canvas
    const edgePositions = [
      { x: 0, y: 0, name: 'exact top-left corner' },
      { x: 255, y: 0, name: 'exact top-right corner' },
      { x: 0, y: 255, name: 'exact bottom-left corner' },
      { x: 255, y: 255, name: 'exact bottom-right corner' },
      { x: 0, y: 128, name: 'left edge center' },
      { x: 255, y: 128, name: 'right edge center' },
      { x: 128, y: 0, name: 'top edge center' },
      { x: 128, y: 255, name: 'bottom edge center' },
    ];

    for (const edgePos of edgePositions) {
      await canvas.click({
        position: { x: edgePos.x, y: edgePos.y },
      });

      await page.waitForTimeout(150);

      const indicatorBox = await indicator.boundingBox();
      const indicatorCenterX = indicatorBox!.x + indicatorBox!.width / 2;
      const indicatorCenterY = indicatorBox!.y + indicatorBox!.height / 2;

      const expectedX = canvasBox!.x + edgePos.x;
      const expectedY = canvasBox!.y + edgePos.y;

      const xDiff = Math.abs(indicatorCenterX - expectedX);
      const yDiff = Math.abs(indicatorCenterY - expectedY);

      // Edge positions should still have precise center positioning
      expect(xDiff).toBeLessThan(3);
      expect(yDiff).toBeLessThan(3);

      // Verify the diamond extends outside canvas when at edges
      if (edgePos.x === 0) {
        // Left edge: indicator should extend left of canvas
        expect(indicatorBox!.x).toBeLessThan(canvasBox!.x);
      }
      if (edgePos.x === 255) {
        // Right edge: indicator should extend right of canvas
        expect(indicatorBox!.x + indicatorBox!.width).toBeGreaterThan(
          canvasBox!.x + canvasBox!.width
        );
      }
      if (edgePos.y === 0) {
        // Top edge: indicator should extend above canvas
        expect(indicatorBox!.y).toBeLessThan(canvasBox!.y);
      }
      if (edgePos.y === 255) {
        // Bottom edge: indicator should extend below canvas
        expect(indicatorBox!.y + indicatorBox!.height).toBeGreaterThan(
          canvasBox!.y + canvasBox!.height
        );
      }

      console.log(
        `${edgePos.name}: clicked(${edgePos.x},${
          edgePos.y
        }) -> center(${Math.round(
          indicatorCenterX - canvasBox!.x
        )},${Math.round(indicatorCenterY - canvasBox!.y)}) diff(${Math.round(
          xDiff
        )},${Math.round(yDiff)})`
      );
    }
  });
});
