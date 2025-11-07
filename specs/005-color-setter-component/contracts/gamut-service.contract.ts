/**
 * Gamut Service Contract
 * Version: 1.0.0
 *
 * Defines the interface for gamut checking and visualization service
 */

import { Observable } from 'rxjs';
import { IColor } from './color-service.contract';
import { GamutProfile } from './component.contract';

// ============================================================================
// Gamut Service Interface
// ============================================================================

export interface IGamutService {
  /**
   * Check if color is within specified gamut
   * @param color - Color to check
   * @param gamut - Target gamut profile
   * @returns Gamut check result
   */
  check(color: string | IColor, gamut: GamutProfile): IGamutCheckResult;

  /**
   * Clip color to nearest in-gamut equivalent
   * @param color - Color to clip
   * @param gamut - Target gamut profile
   * @returns Clipped color
   */
  clip(color: string | IColor, gamut: GamutProfile): IColor;

  /**
   * Calculate distance from gamut boundary
   * @param color - Color to measure
   * @param gamut - Target gamut profile
   * @returns Distance metric (0 = in gamut, higher = more out of gamut)
   */
  distance(color: string | IColor, gamut: GamutProfile): number;

  /**
   * Generate gradient for slider visualization
   * @param options - Gradient generation options
   * @returns CSS linear-gradient string
   */
  generateSliderGradient(options: ISliderGradientOptions): string;

  /**
   * Get all in-gamut colors along a gradient path
   * @param options - Gradient options
   * @returns Array of gradient stops with gamut status
   */
  getGradientStops(options: ISliderGradientOptions): IGradientStop[];

  /**
   * Get supported gamut profiles
   * @returns Array of gamut profile definitions
   */
  getSupportedGamuts(): IGamutDefinition[];

  /**
   * Get gamut definition by profile name
   * @param gamut - Gamut profile
   * @returns Gamut definition
   */
  getGamutDefinition(gamut: GamutProfile): IGamutDefinition;
}

// ============================================================================
// Gamut Check Result
// ============================================================================

export interface IGamutCheckResult {
  /**
   * Whether color is within gamut
   */
  inGamut: boolean;

  /**
   * Distance from gamut boundary (0 if in gamut)
   * Higher values = more out of gamut
   */
  distance: number;

  /**
   * Clipped color (nearest in-gamut equivalent)
   */
  clippedColor: IColor;

  /**
   * Warning message for out-of-gamut colors
   */
  warning?: string;

  /**
   * Gamut profile checked against
   */
  gamut: GamutProfile;

  /**
   * Original color
   */
  originalColor: IColor;
}

// ============================================================================
// Gamut Definition
// ============================================================================

export interface IGamutDefinition {
  /**
   * Gamut profile identifier
   */
  profile: GamutProfile;

  /**
   * Human-readable display name
   */
  displayName: string;

  /**
   * colorjs.io gamut identifier (null for unlimited)
   */
  colorjsGamut: string | null;

  /**
   * Description for users
   */
  description: string;

  /**
   * Approximate coverage of visible spectrum (%)
   */
  coverage: number;

  /**
   * Common devices/contexts using this gamut
   */
  devices: string[];
}

// ============================================================================
// Slider Gradient Options
// ============================================================================

export interface ISliderGradientOptions {
  /**
   * Channel being adjusted (e.g., 'l', 'c', 'h')
   */
  channel: string;

  /**
   * Color format
   */
  format: 'lch' | 'oklch' | 'lab' | 'hsl' | 'rgb';

  /**
   * Fixed channel values (channels not being adjusted)
   */
  fixedChannels: Record<string, number>;

  /**
   * Target gamut for visualization
   */
  gamut: GamutProfile;

  /**
   * Number of gradient stops
   * @default 50
   */
  steps?: number;

  /**
   * Whether to show out-of-gamut regions as transparent
   * @default true
   */
  showTransparentForOutOfGamut?: boolean;
}

// ============================================================================
// Gradient Stop
// ============================================================================

export interface IGradientStop {
  /**
   * Position along slider (0-1)
   */
  position: number;

  /**
   * Color value at this position
   */
  color: IColor;

  /**
   * CSS color string (transparent if out of gamut)
   */
  cssColor: string;

  /**
   * Whether this stop is in gamut
   */
  inGamut: boolean;

  /**
   * Distance from gamut boundary (if out of gamut)
   */
  distance?: number;
}

// ============================================================================
// Gamut Comparison
// ============================================================================

export interface IGamutComparison {
  /**
   * Source gamut
   */
  source: GamutProfile;

  /**
   * Target gamut
   */
  target: GamutProfile;

  /**
   * Percentage of source gamut covered by target
   */
  coverage: number;

  /**
   * Whether target fully contains source
   */
  fullyContained: boolean;

  /**
   * Sample colors that differ between gamuts
   */
  differences: Array<{
    color: IColor;
    inSource: boolean;
    inTarget: boolean;
  }>;
}

// ============================================================================
// Gamut Visualization
// ============================================================================

export interface IGamutVisualization {
  /**
   * Generate 2D gamut boundary visualization data
   * @param gamut - Gamut profile
   * @param lightness - Fixed lightness level (0-100)
   * @returns Array of boundary points
   */
  getBoundaryPoints(
    gamut: GamutProfile,
    lightness: number
  ): Array<{ c: number; h: number }>;

  /**
   * Generate SVG path for gamut boundary
   * @param gamut - Gamut profile
   * @param lightness - Fixed lightness level
   * @returns SVG path string
   */
  getBoundarySVG(gamut: GamutProfile, lightness: number): string;
}

// ============================================================================
// Constants
// ============================================================================

export const GAMUT_DEFINITIONS: Record<GamutProfile, IGamutDefinition> = {
  srgb: {
    profile: 'srgb',
    displayName: 'sRGB',
    colorjsGamut: 'srgb',
    description: 'Standard web/monitor gamut, most compatible',
    coverage: 35,
    devices: ['Standard monitors', 'Web browsers', 'Most displays'],
  },
  'display-p3': {
    profile: 'display-p3',
    displayName: 'Display P3',
    colorjsGamut: 'p3',
    description: 'Wide gamut for modern displays',
    coverage: 50,
    devices: ['Apple devices', 'High-end monitors', 'Modern smartphones'],
  },
  unlimited: {
    profile: 'unlimited',
    displayName: 'Unlimited',
    colorjsGamut: null,
    description: 'Full theoretical color space, no restrictions',
    coverage: 100,
    devices: ['Theoretical', 'Color science research'],
  },
};
