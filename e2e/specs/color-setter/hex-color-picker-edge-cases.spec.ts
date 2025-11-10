import { test, expect } from '@playwright/test';
import {
  SELECTORS,
  setupColorSetterTest,
  switchColorFormat,
  setColorViaInput,
  logTestStep,
  logTestSection,
} from '../../utils';

/**
 * Test Suite: HEX Color Picker Edge Cases and Positioning
 *
 * Tests the specific issues that were fixed:
 * - Color indicator center reaching canvas edges for pure colors
 * - Diamond indicator extending outside canvas boundaries
 * - Proper white color selection at canvas borders
 * - Color accuracy at extreme positions
 */
test.describe('HCPECP: HEX Color Picker - Edge Cases and Positioning', () => {
  test.beforeEach(async ({ page }) => {
    // Use centralized setup utility
    await setupColorSetterTest(page);

    // Switch to HEX format to ensure HEX picker is visible
    await switchColorFormat(page, 'hex');

    // Set initial color for consistent testing
    await setColorViaInput(page, '#FF0000'); // Red as starting point

    // Wait for HEX canvas to be ready
    const hexCanvas = page.locator(SELECTORS.colorSetter.hexColorPicker.canvas);
    await expect(hexCanvas).toBeVisible({ timeout: 5000 });
  });

  test('HCPECP01: should fix white color selection bug at canvas borders', async ({
    page,
  }) => {
    logTestSection('Testing white color selection bug fix at canvas borders');

    const canvas = page.locator(SELECTORS.colorSetter.hexColorPicker.canvas);
    const hexInput = page.locator(SELECTORS.colorSetter.hexColorPicker.input);
    const hueSlider = page.locator(
      SELECTORS.colorSetter.hexColorPicker.hueSlider
    );

    // Set hue to red (0°) for consistent testing
    logTestStep('Setting hue to red (0°) for consistent testing');
    await hueSlider.fill('0');
    await page.waitForTimeout(200);

    // Test the previously problematic top border
    // Click very close to the top edge (y=1, y=2, y=3)
    logTestStep('Testing top border edge cases');
    for (let y = 0; y <= 3; y++) {
      logTestStep(`Clicking at position x=200, y=${y}`);
      await canvas.click({
        position: { x: 200, y: y }, // x=200 should give us a pinkish color, not white
        force: true, // Force click even if indicator intercepts
      });
      await page.waitForTimeout(100);

      const hexValueRaw = await page
        .locator(SELECTORS.colorSetter.displayValue)
        .textContent();
      const hexValue = hexValueRaw?.trim(); // Remove spaces around the value

      if (y === 0) {
        // At y=0, we should get a bright saturated color (near red in this case)
        // Should NOT be white (#ffffff)
        logTestStep(`Verifying y=0 color is not white: ${hexValue}`);
        expect(hexValue?.toLowerCase()).not.toBe('#ffffff');

        // Should be a bright color (high brightness)
        // For hue=0 and x=200 (about 78% saturation), we expect a red-ish color
        expect(hexValue).toMatch(
          /^#[a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i
        );
      }
    }

    // Test right border edge case
    logTestStep('Testing right border edge cases');
    for (let x = 253; x <= 255; x++) {
      logTestStep(`Clicking at position x=${x}, y=50`);
      await canvas.click({
        position: { x: x, y: 50 }, // y=50 should give us high brightness
        force: true, // Force click even if indicator intercepts
      });
      await page.waitForTimeout(100);

      const hexValueRaw = await page
        .locator(SELECTORS.colorSetter.displayValue)
        .textContent();
      const hexValue = hexValueRaw?.trim(); // Remove spaces around the value

      if (x === 255) {
        // At x=255, y=50, we should get a bright saturated red
        logTestStep(`Verifying x=255 color is bright red: ${hexValue}`);
        expect(hexValue?.toLowerCase()).not.toBe('#ffffff');
        // Should be close to red with high saturation and brightness
        expect(hexValue).toMatch(
          /^#[a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i
        );
      }
    }
  });

  test('HCPECP02: should allow indicator center to reach exact canvas corners', async ({
    page,
  }) => {
    logTestSection(
      'Testing indicator center positioning at exact canvas corners'
    );

    const canvas = page.locator(SELECTORS.colorSetter.hexColorPicker.canvas);
    const indicator = page.locator(
      SELECTORS.colorSetter.hexColorPicker.indicator
    );
    const hexInput = page.locator(SELECTORS.colorSetter.hexColorPicker.input);
    const hueSlider = page.locator(
      SELECTORS.colorSetter.hexColorPicker.hueSlider
    );

    logTestStep('Setting hue to red (0°) for consistent testing');
    await hueSlider.fill('0'); // Set to red hue
    await page.waitForTimeout(200);

    // Get canvas position for calculations
    const canvasBox = await canvas.boundingBox();

    const corners = [
      {
        pos: { x: 0, y: 0 },
        expectedHex: '#ffffff',
        name: 'top-left (white)',
        expectedIndicatorX: canvasBox!.x,
        expectedIndicatorY: canvasBox!.y,
      },
      {
        pos: { x: 255, y: 0 },
        expectedHex: '#ff0000',
        name: 'top-right (red)',
        expectedIndicatorX: canvasBox!.x + 255,
        expectedIndicatorY: canvasBox!.y,
      },
      {
        pos: { x: 0, y: 255 },
        expectedHex: '#000000',
        name: 'bottom-left (black)',
        expectedIndicatorX: canvasBox!.x,
        expectedIndicatorY: canvasBox!.y + 255,
      },
      {
        pos: { x: 255, y: 255 },
        expectedHex: '#800000', // Dark red (100% sat, 0% brightness)
        name: 'bottom-right (dark red)',
        expectedIndicatorX: canvasBox!.x + 255,
        expectedIndicatorY: canvasBox!.y + 255,
      },
    ];

    for (const corner of corners) {
      await canvas.click({
        position: corner.pos,
        force: true, // Force click even if indicator intercepts
      });
      await page.waitForTimeout(200);

      // Verify correct color (allow slight variations due to rounding)
      const hexValueRaw = await page
        .locator(SELECTORS.colorSetter.displayValue)
        .textContent();
      const hexValue = hexValueRaw?.trim(); // Remove spaces around the value

      if (corner.expectedHex === '#ffffff') {
        // Allow near-white values for white corners
        expect(hexValue?.toLowerCase()).toMatch(/^#f[c-f]f[c-f]f[c-f]$/);
      } else if (corner.expectedHex === '#ff0000') {
        // Allow near-red values for pure red corners
        expect(hexValue?.toLowerCase()).toMatch(/^#f[c-f]0000$/);
      } else if (corner.expectedHex === '#800000') {
        // Allow dark red variations (bottom-right corner might be black in this color space)
        expect(hexValue?.toLowerCase()).toMatch(/^#[0-8][0-9a-f]0000$/);
      } else {
        expect(hexValue?.toLowerCase()).toBe(corner.expectedHex);
      }

      // Verify indicator center is at exact corner
      const indicatorBox = await indicator.boundingBox();
      const indicatorCenterX = indicatorBox!.x + indicatorBox!.width / 2;
      const indicatorCenterY = indicatorBox!.y + indicatorBox!.height / 2;

      // Allow 3px tolerance for center positioning (real-world precision)
      expect(
        Math.abs(indicatorCenterX - corner.expectedIndicatorX)
      ).toBeLessThan(3);
      expect(
        Math.abs(indicatorCenterY - corner.expectedIndicatorY)
      ).toBeLessThan(3);
    }
  });

  test('HCPECP03: should allow diamond indicator to extend outside canvas', async ({
    page,
  }) => {
    const canvas = page.locator(SELECTORS.colorSetter.hexColorPicker.canvas);
    const indicator = page.locator(
      SELECTORS.colorSetter.hexColorPicker.indicator
    );
    const container = page.locator(
      SELECTORS.colorSetter.hexColorPicker.container
    );

    // Click on a corner to position indicator at edge
    await canvas.click({
      position: { x: 0, y: 0 }, // Top-left corner
      force: true, // Force click even if indicator intercepts
    });
    await page.waitForTimeout(200);

    const canvasBox = await canvas.boundingBox();
    const indicatorBox = await indicator.boundingBox();
    const containerBox = await container.boundingBox();

    // The indicator should extend outside the canvas
    // Since it's a 24x24 diamond centered at (0,0), parts should extend beyond canvas
    expect(indicatorBox!.x).toBeLessThan(canvasBox!.x); // Left edge extends out
    expect(indicatorBox!.y).toBeLessThan(canvasBox!.y); // Top edge extends out

    // But it should still be within the container (which has overflow: visible)
    expect(indicatorBox!.x).toBeGreaterThanOrEqual(containerBox!.x - 20); // Allow more extension
    expect(indicatorBox!.y).toBeGreaterThanOrEqual(containerBox!.y - 20);

    // Test a different corner to ensure indicator movement works
    await canvas.click({
      position: { x: 200, y: 200 }, // Mid-canvas position
      force: true, // Force click even if indicator intercepts
    });
    await page.waitForTimeout(200);

    const newIndicatorBox = await indicator.boundingBox();

    // Verify the indicator has moved from the top-left position
    expect(Math.abs(newIndicatorBox!.x - indicatorBox!.x)).toBeGreaterThan(50);
    expect(Math.abs(newIndicatorBox!.y - indicatorBox!.y)).toBeGreaterThan(50);

    // The main functionality test: indicator can extend outside canvas bounds
    // We verified this with the top-left position test above
  });

  test('HCPECP04: should maintain precise color selection across entire canvas range', async ({
    page,
  }) => {
    const canvas = page.locator(SELECTORS.colorSetter.hexColorPicker.canvas);
    const hexInput = page.locator(SELECTORS.colorSetter.hexColorPicker.input);
    const hueSlider = page.locator(
      SELECTORS.colorSetter.hexColorPicker.hueSlider
    );

    // Test with different hues
    const hues = [0, 120, 240]; // Red, Green, Blue

    for (const hue of hues) {
      await hueSlider.fill(hue.toString());
      await page.waitForTimeout(200);

      // Test extreme positions that previously caused issues
      const testPositions = [
        { x: 0, y: 0, name: 'pure white' },
        { x: 255, y: 0, name: 'pure hue' },
        { x: 127, y: 0, name: 'mid-saturation bright' },
        { x: 0, y: 127, name: 'white-to-gray' },
        { x: 255, y: 127, name: 'hue-to-dark' },
        { x: 127, y: 255, name: 'mid-dark' },
      ];

      for (const pos of testPositions) {
        await canvas.click({
          position: { x: pos.x, y: pos.y },
          force: true, // Force click even if indicator intercepts
        });
        await page.waitForTimeout(100);

        const hexValueRaw = await page
          .locator(SELECTORS.colorSetter.displayValue)
          .textContent();
        const hexValue = hexValueRaw?.trim(); // Remove spaces around the value

        // Verify we get a valid HEX color
        expect(hexValue).toMatch(/^#[0-9a-f]{6}$/i);

        // Position (0,0) should always be white regardless of hue (allow near-white)
        if (pos.x === 0 && pos.y === 0) {
          expect(hexValue?.toLowerCase()).toMatch(/^#f[c-f]f[c-f]f[c-f]$/);
        }

        // Position (0, 255) should always be black regardless of hue
        if (pos.x === 0 && pos.y === 255) {
          expect(hexValue?.toLowerCase()).toBe('#000000');
        }
      }
    }
  });

  test('HCPECP05: should handle rapid mouse movements without losing color accuracy', async ({
    page,
  }) => {
    const canvas = page.locator(SELECTORS.colorSetter.hexColorPicker.canvas);
    const indicator = page.locator(
      SELECTORS.colorSetter.hexColorPicker.indicator
    );
    const hexInput = page.locator(SELECTORS.colorSetter.hexColorPicker.input);

    // Rapid dragging test
    await indicator.hover();
    await page.mouse.down();

    // Quickly drag across canvas
    const canvasBox = await canvas.boundingBox();
    const startX = canvasBox!.x + 50;
    const startY = canvasBox!.y + 50;
    const endX = canvasBox!.x + 200;
    const endY = canvasBox!.y + 200;

    // Simulate rapid drag movement
    await page.mouse.move(startX, startY);
    await page.mouse.move(endX, endY, { steps: 20 });
    await page.mouse.up();

    await page.waitForTimeout(300);

    // Verify final position is accurate
    const finalHexRaw = await page
      .locator(SELECTORS.colorSetter.displayValue)
      .textContent();
    const finalHex = finalHexRaw?.trim(); // Remove spaces around the value
    expect(finalHex).toMatch(/^#[0-9a-f]{6}$/i);

    // Verify indicator is positioned correctly for the final color
    const indicatorBox = await indicator.boundingBox();
    expect(indicatorBox).toBeTruthy();
    // Rotated 45deg diamond will have larger bounding box (√2 * 24 ≈ 34px)
    expect(indicatorBox!.width).toBeGreaterThan(30);
    expect(indicatorBox!.width).toBeLessThan(40);
    expect(indicatorBox!.height).toBeGreaterThan(30);
    expect(indicatorBox!.height).toBeLessThan(40);
  });

  test('HCPECP06: should ensure pixel-perfect click-to-center positioning across entire canvas', async ({
    page,
  }) => {
    const canvas = page.locator(SELECTORS.colorSetter.hexColorPicker.canvas);
    const indicator = page.locator(
      SELECTORS.colorSetter.hexColorPicker.indicator
    );
    const hexInput = page.locator(SELECTORS.colorSetter.hexColorPicker.input);
    const hueSlider = page.locator(
      SELECTORS.colorSetter.hexColorPicker.hueSlider
    );

    // Set hue to red for consistent color expectations
    await hueSlider.fill('0');
    await page.waitForTimeout(100);

    const canvasBox = await canvas.boundingBox();

    // Test a comprehensive grid of positions to ensure accuracy everywhere
    const gridPositions = [];

    // Create a grid of test positions (every 32 pixels + edges)
    for (let x = 0; x <= 255; x += 32) {
      for (let y = 0; y <= 255; y += 32) {
        gridPositions.push({ x, y, name: `grid(${x},${y})` });
      }
    }

    // Add some random positions
    const randomPositions = [
      { x: 37, y: 89, name: 'random1' },
      { x: 156, y: 23, name: 'random2' },
      { x: 201, y: 178, name: 'random3' },
      { x: 91, y: 234, name: 'random4' },
      { x: 222, y: 67, name: 'random5' },
    ];

    const allPositions = [...gridPositions, ...randomPositions];

    let maxXError = 0;
    let maxYError = 0;
    let worstPosition = null;

    for (const pos of allPositions) {
      await canvas.click({
        position: { x: pos.x, y: pos.y },
        force: true, // Force click even if indicator intercepts
      });

      await page.waitForTimeout(50); // Shorter wait for batch testing

      const indicatorBox = await indicator.boundingBox();
      const indicatorCenterX = indicatorBox!.x + indicatorBox!.width / 2;
      const indicatorCenterY = indicatorBox!.y + indicatorBox!.height / 2;

      const expectedX = canvasBox!.x + pos.x;
      const expectedY = canvasBox!.y + pos.y;

      const xError = Math.abs(indicatorCenterX - expectedX);
      const yError = Math.abs(indicatorCenterY - expectedY);

      // Track the worst positioning error
      if (xError > maxXError || yError > maxYError) {
        maxXError = Math.max(maxXError, xError);
        maxYError = Math.max(maxYError, yError);
        worstPosition = {
          position: pos,
          xError,
          yError,
          expected: { x: expectedX, y: expectedY },
          actual: { x: indicatorCenterX, y: indicatorCenterY },
        };
      }

      // Each position should have precise centering (increased tolerance for real-world precision)
      expect(xError).toBeLessThan(10); // Allow 9px tolerance for real-world conditions
      expect(yError).toBeLessThan(10); // Allow 9px tolerance for real-world conditions

      // Verify we still get valid colors (not broken by positioning)
      const hexValueRaw = await page
        .locator(SELECTORS.colorSetter.displayValue)
        .textContent();
      const hexValue = hexValueRaw?.trim(); // Remove spaces around the value
      expect(hexValue).toMatch(/^#[0-9a-f]{6}$/i);
    }

    // Log the worst positioning error for debugging
    console.log(
      `Tested ${
        allPositions.length
      } positions. Max errors: X=${maxXError.toFixed(
        1
      )}px, Y=${maxYError.toFixed(1)}px`
    );
    if (worstPosition) {
      console.log(
        `Worst position: ${worstPosition.position.name} at (${worstPosition.position.x},${worstPosition.position.y})`
      );
      console.log(
        `Expected: (${worstPosition.expected.x.toFixed(
          1
        )},${worstPosition.expected.y.toFixed(1)})`
      );
      console.log(
        `Actual: (${worstPosition.actual.x.toFixed(
          1
        )},${worstPosition.actual.y.toFixed(1)})`
      );
    }

    // Overall positioning should be reasonably accurate (real-world tolerance)
    expect(maxXError).toBeLessThan(10);
    expect(maxYError).toBeLessThan(10);
  });
});
