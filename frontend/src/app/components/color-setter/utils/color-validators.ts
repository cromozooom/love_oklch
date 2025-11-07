import { ColorFormat, FORMAT_CONFIGS } from '../models/format-config.model';

/**
 * ColorValidators provides utility functions for validating color inputs
 * and clamping values to valid ranges for each color format.
 *
 * Validation strategy: "Silent clamping"
 * - Invalid values are automatically adjusted to nearest valid value
 * - No user-visible errors, ensures color is always valid
 * - Provides feedback through optional warning messages
 */
export class ColorValidators {
  /**
   * Validate and clamp a channel value to the valid range for a format
   *
   * @param value - Raw input value
   * @param format - Color format
   * @param channelIndex - Index of the channel (0-based)
   * @returns Clamped value within valid range
   */
  static clampChannelValue(
    value: number,
    format: ColorFormat,
    channelIndex: number
  ): number {
    const config = FORMAT_CONFIGS[format];

    if (channelIndex < 0 || channelIndex >= config.channels.length) {
      throw new Error(
        `Invalid channel index ${channelIndex} for format ${format} (has ${config.channels.length} channels)`
      );
    }

    const channel = config.channels[channelIndex];
    return Math.max(channel.min, Math.min(channel.max, value));
  }

  /**
   * Validate a HEX color string
   *
   * @param input - HEX color string (e.g., "#FF0000" or "FF0000")
   * @returns true if valid HEX format
   */
  static isValidHex(input: string): boolean {
    // Match 3-digit or 6-digit hex
    const hexRegex = /^#?([A-F0-9]{6}|[A-F0-9]{3})$/i;
    return hexRegex.test(input.trim());
  }

  /**
   * Normalize HEX color string (ensure it starts with #)
   *
   * @param input - HEX color string
   * @returns Normalized HEX string
   */
  static normalizeHex(input: string): string {
    const cleaned = input.trim();
    if (!cleaned.startsWith('#')) {
      return '#' + cleaned;
    }
    return cleaned.toUpperCase();
  }

  /**
   * Validate RGB color string
   *
   * @param input - RGB color string (e.g., "rgb(255, 0, 0)")
   * @returns true if valid RGB format
   */
  static isValidRgb(input: string): boolean {
    // Match rgb(R, G, B) where each value is 0-255
    const rgbRegex = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i;
    const match = input.trim().match(rgbRegex);

    if (!match) return false;

    const [, r, g, b] = match.map(Number);
    return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
  }

  /**
   * Validate HSL color string
   *
   * @param input - HSL color string (e.g., "hsl(0, 100%, 50%)")
   * @returns true if valid HSL format
   */
  static isValidHsl(input: string): boolean {
    // Match hsl(H, S%, L%) where H is 0-360, S and L are 0-100
    const hslRegex =
      /^hsl\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*\)$/i;
    const match = input.trim().match(hslRegex);

    if (!match) return false;

    const [, h, s, l] = match.map(Number);
    return h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100;
  }

  /**
   * Validate LCH color string
   *
   * @param input - LCH color string (e.g., "lch(50% 100 120)")
   * @returns true if valid LCH format
   */
  static isValidLch(input: string): boolean {
    // Match lch(L%, C, H)
    const lchRegex =
      /^lch\(\s*(\d+(?:\.\d+)?)%\s*(\d+(?:\.\d+)?)\s*(\d+(?:\.\d+)?)\s*\)$/i;
    return lchRegex.test(input.trim());
  }

  /**
   * Validate OKLCH color string
   *
   * @param input - OKLCH color string (e.g., "oklch(62.8% 0.258 29.23)")
   * @returns true if valid OKLCH format
   */
  static isValidOklch(input: string): boolean {
    // Match oklch(L%, C, H)
    const oklchRegex =
      /^oklch\(\s*(\d+(?:\.\d+)?)%\s*(\d+(?:\.\d+)?)\s*(\d+(?:\.\d+)?)\s*\)$/i;
    return oklchRegex.test(input.trim());
  }

  /**
   * Validate LAB color string
   *
   * @param input - LAB color string (e.g., "lab(50% 20 -10)")
   * @returns true if valid LAB format
   */
  static isValidLab(input: string): boolean {
    // Match lab(L%, A, B) where A and B can be negative
    const labRegex =
      /^lab\(\s*(\d+(?:\.\d+)?)%\s*(-?\d+(?:\.\d+)?)\s*(-?\d+(?:\.\d+)?)\s*\)$/i;
    return labRegex.test(input.trim());
  }

  /**
   * Validate color string for a specific format
   *
   * @param input - Color string to validate
   * @param format - Expected color format
   * @returns true if input is valid for the format
   */
  static isValidForFormat(input: string, format: ColorFormat): boolean {
    const trimmed = input.trim();

    switch (format) {
      case 'hex':
        return this.isValidHex(trimmed);
      case 'rgb':
        return this.isValidRgb(trimmed);
      case 'hsl':
        return this.isValidHsl(trimmed);
      case 'lch':
        return this.isValidLch(trimmed);
      case 'oklch':
        return this.isValidOklch(trimmed);
      case 'lab':
        return this.isValidLab(trimmed);
      default:
        return false;
    }
  }

  /**
   * Extract RGB values from RGB color string
   * Returns clamped values in 0-255 range
   *
   * @param input - RGB color string
   * @returns [R, G, B] array
   */
  static parseRgb(input: string): [number, number, number] {
    const rgbRegex = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i;
    const match = input.trim().match(rgbRegex);

    if (!match) {
      throw new Error(`Invalid RGB format: ${input}`);
    }

    const r = Math.max(0, Math.min(255, parseInt(match[1], 10)));
    const g = Math.max(0, Math.min(255, parseInt(match[2], 10)));
    const b = Math.max(0, Math.min(255, parseInt(match[3], 10)));

    return [r, g, b];
  }

  /**
   * Extract HSL values from HSL color string
   * Returns values in format: H (0-360), S (0-100), L (0-100)
   *
   * @param input - HSL color string
   * @returns [H, S, L] array
   */
  static parseHsl(input: string): [number, number, number] {
    const hslRegex = /hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/i;
    const match = input.trim().match(hslRegex);

    if (!match) {
      throw new Error(`Invalid HSL format: ${input}`);
    }

    const h = Math.max(0, Math.min(360, parseFloat(match[1])));
    const s = Math.max(0, Math.min(100, parseFloat(match[2])));
    const l = Math.max(0, Math.min(100, parseFloat(match[3])));

    return [h, s, l];
  }
}
