import Color from 'colorjs.io';
import { ColorFormat } from './format-config.model';
import { GamutProfile } from './gamut-profile.model';

/**
 * Central representation of the current color in high-fidelity format.
 * Maintains color state with internal OKLCH representation for maximum fidelity across format conversions.
 */
export interface ColorState {
  /**
   * Internal high-fidelity representation using OKLCH color space
   * Preserves maximum color information across all format conversions
   * Always maintained as a valid colorjs.io Color object
   */
  internalValue: Color;

  /**
   * Currently selected display format (HEX, RGB, HSL, LCH, OKLCH, LAB)
   * Determines which UI controls are shown to the user
   */
  format: ColorFormat;

  /**
   * Active gamut profile for visualization and clipping
   * Determines how sliders render gamut boundaries and warnings
   */
  gamut: GamutProfile;

  /**
   * Timestamp of last update in milliseconds
   * Used for debouncing rapid color changes during slider interactions
   */
  lastUpdated: number;
}

/**
 * Invariants maintained by the ColorState:
 * - internalValue is always a valid Color object (never null/undefined)
 * - format is always one of the supported color formats
 * - gamut is always one of the defined gamut profiles
 * - lastUpdated is always a valid timestamp
 */
