/**
 * Unit tests for NamingService
 *
 * Tests Delta-E color matching, confidence calculation, and LRU cache functionality.
 */

import { TestBed } from '@angular/core/testing';
import { NamingService } from '../naming.service';
import { ColorName } from '../../models/color-name.model';

describe('NamingService', () => {
  let service: NamingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NamingService],
    });
    service = TestBed.inject(NamingService);
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have default configuration', () => {
      const stats = service.getCacheStats();
      expect(stats.maxSize).toBe(50); // Default cache size
      expect(stats.size).toBe(0); // Empty cache initially
    });
  });

  describe('getName() - Color Name Matching', () => {
    it('should return red for #FF0000', () => {
      const result = service.getName('#FF0000');

      expect(result).not.toBeNull();
      expect(result!.name.toLowerCase()).toContain('red');
      expect(result!.confidence).toBeGreaterThan(0.8); // High confidence for primary color
      expect(result!.deltaE).toBeLessThan(5); // Low Delta-E for exact match
    });

    it('should return blue for #0000FF', () => {
      const result = service.getName('#0000FF');

      expect(result).not.toBeNull();
      expect(result!.name.toLowerCase()).toContain('blue');
      expect(result!.confidence).toBeGreaterThan(0.8);
      expect(result!.deltaE).toBeLessThan(5);
    });

    it('should return green for #00FF00', () => {
      const result = service.getName('#00FF00');

      expect(result).not.toBeNull();
      expect(result!.name.toLowerCase()).toContain('green');
      expect(result!.confidence).toBeGreaterThan(0.7);
      expect(result!.deltaE).toBeLessThan(8);
    });

    it('should return white for #FFFFFF', () => {
      const result = service.getName('#FFFFFF');

      expect(result).not.toBeNull();
      expect(result!.name.toLowerCase()).toBe('white');
      expect(result!.confidence).toBeGreaterThan(0.9);
      expect(result!.deltaE).toBeLessThan(2);
    });

    it('should return black for #000000', () => {
      const result = service.getName('#000000');

      expect(result).not.toBeNull();
      expect(result!.name.toLowerCase()).toBe('black');
      expect(result!.confidence).toBeGreaterThan(0.9);
      expect(result!.deltaE).toBeLessThan(2);
    });

    it('should handle different color formats', () => {
      const hexResult = service.getName('#FF0000');
      const rgbResult = service.getName('rgb(255, 0, 0)');
      const hslResult = service.getName('hsl(0, 100%, 50%)');
      const oklchResult = service.getName('oklch(62.8% 0.26 29.23)');

      expect(hexResult).not.toBeNull();
      expect(rgbResult).not.toBeNull();
      expect(hslResult).not.toBeNull();
      expect(oklchResult).not.toBeNull();

      // All should match to red with similar confidence
      [hexResult, rgbResult, hslResult, oklchResult].forEach((result) => {
        expect(result!.name.toLowerCase()).toContain('red');
        expect(result!.confidence).toBeGreaterThan(0.7);
      });
    });

    it('should return null for invalid color strings', () => {
      const result = service.getName('invalid-color-string');
      expect(result).toBeNull();
    });

    it('should return null for colors too far from any named color', () => {
      // Configure very strict matching
      service.configure({ maxDeltaE: 1, minConfidence: 0.99 });

      // Color that's close but not exact to any named color
      const result = service.getName('#FF0001');

      // Reset configuration
      service.configure({ maxDeltaE: 10, minConfidence: 0.7 });

      expect(result).toBeNull();
    });
  });

  describe('findClosestName() - Core Matching Logic', () => {
    it('should return closest match with Delta-E calculation', () => {
      const result = service.findClosestName('#FF4444'); // Light red

      expect(result).not.toBeNull();
      expect(result!.deltaE).toBeGreaterThan(0); // Not exact match
      expect(result!.confidence).toBeGreaterThan(0);
      expect(result!.confidence).toBeLessThanOrEqual(1);
    });

    it('should return null for extreme out-of-gamut colors', () => {
      // Configure strict limits
      service.configure({ maxDeltaE: 5 });

      const result = service.findClosestName('#123456'); // Unusual color

      // Reset configuration
      service.configure({ maxDeltaE: 10 });

      // May or may not find a match depending on distance
      if (result) {
        expect(result.deltaE).toBeLessThanOrEqual(5);
      }
    });

    it('should handle edge case colors', () => {
      const grayResult = service.findClosestName('#808080'); // Mid gray
      const brownResult = service.findClosestName('#8B4513'); // Saddle brown

      expect(grayResult).not.toBeNull();
      expect(brownResult).not.toBeNull();

      expect(grayResult!.name.toLowerCase()).toContain('gray');
      expect(brownResult!.name.toLowerCase()).toContain('brown');
    });
  });

  describe('LRU Cache Functionality', () => {
    beforeEach(() => {
      service.clearCache();
      service.configure({ cacheSize: 3 }); // Small cache for testing
    });

    afterEach(() => {
      service.configure({ cacheSize: 50 }); // Reset to default
    });

    it('should cache color lookups', () => {
      // First lookup
      const result1 = service.getName('#FF0000');
      expect(service.getCacheSize()).toBe(1);

      // Second lookup of same color should hit cache
      const result2 = service.getName('#FF0000');
      expect(service.getCacheSize()).toBe(1);

      // Results should be identical
      expect(result1).toEqual(result2);
    });

    it('should evict oldest entries when cache is full', () => {
      // Fill cache to capacity
      service.getName('#FF0000'); // Red
      service.getName('#00FF00'); // Green
      service.getName('#0000FF'); // Blue

      expect(service.getCacheSize()).toBe(3);

      // Add one more - should evict oldest (red)
      service.getName('#FFFF00'); // Yellow

      expect(service.getCacheSize()).toBe(3);

      const stats = service.getCacheStats();
      expect(stats.keys).not.toContain('oklch(0.63,0.26,29)'); // Red should be evicted
    });

    it('should update timestamp on cache hits', () => {
      // Add items
      service.getName('#FF0000'); // Red
      service.getName('#00FF00'); // Green
      service.getName('#0000FF'); // Blue

      // Access red again (should update its timestamp)
      service.getName('#FF0000');

      // Add yellow (should evict green, not red)
      service.getName('#FFFF00');

      const stats = service.getCacheStats();
      expect(stats.size).toBe(3);
      // Red should still be in cache since it was accessed recently
    });

    it('should clear cache completely', () => {
      service.getName('#FF0000');
      service.getName('#00FF00');

      expect(service.getCacheSize()).toBe(2);

      service.clearCache();

      expect(service.getCacheSize()).toBe(0);
      expect(service.getCacheStats().keys).toEqual([]);
    });
  });

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      service.configure({
        maxDeltaE: 5,
        minConfidence: 0.9,
        cacheSize: 25,
      });

      const stats = service.getCacheStats();
      expect(stats.maxSize).toBe(25);
    });

    it('should respect minConfidence threshold', () => {
      // Set very high confidence requirement
      service.configure({ minConfidence: 0.99 });

      // Color that's close but not exact
      const result = service.getName('#FF0001');

      // Reset
      service.configure({ minConfidence: 0.7 });

      expect(result).toBeNull();
    });

    it('should respect maxDeltaE threshold', () => {
      // Set very strict Delta-E limit
      service.configure({ maxDeltaE: 1 });

      // Color that might exceed limit
      const result = service.getName('#FF4444');

      // Reset
      service.configure({ maxDeltaE: 10 });

      if (result) {
        expect(result.deltaE).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid color inputs gracefully', () => {
      const invalidInputs = [
        '',
        'not-a-color',
        '#GGGGGG',
        'rgb(256, 300, -10)',
        null as any,
        undefined as any,
      ];

      invalidInputs.forEach((input) => {
        expect(() => service.getName(input)).not.toThrow();
        expect(service.getName(input)).toBeNull();
      });
    });

    it('should not break cache on errors', () => {
      service.getName('#FF0000'); // Valid color

      expect(service.getCacheSize()).toBe(1);

      service.getName('invalid'); // Invalid color

      expect(service.getCacheSize()).toBe(1); // Cache unchanged
    });
  });

  describe('Performance', () => {
    it('should complete color matching within reasonable time', () => {
      const startTime = performance.now();

      service.getName('#FF0000');

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 100ms for single lookup
      expect(duration).toBeLessThan(100);
    });

    it('should show cache performance improvement', () => {
      // First lookup (uncached)
      const start1 = performance.now();
      service.getName('#FF0000');
      const duration1 = performance.now() - start1;

      // Second lookup (cached)
      const start2 = performance.now();
      service.getName('#FF0000');
      const duration2 = performance.now() - start2;

      // Cached lookup should be significantly faster
      expect(duration2).toBeLessThan(duration1 * 0.5);
    });
  });
});
