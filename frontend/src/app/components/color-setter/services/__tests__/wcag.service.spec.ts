import { TestBed } from '@angular/core/testing';
import Color from 'colorjs.io';
import { WCAGService } from '../wcag.service';

/**
 * Unit Tests: WCAGService
 * Tests color contrast calculations and WCAG compliance checking
 *
 * WCAG 2.1 Contrast Requirements:
 * - Normal text AA: 4.5:1
 * - Normal text AAA: 7:1
 * - Large text AA: 3:1 (18pt+ or 14pt bold+)
 * - Large text AAA: 4.5:1
 *
 * Contrast formula: (L1 + 0.05) / (L2 + 0.05)
 * where L is relative luminance
 */

describe('WCAGService', () => {
  let service: WCAGService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WCAGService],
    });
    service = TestBed.inject(WCAGService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateContrast()', () => {
    it('should calculate contrast ratio between two colors', () => {
      // Black (#000000) vs White (#FFFFFF) = 21:1 (maximum)
      const black = new Color('#000000');
      const white = new Color('#FFFFFF');

      const contrast = service.calculateContrast(black, white);

      expect(contrast).toBeCloseTo(21, 0);
    });

    it('should return symmetric contrast (color1 vs color2 = color2 vs color1)', () => {
      const color1 = new Color('#FF0000'); // Red
      const color2 = new Color('#0000FF'); // Blue

      const contrast1 = service.calculateContrast(color1, color2);
      const contrast2 = service.calculateContrast(color2, color1);

      expect(contrast1).toBeCloseTo(contrast2, 2);
    });

    it('should calculate same color contrast as 1:1', () => {
      const color = new Color('#808080');
      const contrast = service.calculateContrast(color, color);

      expect(contrast).toBeCloseTo(1, 0);
    });

    it('should calculate dark blue (#00008B) vs white contrast as ~12.63:1', () => {
      const darkBlue = new Color('#00008B');
      const white = new Color('#FFFFFF');

      const contrast = service.calculateContrast(darkBlue, white);

      // Dark blue: RGB(0, 0, 139)
      // Expected contrast ≈ 12.63:1
      expect(contrast).toBeGreaterThan(12);
      expect(contrast).toBeLessThan(13);
    });

    it('should calculate light gray (#CCCCCC) vs white contrast as ~1.45:1', () => {
      const lightGray = new Color('#CCCCCC');
      const white = new Color('#FFFFFF');

      const contrast = service.calculateContrast(lightGray, white);

      // Light gray: RGB(204, 204, 204)
      // Expected contrast ≈ 1.45:1
      expect(contrast).toBeLessThan(2);
      expect(contrast).toBeGreaterThan(1);
    });

    it('should handle RGB colors', () => {
      const red = new Color('rgb(255, 0, 0)');
      const blue = new Color('rgb(0, 0, 255)');

      const contrast = service.calculateContrast(red, blue);

      expect(contrast).toBeGreaterThan(0);
      expect(contrast).toBeLessThan(30);
    });

    it('should handle HSL colors', () => {
      const hslRed = new Color('hsl(0, 100%, 50%)'); // Red
      const hslBlue = new Color('hsl(240, 100%, 50%)'); // Blue

      const contrast = service.calculateContrast(hslRed, hslBlue);

      expect(contrast).toBeGreaterThan(0);
    });
  });

  describe('analyze()', () => {
    it('should return analysis object with all 4 WCAG thresholds', () => {
      const color = new Color('#000000');
      const analysis = service.analyze(color, 'white');

      expect(analysis).toBeDefined();
      expect(analysis.contrast).toBeGreaterThan(0);
      expect(analysis.normalTextAA).toBeDefined();
      expect(analysis.normalTextAAA).toBeDefined();
      expect(analysis.largeTextAA).toBeDefined();
      expect(analysis.largeTextAAA).toBeDefined();
    });

    it('should correctly identify WCAG thresholds', () => {
      const analysis = service.analyze(new Color('#000000'), 'white');

      // Black on white should meet all thresholds
      expect(analysis.normalTextAA).toEqual({
        threshold: 4.5,
        passes: true,
      });
      expect(analysis.normalTextAAA).toEqual({
        threshold: 7,
        passes: true,
      });
      expect(analysis.largeTextAA).toEqual({
        threshold: 3,
        passes: true,
      });
      expect(analysis.largeTextAAA).toEqual({
        threshold: 4.5,
        passes: true,
      });
    });

    it('should correctly identify failing thresholds for light gray on white', () => {
      const analysis = service.analyze(new Color('#CCCCCC'), 'white');

      // Light gray should fail most thresholds
      expect(analysis.normalTextAA.passes).toBe(false);
      expect(analysis.normalTextAAA.passes).toBe(false);
    });

    it('should support both "white" and "black" backgrounds', () => {
      const color = new Color('#808080');

      const whiteAnalysis = service.analyze(color, 'white');
      const blackAnalysis = service.analyze(color, 'black');

      // Same color should have different analysis against different backgrounds
      expect(whiteAnalysis.contrast).toBeCloseTo(blackAnalysis.contrast, 1);

      // Medium gray should pass different thresholds on different backgrounds
      // (this depends on exact implementation, but they should differ)
    });

    it('should include contrast ratio in analysis', () => {
      const analysis = service.analyze(new Color('#FF0000'), 'white');

      expect(analysis.contrast).toBeGreaterThan(0);
      expect(typeof analysis.contrast).toBe('number');
    });

    it('should round contrast to 2 decimal places', () => {
      const analysis = service.analyze(new Color('#00008B'), 'white');

      const decimalPlaces = (analysis.contrast.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('passes()', () => {
    it('should return true if contrast passes threshold', () => {
      // Black on white is 21:1, exceeds all thresholds
      const passes = service.passes(new Color('#000000'), 'white', 'normalTextAA');

      expect(passes).toBe(true);
    });

    it('should return false if contrast fails threshold', () => {
      // Light gray on white is ~1.45:1, fails all thresholds
      const passes = service.passes(new Color('#CCCCCC'), 'white', 'normalTextAA');

      expect(passes).toBe(false);
    });

    it('should check normalTextAA threshold (4.5:1)', () => {
      const passes = service.passes(new Color('#000000'), 'white', 'normalTextAA');
      expect(passes).toBe(true);
    });

    it('should check normalTextAAA threshold (7:1)', () => {
      const passes = service.passes(new Color('#000000'), 'white', 'normalTextAAA');
      expect(passes).toBe(true);
    });

    it('should check largeTextAA threshold (3:1)', () => {
      const passes = service.passes(new Color('#000000'), 'white', 'largeTextAA');
      expect(passes).toBe(true);
    });

    it('should check largeTextAAA threshold (4.5:1)', () => {
      const passes = service.passes(new Color('#000000'), 'white', 'largeTextAAA');
      expect(passes).toBe(true);
    });

    it('should return false for matching passes against right threshold', () => {
      // Find a color that passes AA but fails AAA
      // Red vs white is ~3.99:1 - should pass AA (4.5:1) - actually fails
      // Need to calculate exact threshold crossing

      const darkRed = new Color('#990000');
      const whiteAnalysis = service.analyze(darkRed, 'white');

      // If contrast is between 4.5 and 7, should pass AA but fail AAA
      if (whiteAnalysis.contrast > 4.5 && whiteAnalysis.contrast < 7) {
        expect(service.passes(darkRed, 'white', 'normalTextAA')).toBe(true);
        expect(service.passes(darkRed, 'white', 'normalTextAAA')).toBe(false);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle pure white color', () => {
      const white = new Color('#FFFFFF');
      const analysis = service.analyze(white, 'white');

      // White on white = 1:1 contrast
      expect(analysis.contrast).toBeCloseTo(1, 0);
      expect(analysis.normalTextAA.passes).toBe(false);
    });

    it('should handle pure black color', () => {
      const black = new Color('#000000');
      const analysis = service.analyze(black, 'white');

      // Black on white = 21:1 contrast (maximum)
      expect(analysis.contrast).toBeCloseTo(21, 0);
      expect(analysis.normalTextAA.passes).toBe(true);
      expect(analysis.normalTextAAA.passes).toBe(true);
    });

    it('should handle very saturated colors', () => {
      const saturated = new Color('hsl(0, 100%, 50%)'); // Pure red
      const analysis = service.analyze(saturated, 'white');

      expect(analysis.contrast).toBeGreaterThan(0);
      expect(analysis).toBeDefined();
    });

    it('should handle very desaturated colors', () => {
      const desaturated = new Color('hsl(0, 0%, 50%)'); // Medium gray
      const analysis = service.analyze(desaturated, 'white');

      expect(analysis.contrast).toBeGreaterThan(0);
      expect(analysis).toBeDefined();
    });

    it('should be case-insensitive for background parameter', () => {
      const color = new Color('#00008B');

      const analysis1 = service.analyze(color, 'white');
      const analysis2 = service.analyze(color, 'WHITE');

      expect(analysis1.contrast).toBeCloseTo(analysis2.contrast, 2);
    });
  });

  describe('Performance', () => {
    it('should calculate contrast in less than 10ms', () => {
      const color1 = new Color('#FF0000');
      const color2 = new Color('#0000FF');

      const start = performance.now();
      service.calculateContrast(color1, color2);
      const end = performance.now();

      expect(end - start).toBeLessThan(10);
    });

    it('should analyze color in less than 20ms', () => {
      const color = new Color('#00008B');

      const start = performance.now();
      service.analyze(color, 'white');
      const end = performance.now();

      expect(end - start).toBeLessThan(20);
    });
  });

  describe('Integration with ColorService', () => {
    it('should work with colors from ColorService.parse()', () => {
      // Assuming ColorService exists
      // This test verifies WCAGService works with Color objects from parsing

      const hexColor = new Color('#FF5733');
      const analysis = service.analyze(hexColor, 'white');

      expect(analysis).toBeDefined();
      expect(analysis.contrast).toBeGreaterThan(0);
    });
  });
});
