/**
 * Color Service Contract
 * Version: 1.0.0
 *
 * Defines the interface for color conversion and manipulation service
 */

import { Observable } from 'rxjs';
import { ColorFormat } from './component.contract';

// ============================================================================
// Color Object Interface
// ============================================================================

/**
 * Represents a color in high-fidelity internal format
 * Wrapper around colorjs.io Color object
 */
export interface IColor {
  /**
   * Convert color to specified format
   * @param format - Target format
   * @returns Color string in target format
   */
  to(format: ColorFormat): string;

  /**
   * Get OKLCH representation
   * @returns OKLCH string (e.g., "oklch(62.8% 0.258 29.23)")
   */
  toOKLCH(): string;

  /**
   * Clone the color
   * @returns New color instance with same values
   */
  clone(): IColor;

  /**
   * Check equality with another color
   * @param other - Color to compare
   * @param threshold - Delta-E threshold for equality (default: 0.1)
   * @returns True if colors are perceptually equal
   */
  equals(other: IColor, threshold?: number): boolean;
}

// ============================================================================
// Color Service Interface
// ============================================================================

export interface IColorService {
  /**
   * Parse a color string into internal representation
   * @param input - Color string (any format)
   * @returns Parsed color object
   * @throws InvalidColorError if input is invalid
   */
  parse(input: string): IColor;

  /**
   * Convert color from one format to another
   * @param input - Color string in source format
   * @param sourceFormat - Source format (auto-detected if omitted)
   * @param targetFormat - Target format
   * @returns Color string in target format
   * @throws InvalidColorError if input is invalid
   */
  convert(
    input: string,
    targetFormat: ColorFormat,
    sourceFormat?: ColorFormat
  ): string;

  /**
   * Convert color to all formats
   * @param input - Color string
   * @returns Object with color in all formats
   */
  toAllFormats(input: string): Record<ColorFormat, string>;

  /**
   * Validate color string
   * @param input - Color string to validate
   * @param format - Expected format (auto-detect if omitted)
   * @returns Validation result with error message if invalid
   */
  validate(input: string, format?: ColorFormat): IColorValidationResult;

  /**
   * Clamp color values to valid range
   * @param input - Color string with potentially out-of-range values
   * @param format - Color format
   * @returns Clamped color string
   */
  clamp(input: string, format: ColorFormat): string;

  /**
   * Interpolate between two colors
   * @param color1 - Start color
   * @param color2 - End color
   * @param t - Interpolation factor (0-1)
   * @param space - Color space for interpolation (default: 'oklch')
   * @returns Interpolated color
   */
  interpolate(
    color1: string,
    color2: string,
    t: number,
    space?: 'oklch' | 'lch' | 'lab'
  ): IColor;

  /**
   * Calculate Delta-E 2000 distance between two colors
   * @param color1 - First color
   * @param color2 - Second color
   * @returns Delta-E distance (0 = identical, higher = more different)
   */
  deltaE(color1: string, color2: string): number;

  /**
   * Get readable channel values for a color in given format
   * @param input - Color string
   * @param format - Color format
   * @returns Object with named channel values
   */
  getChannels(input: string, format: ColorFormat): IColorChannels;

  /**
   * Set specific channel value
   * @param input - Color string
   * @param format - Color format
   * @param channel - Channel name (e.g., 'l', 'c', 'h', 'r', 'g', 'b')
   * @param value - New channel value
   * @returns Updated color string
   */
  setChannel(
    input: string,
    format: ColorFormat,
    channel: string,
    value: number
  ): string;
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface IColorValidationResult {
  /**
   * Whether color is valid
   */
  valid: boolean;

  /**
   * Validated color (if valid or clamped)
   */
  color?: IColor;

  /**
   * Error message (if invalid)
   */
  error?: string;

  /**
   * Whether value was clamped to valid range
   */
  clamped: boolean;

  /**
   * Original input
   */
  input: string;
}

export interface IColorChannels {
  [channelName: string]: number;
}

// RGB format
export interface IRGBChannels extends IColorChannels {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

// HSL format
export interface IHSLChannels extends IColorChannels {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

// LCH format
export interface ILCHChannels extends IColorChannels {
  l: number; // 0-100
  c: number; // 0-150
  h: number; // 0-360
}

// OKLCH format
export interface IOKLCHChannels extends IColorChannels {
  l: number; // 0-100
  c: number; // 0-0.4
  h: number; // 0-360
}

// LAB format
export interface ILABChannels extends IColorChannels {
  l: number; // 0-100
  a: number; // -128 to 128
  b: number; // -128 to 128
}

// ============================================================================
// Channel Constraints
// ============================================================================

export interface IChannelConstraint {
  /**
   * Channel name
   */
  name: string;

  /**
   * Minimum valid value
   */
  min: number;

  /**
   * Maximum valid value
   */
  max: number;

  /**
   * Whether channel wraps (e.g., hue: 360 → 0)
   */
  wraps: boolean;

  /**
   * Validation function
   */
  validate(value: number): boolean;

  /**
   * Clamping/wrapping function
   */
  constrain(value: number): number;
}

export const CHANNEL_CONSTRAINTS: Record<
  ColorFormat,
  Record<string, IChannelConstraint>
>;
