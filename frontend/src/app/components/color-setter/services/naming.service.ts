/**
 * Naming Service
 *
 * Provides human-readable color name matching using Delta-E 2000 perceptual distance.
 * Uses LRU cache for performance optimization of repeated lookups.
 *
 * @module NamingService
 */

import { Injectable } from '@angular/core';
import Color from 'colorjs.io';
import {
  ColorName,
  ColorNameConfig,
  DEFAULT_COLOR_NAME_CONFIG,
} from '../models/color-name.model';
import { COLOR_NAMES_DATABASE } from '../data/color-names.data';

/**
 * LRU Cache Entry for color name lookups
 */
interface CacheEntry {
  key: string;
  value: ColorName;
  timestamp: number;
}

/**
 * Service for matching colors to human-readable names using Delta-E distance
 *
 * Features:
 * - Delta-E 2000 perceptual color matching
 * - Confidence scoring (0-1) based on distance
 * - LRU cache (default size: 50) for performance
 * - Configurable matching thresholds
 *
 * @class NamingService
 * @injectable
 */
@Injectable({
  providedIn: 'root',
})
export class NamingService {
  private config: ColorNameConfig = DEFAULT_COLOR_NAME_CONFIG;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheKeys: string[] = [];

  constructor() {}

  /**
   * Configure naming service parameters
   *
   * @param config - Partial configuration to override defaults
   */
  configure(config: Partial<ColorNameConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get human-readable name for a color
   *
   * Returns the closest matching color name with confidence score.
   * Returns null if no match meets minimum confidence threshold.
   *
   * @param color - Color string in any format (HEX, RGB, OKLCH, etc.)
   * @returns ColorName with name, confidence, and deltaE, or null if no match
   *
   * @example
   * ```typescript
   * const name = service.getName('#FF0000');
   * // { name: 'Red', confidence: 0.95, deltaE: 2.3 }
   * ```
   */
  getName(color: string): ColorName | null {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(color);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Find closest matching name
      const result = this.findClosestName(color);

      // Cache the result if it meets confidence threshold
      if (result && result.confidence >= this.config.minConfidence) {
        this.addToCache(cacheKey, result);
        return result;
      }

      return null;
    } catch (error) {
      console.error('NamingService.getName() error:', error);
      return null;
    }
  }

  /**
   * Find closest matching color name using Delta-E 2000
   *
   * Searches all color names in database and returns the one with
   * smallest perceptual distance.
   *
   * @param color - Color string in any format
   * @returns ColorName with closest match, or null if all distances exceed maxDeltaE
   */
  findClosestName(color: string): ColorName | null {
    try {
      // Parse input color to OKLCH for comparison
      const inputColor = new Color(color).to('oklch');
      const [l, c, h] = inputColor.coords;

      let closestName: string | null = null;
      let minDeltaE = Infinity;

      // Search all color names for best match
      for (const entry of COLOR_NAMES_DATABASE) {
        // Create Color object for database entry
        const entryColor = new Color('oklch', [entry.l, entry.c, entry.h]);

        // Calculate Delta-E 2000 distance
        const deltaE = inputColor.deltaE2000(entryColor);

        // Track closest match
        if (deltaE < minDeltaE) {
          minDeltaE = deltaE;
          closestName = entry.name;
        }
      }

      // Return null if no match within threshold
      if (minDeltaE > this.config.maxDeltaE || closestName === null) {
        return null;
      }

      // Calculate confidence (1.0 = perfect match, 0.0 = at maxDeltaE threshold)
      const confidence = Math.max(0, 1 - minDeltaE / this.config.maxDeltaE);

      return {
        name: closestName,
        confidence,
        deltaE: minDeltaE,
      };
    } catch (error) {
      console.error('NamingService.findClosestName() error:', error);
      return null;
    }
  }

  /**
   * Generate cache key from color string
   *
   * Normalizes color to OKLCH hex string for consistent caching
   *
   * @param color - Color string in any format
   * @returns Normalized cache key
   */
  private getCacheKey(color: string): string {
    try {
      // Convert to OKLCH and round to 2 decimals for cache key
      const oklch = new Color(color).to('oklch');
      const [l, c, h] = oklch.coords;
      return `oklch(${l.toFixed(2)},${c.toFixed(2)},${h.toFixed(0)})`;
    } catch {
      // Fallback to original string if parsing fails
      return color.toLowerCase().trim();
    }
  }

  /**
   * Get entry from LRU cache
   *
   * @param key - Cache key
   * @returns Cached ColorName or null if not found
   */
  private getFromCache(key: string): ColorName | null {
    const entry = this.cache.get(key);
    if (entry) {
      // Update timestamp for LRU tracking
      entry.timestamp = Date.now();
      return entry.value;
    }
    return null;
  }

  /**
   * Add entry to LRU cache
   *
   * Evicts oldest entry if cache exceeds size limit
   *
   * @param key - Cache key
   * @param value - ColorName to cache
   */
  private addToCache(key: string, value: ColorName): void {
    // Check if key already exists
    if (this.cache.has(key)) {
      // Update existing entry
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.timestamp = Date.now();
      return;
    }

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.config.cacheSize) {
      this.evictOldest();
    }

    // Add new entry
    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
    });
    this.cacheKeys.push(key);
  }

  /**
   * Evict oldest entry from cache (LRU policy)
   */
  private evictOldest(): void {
    if (this.cacheKeys.length === 0) return;

    // Find key with oldest timestamp
    let oldestKey = this.cacheKeys[0];
    let oldestTime = this.cache.get(oldestKey)?.timestamp ?? Infinity;

    for (const key of this.cacheKeys) {
      const entry = this.cache.get(key);
      if (entry && entry.timestamp < oldestTime) {
        oldestKey = key;
        oldestTime = entry.timestamp;
      }
    }

    // Remove oldest entry
    this.cache.delete(oldestKey);
    this.cacheKeys = this.cacheKeys.filter((k) => k !== oldestKey);
  }

  /**
   * Clear all cached entries
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheKeys = [];
  }

  /**
   * Get current cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.cacheSize,
      keys: [...this.cacheKeys],
    };
  }
}
