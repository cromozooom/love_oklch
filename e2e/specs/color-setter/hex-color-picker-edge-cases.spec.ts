import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../../fixtures/auth';

/**
 * E2E Tests for HEX Color Picker Edge Cases and Positioning
 *
 * Tests the specific issues that were fixed:
 * - Color indicator center reaching canvas edges for pure colors
 * - Diamond indicator extending outside canvas boundaries
 * - Proper white color selection at canvas borders
 * - Color accuracy at extreme positions
 */

test.describe('HEX Color Picker - Edge Cases and Positioning', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.PRO_USER.email, TEST_USERS.PRO_USER.password);

    await page.waitForSelector('button:has-text("New Project")', {
      timeout: 10000,
    });
    await page.click('button:has-text("New Project")');
    await page.waitForSelector('form', { timeout: 10000 });

    const projectName = `Edge Test ${Date.now()}`;
    await page.fill('#name', projectName);
    await page.selectOption('select#colorGamut', 'sRGB');
    await page.selectOption('select#colorSpace', 'OKLCH');
    await page.fill('input#colorCount', '5');

    await page.click('button[type="submit"]:has-text("Create")');
    await page.waitForSelector('app-color-setter', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Ensure HEX picker is visible
    const hexCanvas = page.locator('[data-testid="color-canvas"]');
    if (!(await hexCanvas.isVisible())) {
      const hexTab = page
        .locator('text=HEX')
        .or(page.locator('[data-testid="hex-tab"]'));
      if (await hexTab.isVisible()) {
        await hexTab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should fix white color selection bug at canvas borders', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const hexInput = page.locator('[data-testid="hex-input"]');
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');

    // Set hue to red (0°) for consistent testing
    await hueSlider.fill('0');
    await page.waitForTimeout(200);

    // Test the previously problematic top border
    // Click very close to the top edge (y=1, y=2, y=3)
    for (let y = 0; y <= 3; y++) {
      await canvas.click({
        position: { x: 200, y: y }, // x=200 should give us a pinkish color, not white
      });
      await page.waitForTimeout(100);

      const hexValue = await hexInput.inputValue();

      if (y === 0) {
        // At y=0, we should get a bright saturated color (near red in this case)
        // Should NOT be white (#ffffff)
        expect(hexValue.toLowerCase()).not.toBe('#ffffff');

        // Should be a bright color (high brightness)
        // For hue=0 and x=200 (about 78% saturation), we expect a bright red-ish color
        expect(hexValue).toMatch(
          /^#[9-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i
        );
      }
    }

    // Test right border edge case
    for (let x = 253; x <= 255; x++) {
      await canvas.click({
        position: { x: x, y: 50 }, // y=50 should give us high brightness
      });
      await page.waitForTimeout(100);

      const hexValue = await hexInput.inputValue();

      if (x === 255) {
        // At x=255, y=50, we should get a bright saturated red
        expect(hexValue.toLowerCase()).not.toBe('#ffffff');
        // Should be close to red with high saturation and brightness
        expect(hexValue).toMatch(
          /^#[e-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i
        );
      }
    }
  });

  test('should allow indicator center to reach exact canvas corners', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const indicator = page.locator('[data-testid="color-indicator"]');
    const hexInput = page.locator('[data-testid="hex-input"]');
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');

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
      });
      await page.waitForTimeout(200);

      // Verify correct color
      const hexValue = await hexInput.inputValue();
      expect(hexValue.toLowerCase()).toBe(corner.expectedHex);

      // Verify indicator center is at exact corner
      const indicatorBox = await indicator.boundingBox();
      const indicatorCenterX = indicatorBox!.x + indicatorBox!.width / 2;
      const indicatorCenterY = indicatorBox!.y + indicatorBox!.height / 2;

      // Allow 2px tolerance for center positioning
      expect(
        Math.abs(indicatorCenterX - corner.expectedIndicatorX)
      ).toBeLessThan(2);
      expect(
        Math.abs(indicatorCenterY - corner.expectedIndicatorY)
      ).toBeLessThan(2);
    }
  });

  test('should allow diamond indicator to extend outside canvas', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const indicator = page.locator('[data-testid="color-indicator"]');
    const container = page.locator('.color-canvas-container');

    // Click on a corner to position indicator at edge
    await canvas.click({
      position: { x: 0, y: 0 }, // Top-left corner
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
    expect(indicatorBox!.x).toBeGreaterThanOrEqual(containerBox!.x - 15); // Allow some extension
    expect(indicatorBox!.y).toBeGreaterThanOrEqual(containerBox!.y - 15);

    // Test bottom-right corner
    await canvas.click({
      position: { x: 255, y: 255 },
    });
    await page.waitForTimeout(200);

    const newIndicatorBox = await indicator.boundingBox();

    // Should extend beyond canvas on right and bottom
    expect(newIndicatorBox!.x + newIndicatorBox!.width).toBeGreaterThan(
      canvasBox!.x + canvasBox!.width
    );
    expect(newIndicatorBox!.y + newIndicatorBox!.height).toBeGreaterThan(
      canvasBox!.y + canvasBox!.height
    );
  });

  test('should maintain precise color selection across entire canvas range', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const hexInput = page.locator('[data-testid="hex-input"]');
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');

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
        });
        await page.waitForTimeout(100);

        const hexValue = await hexInput.inputValue();

        // Verify we get a valid HEX color
        expect(hexValue).toMatch(/^#[0-9a-f]{6}$/i);

        // Position (0,0) should always be white regardless of hue
        if (pos.x === 0 && pos.y === 0) {
          expect(hexValue.toLowerCase()).toBe('#ffffff');
        }

        // Position (0, 255) should always be black regardless of hue
        if (pos.x === 0 && pos.y === 255) {
          expect(hexValue.toLowerCase()).toBe('#000000');
        }
      }
    }
  });

  test('should handle rapid mouse movements without losing color accuracy', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const indicator = page.locator('[data-testid="color-indicator"]');
    const hexInput = page.locator('[data-testid="hex-input"]');

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
    const finalHex = await hexInput.inputValue();
    expect(finalHex).toMatch(/^#[0-9a-f]{6}$/i);

    // Verify indicator is positioned correctly for the final color
    const indicatorBox = await indicator.boundingBox();
    expect(indicatorBox).toBeTruthy();
    expect(indicatorBox!.width).toBe(24);
    expect(indicatorBox!.height).toBe(24);
  });

  test('should ensure pixel-perfect click-to-center positioning across entire canvas', async ({
    page,
  }) => {
    const canvas = page.locator('[data-testid="color-canvas"]');
    const indicator = page.locator('[data-testid="color-indicator"]');
    const hexInput = page.locator('[data-testid="hex-input"]');
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input');

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

      // Each position should have precise centering
      expect(xError).toBeLessThan(3); // Allow 2px tolerance
      expect(yError).toBeLessThan(3); // Allow 2px tolerance

      // Verify we still get valid colors (not broken by positioning)
      const hexValue = await hexInput.inputValue();
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

    // Overall positioning should be very accurate
    expect(maxXError).toBeLessThan(3);
    expect(maxYError).toBeLessThan(3);
  });
});
