/**
 * Models for slider gradient visualization with gamut-aware color stops
 */

import { ColorFormat } from './format-config.model';

/**
 * Parameters for generating a slider gradient
 */
export interface SliderGradientConfig {
  /**
   * Color format (rgb, hsl, lch, oklch, lab)
   */
  format: ColorFormat;

  /**
   * Channel being adjusted (r, g, b, h, s, l, l, c, h, l, a, b)
   */
  channel: string;

  /**
   * Current color value in the specified format
   */
  currentColor: string;

  /**
   * Gamut profile to check against
   */
  gamut: string;

  /**
   * Minimum value for the channel
   */
  min: number;

  /**
   * Maximum value for the channel
   */
  max: number;

  /**
   * Number of gradient steps to generate
   */
  steps: number;
}

/**
 * A single color stop in the gradient
 */
export interface GradientStop {
  /**
   * Position in gradient (0-100%)
   */
  position: number;

  /**
   * Channel value at this position
   */
  value: number;

  /**
   * Color at this position (HEX format)
   */
  color: string;

  /**
   * Whether this color is within the target gamut
   */
  inGamut: boolean;
}

/**
 * Complete slider gradient with color stops
 */
export interface SliderGradient {
  /**
   * Array of gradient stops
   */
  stops: GradientStop[];

  /**
   * CSS gradient string for background styling
   */
  cssGradient: string;

  /**
   * Whether any stops are out of gamut
   */
  hasOutOfGamut: boolean;
}
