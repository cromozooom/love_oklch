import { test, expect } from '@playwright/test';

test.describe('HEX Color Picker - Hue Preservation on Top Edge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="color-setter-component"]');
    
    // Switch to HEX format
    await page.click('[data-testid="format-selector-hex"]');
    await page.waitForTimeout(100);
  });

  test('should preserve hue when dragging along top edge of canvas (saturation = 0)', async ({ page }) => {
    // First, set a purple color with hue around 300-340
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input[type="range"]');
    await hueSlider.fill('320'); // Purple hue
    await page.waitForTimeout(100);
    
    // Verify the hue was set
    const initialHue = await hueSlider.inputValue();
    expect(parseInt(initialHue)).toBe(320);
    
    // Click somewhere in the middle of the canvas to set a saturated color first
    const canvas = page.locator('[data-testid="color-canvas"]');
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) throw new Error('Canvas not found');
    
    // Click in middle for saturated color
    await canvas.click({
      position: { x: canvasBox.width * 0.8, y: canvasBox.height * 0.5 }
    });
    await page.waitForTimeout(100);
    
    // Verify hue is still around 320
    const midHue = await hueSlider.inputValue();
    expect(Math.abs(parseInt(midHue) - 320)).toBeLessThanOrEqual(5);
    
    // Now drag along the top edge (saturation = 0) from left to right
    const topY = 5; // Very close to top edge
    const positions = [
      { x: canvasBox.width * 0.1, y: topY },
      { x: canvasBox.width * 0.3, y: topY },
      { x: canvasBox.width * 0.5, y: topY },
      { x: canvasBox.width * 0.7, y: topY },
      { x: canvasBox.width * 0.9, y: topY }
    ];
    
    // Test each position along the top edge
    for (const pos of positions) {
      await canvas.click({ position: pos });
      await page.waitForTimeout(50); // Small delay for update
      
      // Check that hue is preserved (should still be around 320)
      const currentHue = await hueSlider.inputValue();
      const hueValue = parseInt(currentHue);
      
      console.log(`Position x=${pos.x}, y=${pos.y}: hue=${hueValue}`);
      
      // Hue should be preserved within a small tolerance
      expect(Math.abs(hueValue - 320)).toBeLessThanOrEqual(10);
      
      // Verify we're actually at low saturation (top edge)
      // We can't directly check saturation, but we can check the color is grayish
      const colorPreview = page.locator('[data-testid="color-preview"]');
      const backgroundColor = await colorPreview.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // At saturation=0, RGB values should be close to each other (grayish)
      const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(x => parseInt(x));
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        expect(maxDiff).toBeLessThanOrEqual(20); // Should be grayish
      }
    }
  });

  test('should preserve hue during drag operation on top edge', async ({ page }) => {
    // Set purple hue
    const hueSlider = page.locator('[data-testid="hex-hue-slider"] input[type="range"]');
    await hueSlider.fill('340');
    await page.waitForTimeout(100);
    
    const canvas = page.locator('[data-testid="color-canvas"]');
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) throw new Error('Canvas not found');
    
    // Start drag from left side of top edge
    const startX = canvasBox.x + canvasBox.width * 0.1;
    const startY = canvasBox.y + 5; // Top edge
    const endX = canvasBox.x + canvasBox.width * 0.9;
    const endY = canvasBox.y + 5; // Same Y (top edge)
    
    // Perform drag operation
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    // Move across the top edge in steps
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      const currentX = startX + (endX - startX) * (i / steps);
      await page.mouse.move(currentX, startY);
      await page.waitForTimeout(20);
      
      // Check hue hasn't changed significantly during drag
      const currentHue = await hueSlider.inputValue();
      const hueValue = parseInt(currentHue);
      
      console.log(`Drag step ${i}: x=${currentX}, hue=${hueValue}`);
      expect(Math.abs(hueValue - 340)).toBeLessThanOrEqual(15);
    }
    
    await page.mouse.up();
    
    // Final check - hue should still be preserved
    const finalHue = await hueSlider.inputValue();
    expect(Math.abs(parseInt(finalHue) - 340)).toBeLessThanOrEqual(10);
  });

  test('should preserve hue for different initial hue values on top edge', async ({ page }) => {
    const testHues = [300, 320, 340, 350, 10, 30]; // Various purple/red hues
    
    for (const targetHue of testHues) {
      console.log(`Testing hue preservation for hue=${targetHue}`);
      
      // Set the target hue
      const hueSlider = page.locator('[data-testid="hex-hue-slider"] input[type="range"]');
      await hueSlider.fill(targetHue.toString());
      await page.waitForTimeout(100);
      
      // Click on top edge (saturation = 0)
      const canvas = page.locator('[data-testid="color-canvas"]');
      const canvasBox = await canvas.boundingBox();
      
      if (!canvasBox) throw new Error('Canvas not found');
      
      await canvas.click({
        position: { x: canvasBox.width * 0.5, y: 5 } // Middle of top edge
      });
      await page.waitForTimeout(50);
      
      // Verify hue is preserved
      const currentHue = await hueSlider.inputValue();
      const hueValue = parseInt(currentHue);
      
      console.log(`Target: ${targetHue}, Actual: ${hueValue}`);
      
      // Handle hue wraparound (0-360 degrees)
      let hueDiff = Math.abs(hueValue - targetHue);
      if (hueDiff > 180) {
        hueDiff = 360 - hueDiff;
      }
      
      expect(hueDiff).toBeLessThanOrEqual(10);
    }
  });
});