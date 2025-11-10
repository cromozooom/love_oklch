/**
 * Unit Tests: GamutService
 *
 * Tests for gamut checking, clipping, and gradient generation.
 *
 * Coverage:
 * - T052: GamutService.check() method
 * - T053: GamutService.generateSliderGradient() method
 */

import { TestBed } from '@angular/core/testing';
import { GamutService } from '../gamut.service';
import { ColorService } from '../color.service';

describe('GamutService', () => {
  let service: GamutService;
  let colorService: ColorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GamutService, ColorService],
    });
    service = TestBed.inject(GamutService);
    colorService = TestBed.inject(ColorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('T052: check() method', () => {
    it('should detect in-gamut sRGB colors', () => {
      // Red is within sRGB
      const result = service.check('#FF0000', 'sRGB');

      expect(result.isInGamut).toBe(true);
      expect(result.gamut).toBe('sRGB');
    });

    it('should detect out-of-gamut sRGB colors', () => {
      // High chroma OKLCH color exceeds sRGB
      const result = service.check('oklch(0.7 0.4 180)', 'sRGB');

      expect(result.isInGamut).toBe(false);
      expect(result.gamut).toBe('sRGB');
    });

    it('should detect in-gamut Display P3 colors', () => {
      // Vibrant color within Display P3
      const result = service.check('oklch(0.7 0.3 180)', 'Display P3');

      expect(result.isInGamut).toBe(true);
      expect(result.gamut).toBe('Display P3');
    });

    it('should handle Unlimited gamut (always in-gamut)', () => {
      // Any color is "in-gamut" for unlimited
      const result = service.check('oklch(0.7 0.9 180)', 'Unlimited gamut');

      expect(result.isInGamut).toBe(true);
      expect(result.gamut).toBe('Unlimited gamut');
    });

    it('should provide clipped color when out-of-gamut', () => {
      const result = service.check('oklch(0.7 0.5 180)', 'sRGB');

      if (!result.isInGamut) {
        expect(result.clipped).toBeDefined();
        expect(result.clipped).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });

    it('should calculate distance from gamut boundary', () => {
      const result = service.check('oklch(0.7 0.4 180)', 'sRGB');

      if (!result.isInGamut) {
        expect(result.distance).toBeGreaterThan(0);
      }
    });
  });

  describe('T052: clip() method', () => {
    it('should return original color if in-gamut', () => {
      const inGamutColor = '#FF0000';
      const clipped = service.clip(inGamutColor, 'sRGB');

      expect(clipped).toBe(inGamutColor);
    });

    it('should clip out-of-gamut color to nearest in-gamut', () => {
      const outOfGamut = 'oklch(0.7 0.5 180)';
      const clipped = service.clip(outOfGamut, 'sRGB');

      expect(clipped).toMatch(/^#[0-9A-F]{6}$/i);

      // Clipped color should be in-gamut
      const checkResult = service.check(clipped, 'sRGB');
      expect(checkResult.isInGamut).toBe(true);
    });

    it('should preserve hue when clipping', () => {
      const outOfGamut = 'oklch(0.7 0.5 180)'; // High chroma cyan
      const clipped = service.clip(outOfGamut, 'sRGB');

      // Convert both to OKLCH to compare hues
      const originalOklch = colorService.parse(outOfGamut);
      const clippedOklch = colorService.parse(clipped);

      expect(clippedOklch.space).toBe('oklch');
      // Hue should be approximately the same (within 5 degrees)
      const hueDiff = Math.abs(
        originalOklch.coords[2] - clippedOklch.coords[2]
      );
      expect(hueDiff).toBeLessThan(5);
    });
  });

  describe('T053: generateSliderGradient() method', () => {
    it('should generate gradient with 50 steps', () => {
      const gradient = service.generateSliderGradient({
        format: 'oklch',
        channel: 'c',
        currentColor: 'oklch(0.7 0.2 180)',
        gamut: 'sRGB',
        min: 0,
        max: 0.4,
        steps: 50,
      });

      expect(gradient.stops).toHaveLength(50);
    });

    it('should mark out-of-gamut steps as invalid', () => {
      const gradient = service.generateSliderGradient({
        format: 'oklch',
        channel: 'c',
        currentColor: 'oklch(0.7 0.2 180)',
        gamut: 'sRGB',
        min: 0,
        max: 0.4,
        steps: 50,
      });

      // Some high chroma steps should be out-of-gamut
      const outOfGamutStops = gradient.stops.filter((stop) => !stop.inGamut);
      expect(outOfGamutStops.length).toBeGreaterThan(0);
    });

    it('should provide color values for each stop', () => {
      const gradient = service.generateSliderGradient({
        format: 'oklch',
        channel: 'c',
        currentColor: 'oklch(0.7 0.2 180)',
        gamut: 'sRGB',
        min: 0,
        max: 0.4,
        steps: 20,
      });

      gradient.stops.forEach((stop) => {
        expect(stop.position).toBeGreaterThanOrEqual(0);
        expect(stop.position).toBeLessThanOrEqual(100);
        expect(stop.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('should generate CSS gradient string', () => {
      const gradient = service.generateSliderGradient({
        format: 'oklch',
        channel: 'c',
        currentColor: 'oklch(0.7 0.2 180)',
        gamut: 'sRGB',
        min: 0,
        max: 0.4,
        steps: 10,
      });

      expect(gradient.cssGradient).toContain('linear-gradient');
      expect(gradient.cssGradient).toContain('to right');
    });

    it('should handle RGB channel gradients', () => {
      const gradient = service.generateSliderGradient({
        format: 'rgb',
        channel: 'r',
        currentColor: 'rgb(128, 64, 192)',
        gamut: 'sRGB',
        min: 0,
        max: 255,
        steps: 20,
      });

      expect(gradient.stops).toHaveLength(20);
      // RGB is always in sRGB gamut
      gradient.stops.forEach((stop) => {
        expect(stop.inGamut).toBe(true);
      });
    });

    it('should handle HSL channel gradients', () => {
      const gradient = service.generateSliderGradient({
        format: 'hsl',
        channel: 'h',
        currentColor: 'hsl(180, 50%, 50%)',
        gamut: 'sRGB',
        min: 0,
        max: 360,
        steps: 20,
      });

      expect(gradient.stops).toHaveLength(20);
      // HSL is always in sRGB gamut
      gradient.stops.forEach((stop) => {
        expect(stop.inGamut).toBe(true);
      });
    });

    it('should handle LCH chroma gradients with gamut limits', () => {
      const gradient = service.generateSliderGradient({
        format: 'lch',
        channel: 'c',
        currentColor: 'lch(70 50 180)',
        gamut: 'sRGB',
        min: 0,
        max: 150,
        steps: 30,
      });

      expect(gradient.stops).toHaveLength(30);

      // High chroma values should exceed sRGB
      const highChromaStops = gradient.stops.filter((stop) => stop.value > 100);
      const outOfGamutHighChroma = highChromaStops.filter(
        (stop) => !stop.inGamut
      );
      expect(outOfGamutHighChroma.length).toBeGreaterThan(0);
    });

    it('should handle LAB gradients', () => {
      const gradient = service.generateSliderGradient({
        format: 'lab',
        channel: 'a',
        currentColor: 'lab(50 20 -30)',
        gamut: 'sRGB',
        min: -128,
        max: 127,
        steps: 25,
      });

      expect(gradient.stops).toHaveLength(25);
    });

    it('should optimize gradient with reduced steps', () => {
      const gradientFull = service.generateSliderGradient({
        format: 'oklch',
        channel: 'c',
        currentColor: 'oklch(0.7 0.2 180)',
        gamut: 'sRGB',
        min: 0,
        max: 0.4,
        steps: 50,
      });

      const gradientOptimized = service.generateSliderGradient({
        format: 'oklch',
        channel: 'c',
        currentColor: 'oklch(0.7 0.2 180)',
        gamut: 'sRGB',
        min: 0,
        max: 0.4,
        steps: 20,
      });

      expect(gradientOptimized.stops.length).toBeLessThan(
        gradientFull.stops.length
      );
    });
  });

  describe('T053: getGradientStops() method', () => {
    it('should format stops with transparent regions for out-of-gamut', () => {
      const stops = service.getGradientStops({
        format: 'oklch',
        channel: 'c',
        currentColor: 'oklch(0.7 0.2 180)',
        gamut: 'sRGB',
        min: 0,
        max: 0.4,
        steps: 20,
      });

      expect(Array.isArray(stops)).toBe(true);
      expect(stops.length).toBeGreaterThan(0);
    });

    it('should create CSS color stops string', () => {
      const stops = service.getGradientStops({
        format: 'oklch',
        channel: 'c',
        currentColor: 'oklch(0.7 0.2 180)',
        gamut: 'sRGB',
        min: 0,
        max: 0.4,
        steps: 10,
      });

      const cssString = stops.join(', ');
      expect(cssString).toContain('%');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid color strings gracefully', () => {
      expect(() => {
        service.check('invalid', 'sRGB');
      }).not.toThrow();
    });

    it('should handle invalid gamut names', () => {
      const result = service.check('#FF0000', 'InvalidGamut' as any);
      expect(result).toBeDefined();
    });

    it('should handle extreme color values', () => {
      const extremeColor = 'oklch(1 1 360)';
      const result = service.check(extremeColor, 'sRGB');
      expect(result).toBeDefined();
    });

    it('should handle black and white correctly', () => {
      const black = service.check('#000000', 'sRGB');
      expect(black.isInGamut).toBe(true);

      const white = service.check('#FFFFFF', 'sRGB');
      expect(white.isInGamut).toBe(true);
    });

    it('should handle grayscale colors', () => {
      const gray = service.check('#808080', 'sRGB');
      expect(gray.isInGamut).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should check gamut quickly (< 50ms)', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        service.check(`oklch(0.7 0.${i % 10} ${i * 3.6})`, 'sRGB');
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5000); // 100 checks in < 5s (50ms average)
    });

    it('should generate gradients efficiently (< 200ms)', () => {
      const start = performance.now();

      service.generateSliderGradient({
        format: 'oklch',
        channel: 'c',
        currentColor: 'oklch(0.7 0.2 180)',
        gamut: 'sRGB',
        min: 0,
        max: 0.4,
        steps: 50,
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });
});
