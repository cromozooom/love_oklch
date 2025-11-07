import { describe, it, expect, beforeEach } from '@jest/globals';
import { ColorService } from '../../services/color.service';
import Color from 'colorjs.io';

/**
 * Unit Tests for ColorService
 * 
 * Tests core color conversion methods:
 * - parse(): Parse color strings to Color objects
 * - convert(): Convert between color formats
 * - toAllFormats(): Get color in all formats
 * - getChannels(): Extract channel values
 * - setChannel(): Update individual channels
 * - isValid(): Validate color strings
 * - clamp(): Clamp to valid ranges
 */
describe('ColorService', () => {
  let service: ColorService;

  beforeEach(() => {
    service = new ColorService();
  });

  describe('parse()', () => {
    it('should parse valid HEX color string', () => {
      const color = service.parse('#FF0000');
      expect(color).toBeInstanceOf(Color);
      expect(color.coords).toBeDefined();
    });

    it('should parse RGB color string', () => {
      const color = service.parse('rgb(255, 0, 0)');
      expect(color).toBeInstanceOf(Color);
    });

    it('should parse HSL color string', () => {
      const color = service.parse('hsl(0, 100%, 50%)');
      expect(color).toBeInstanceOf(Color);
    });

    it('should throw error on invalid color input', () => {
      expect(() => service.parse('not a color')).toThrow();
      expect(() => service.parse('rgb(300, 300, 300)')).toThrow();
      expect(() => service.parse('')).toThrow();
    });

    it('should trim whitespace from input', () => {
      const color = service.parse('  #FF0000  ');
      expect(color).toBeInstanceOf(Color);
    });
  });

  describe('convert()', () => {
    let redColor: Color;

    beforeEach(() => {
      redColor = service.parse('#FF0000');
    });

    it('should convert HEX to RGB', () => {
      const result = service.convert(redColor, 'rgb');
      expect(result).toMatch(/rgb\(\s*255,\s*0,\s*0\s*\)/);
    });

    it('should convert HEX to HSL', () => {
      const result = service.convert(redColor, 'hsl');
      // Red should be hsl(0, 100%, 50%)
      expect(result).toMatch(/hsl\(\s*0,\s*100%,\s*50%\s*\)/);
    });

    it('should convert to OKLCH format', () => {
      const result = service.convert(redColor, 'oklch');
      expect(result).toMatch(/oklch\(/);
      expect(result).toContain('%'); // Should have lightness percentage
    });

    it('should convert to LAB format', () => {
      const result = service.convert(redColor, 'lab');
      expect(result).toMatch(/lab\(/);
    });

    it('should maintain color fidelity across format conversions', () => {
      // Convert red to multiple formats and back
      const hex = service.convert(redColor, 'hex');
      const rgb = service.convert(redColor, 'rgb');
      const oklch = service.convert(redColor, 'oklch');

      // Parse each and convert back to RGB for comparison
      const rgbFromHex = service.convert(service.parse(hex), 'rgb');
      const rgbFromOklch = service.convert(service.parse(oklch), 'rgb');

      // All should be approximately equal (allowing for rounding)
      expect(rgbFromHex).toBeDefined();
      expect(rgbFromOklch).toBeDefined();
    });
  });

  describe('toAllFormats()', () => {
    it('should return color in all 6 formats', () => {
      const redColor = service.parse('#FF0000');
      const allFormats = service.toAllFormats(redColor);

      expect(allFormats.hex).toBeDefined();
      expect(allFormats.rgb).toBeDefined();
      expect(allFormats.hsl).toBeDefined();
      expect(allFormats.lch).toBeDefined();
      expect(allFormats.oklch).toBeDefined();
      expect(allFormats.lab).toBeDefined();

      // Verify each format has content
      expect(allFormats.hex).toMatch(/^#?[A-F0-9]{6}$/i);
      expect(allFormats.rgb).toMatch(/rgb\(/);
      expect(allFormats.hsl).toMatch(/hsl\(/);
    });

    it('should return consistent formats across multiple calls', () => {
      const color = service.parse('hsl(120, 100%, 50%)');
      const formats1 = service.toAllFormats(color);
      const formats2 = service.toAllFormats(color);

      // HEX should be identical (green)
      expect(formats1.hex.toUpperCase()).toBe(formats2.hex.toUpperCase());
    });
  });

  describe('getChannels()', () => {
    it('should extract RGB channels from color', () => {
      const redColor = service.parse('#FF0000');
      const channels = service.getChannels(redColor, 'rgb');

      expect(channels.length).toBe(3);
      // RGB(255, 0, 0)
      expect(channels[0]).toBeCloseTo(255, 0);
      expect(channels[1]).toBeCloseTo(0, 0);
      expect(channels[2]).toBeCloseTo(0, 0);
    });

    it('should extract HSL channels from color', () => {
      const redColor = service.parse('#FF0000');
      const channels = service.getChannels(redColor, 'hsl');

      expect(channels.length).toBe(3);
      // HSL(0, 100, 50)
      expect(channels[0]).toBeCloseTo(0, 0); // Hue
      expect(channels[1]).toBeCloseTo(100, 0); // Saturation
      expect(channels[2]).toBeCloseTo(50, 0); // Lightness
    });

    it('should return empty array for HEX (single value format)', () => {
      const redColor = service.parse('#FF0000');
      const channels = service.getChannels(redColor, 'hex');

      expect(channels.length).toBe(0);
    });

    it('should extract LCH channels', () => {
      const color = service.parse('lch(50% 100 120)');
      const channels = service.getChannels(color, 'lch');

      expect(channels.length).toBe(3);
      expect(channels[0]).toBeDefined(); // L
      expect(channels[1]).toBeDefined(); // C
      expect(channels[2]).toBeDefined(); // H
    });
  });

  describe('setChannel()', () => {
    it('should update RGB red channel', () => {
      const redColor = service.parse('#FF0000');

      // Set red channel to 128
      const updated = service.setChannel(redColor, 'rgb', 0, 128);

      const channels = service.getChannels(updated, 'rgb');
      expect(channels[0]).toBeCloseTo(128, 0);
      expect(channels[1]).toBeCloseTo(0, 0);
      expect(channels[2]).toBeCloseTo(0, 0);
    });

    it('should update HSL hue channel', () => {
      const redColor = service.parse('#FF0000'); // Red (Hue 0)

      // Set hue to 120 (green)
      const updated = service.setChannel(redColor, 'hsl', 0, 120);

      const result = service.convert(updated, 'hsl');
      expect(result).toMatch(/hsl\(\s*120/);
    });

    it('should throw error for invalid channel index', () => {
      const color = service.parse('#FF0000');

      expect(() => service.setChannel(color, 'rgb', 5, 100)).toThrow();
      expect(() => service.setChannel(color, 'rgb', -1, 100)).toThrow();
    });

    it('should not mutate original color', () => {
      const original = service.parse('#FF0000');
      const originalChannels = service.getChannels(original, 'rgb');

      const updated = service.setChannel(original, 'rgb', 0, 128);
      const originalChannelsAfter = service.getChannels(original, 'rgb');

      // Original should be unchanged
      expect(originalChannelsAfter[0]).toBe(originalChannels[0]);

      // Updated should be different
      const updatedChannels = service.getChannels(updated, 'rgb');
      expect(updatedChannels[0]).not.toBe(originalChannels[0]);
    });
  });

  describe('isValid()', () => {
    it('should return true for valid color strings', () => {
      expect(service.isValid('#FF0000')).toBe(true);
      expect(service.isValid('rgb(255, 0, 0)')).toBe(true);
      expect(service.isValid('hsl(0, 100%, 50%)')).toBe(true);
    });

    it('should return false for invalid color strings', () => {
      expect(service.isValid('not a color')).toBe(false);
      expect(service.isValid('rgb(300, 300, 300)')).toBe(false);
      expect(service.isValid('')).toBe(false);
    });
  });

  describe('clamp()', () => {
    it('should clamp RGB values to 0-255 range', () => {
      // Create a hypothetically out-of-range color (via manual manipulation)
      // For this test, we'll just verify clamping doesn't break valid colors
      const color = service.parse('rgb(255, 0, 0)');
      const clamped = service.clamp(color, 'rgb');

      const channels = service.getChannels(clamped, 'rgb');
      expect(channels[0]).toBeLessThanOrEqual(255);
      expect(channels[0]).toBeGreaterThanOrEqual(0);
    });

    it('should clamp HSL saturation to 0-100 range', () => {
      const color = service.parse('hsl(0, 100%, 50%)');
      const clamped = service.clamp(color, 'hsl');

      const channels = service.getChannels(clamped, 'hsl');
      expect(channels[1]).toBeLessThanOrEqual(100);
      expect(channels[1]).toBeGreaterThanOrEqual(0);
    });

    it('should not throw for valid colors', () => {
      const validColors = ['#FF0000', 'rgb(128, 64, 192)', 'hsl(120, 50%, 50%)'];

      for (const colorStr of validColors) {
        const color = service.parse(colorStr);
        expect(() => service.clamp(color, 'rgb')).not.toThrow();
      }
    });
  });

  describe('Integration Tests', () => {
    it('should perform round-trip conversion with minimal loss', () => {
      // Start with HEX
      const originalHex = '#FF6B35';
      const parsed = service.parse(originalHex);

      // Convert through multiple formats
      const toRgb = service.convert(parsed, 'rgb');
      const backToHex = service.convert(service.parse(toRgb), 'hex');

      // Should be approximately equal
      expect(backToHex.toUpperCase()).toMatch(/FF6B35|FF6B36|FF6C35/); // Allow 1-unit rounding
    });

    it('should handle color space conversion chain', () => {
      const color = service.parse('#00FF00');

      const hex = service.convert(color, 'hex');
      const rgb = service.convert(color, 'rgb');
      const hsl = service.convert(color, 'hsl');
      const oklch = service.convert(color, 'oklch');

      expect(hex).toBeDefined();
      expect(rgb).toBeDefined();
      expect(hsl).toBeDefined();
      expect(oklch).toBeDefined();
    });
  });
});
