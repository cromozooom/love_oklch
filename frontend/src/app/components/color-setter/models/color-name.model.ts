/**
 * Color Name Models
 *
 * Defines interfaces for human-readable color naming with Delta-E matching.
 * Uses ~150 curated color names mapped to OKLCH coordinates for perceptually
 * accurate color matching.
 *
 * @module ColorNameModels
 */

/**
 * Represents a human-readable color name with confidence score
 *
 * @interface ColorName
 * @property {string} name - Human-readable color name (e.g., "Sky Blue", "Forest Green")
 * @property {number} confidence - Match confidence (0-1), based on Delta-E distance
 * @property {number} deltaE - Delta-E 2000 distance from input color to named color
 */
export interface ColorName {
  /** Human-readable color name (e.g., "Sky Blue", "Forest Green") */
  name: string;

  /** Match confidence score (0-1), where 1 = exact match, 0 = very different */
  confidence: number;

  /** Delta-E 2000 perceptual distance from input color to this named color */
  deltaE: number;
}

/**
 * Color name database entry with OKLCH coordinates
 *
 * Each entry maps a human-readable name to a specific color in OKLCH space.
 * OKLCH is used as the reference space for perceptually uniform Delta-E matching.
 *
 * @interface ColorNameEntry
 * @property {string} name - Human-readable color name
 * @property {number} l - OKLCH Lightness (0-1)
 * @property {number} c - OKLCH Chroma (0-0.4 typical, up to 0.5 for vivid colors)
 * @property {number} h - OKLCH Hue (0-360 degrees)
 * @property {string[]} [tags] - Optional category tags (e.g., "blue", "pastel", "warm")
 */
export interface ColorNameEntry {
  /** Human-readable color name (e.g., "Sky Blue", "Coral Red") */
  name: string;

  /** OKLCH Lightness: 0 (black) to 1 (white) */
  l: number;

  /** OKLCH Chroma: 0 (gray) to ~0.5 (maximum saturation) */
  c: number;

  /** OKLCH Hue: 0-360 degrees (red=30, yellow=90, green=150, cyan=210, blue=270, magenta=330) */
  h: number;

  /** Optional category tags for filtering/searching (e.g., "blue", "pastel", "warm") */
  tags?: string[];
}

/**
 * Configuration for color name matching algorithm
 *
 * @interface ColorNameConfig
 * @property {number} maxDeltaE - Maximum Delta-E distance to consider a match (default: 10)
 * @property {number} minConfidence - Minimum confidence threshold to return name (default: 0.7)
 * @property {number} cacheSize - LRU cache size for name lookups (default: 50)
 */
export interface ColorNameConfig {
  /** Maximum Delta-E distance to consider a match (higher = more lenient) */
  maxDeltaE: number;

  /** Minimum confidence threshold to return a name (0-1) */
  minConfidence: number;

  /** LRU cache size for name lookups (default: 50) */
  cacheSize: number;
}

/**
 * Default configuration for color naming
 */
export const DEFAULT_COLOR_NAME_CONFIG: ColorNameConfig = {
  maxDeltaE: 10, // Allow up to Delta-E 10 for matches
  minConfidence: 0.7, // Require 70% confidence minimum
  cacheSize: 50, // Cache last 50 lookups
};
