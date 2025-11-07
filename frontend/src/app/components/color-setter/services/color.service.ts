import Color from 'colorjs.io';
import { ColorFormat, FORMAT_CONFIGS } from '../models/format-config.model';

/**
 * ColorService provides comprehensive color conversion, validation, and manipulation
 * using colorjs.io for high-fidelity color operations across multiple color spaces.
 *
 * Core responsibilities:
 * - Parse and validate color strings from any supported format
 * - Convert colors between HEX, RGB, HSL, LCH, OKLCH, LAB
 * - Maintain color accuracy through OKLCH internal representation
 * - Clamp and validate individual color channels
 * - Support interpolation and color analysis
 */
export class ColorService {
  /**
   * Parse a color string into a colorjs.io Color object
   * Supports: HEX, RGB, HSL, LCH, OKLCH, LAB
   *
   * @param input - Color string in any supported format
   * @returns colorjs.io Color object
   * @throws Error if input cannot be parsed
   */
  parse(input: string): Color {
    try {
      // Trim whitespace and validate input
      const trimmed = input.trim();
      if (!trimmed) {
        throw new Error('Color input is empty');
      }

      // colorjs.io can parse most formats, but we'll be explicit for known formats
      const color = new Color(trimmed);

      // Validate the color was created successfully
      if (!color || !color.coords) {
        throw new Error('Failed to parse color');
      }

      return color;
    } catch (error) {
      throw new Error(`Invalid color format: ${input}`);
    }
  }

  /**
   * Convert a color to a specific format
   * Maintains internal high-fidelity representation (OKLCH)
   *
   * @param color - colorjs.io Color object
   * @param targetFormat - Target format (hex, rgb, hsl, lch, oklch, lab)
   * @returns Color string in target format
   */
  convert(color: Color, targetFormat: ColorFormat): string {
    try {
      let result: string;

      switch (targetFormat) {
        case 'hex':
          // Convert to sRGB and then to HEX
          result = color.to('srgb').toString({ format: 'hex' });
          break;

        case 'rgb':
          // RGB format: rgb(R, G, B)
          const rgb = color.to('srgb');
          const [r, g, b] = rgb.coords.map((c) =>
            Math.round(Math.max(0, Math.min(255, c * 255)))
          );
          result = `rgb(${r}, ${g}, ${b})`;
          break;

        case 'hsl':
          // HSL format: hsl(H, S%, L%)
          const hsl = color.to('hsl');
          const h = Math.round(hsl.coords[0]);
          const s = Math.round(hsl.coords[1] * 100);
          const l = Math.round(hsl.coords[2] * 100);
          result = `hsl(${h}, ${s}%, ${l}%)`;
          break;

        case 'lch':
          // LCH format: lch(L%, C, H)
          const lchColor = color.to('lch');
          const lchL = lchColor.coords[0].toFixed(2);
          const lchC = lchColor.coords[1].toFixed(2);
          const lchH = lchColor.coords[2].toFixed(2);
          result = `lch(${lchL}% ${lchC} ${lchH})`;
          break;

        case 'oklch':
          // OKLCH format: oklch(L%, C, H)
          const oklch = color.to('oklch');
          const oklchL = (oklch.coords[0] * 100).toFixed(2);
          const oklchC = oklch.coords[1].toFixed(4);
          const oklchH = oklch.coords[2].toFixed(2);
          result = `oklch(${oklchL}% ${oklchC} ${oklchH})`;
          break;

        case 'lab':
          // LAB format: lab(L%, A, B)
          const lab = color.to('lab');
          const labL = lab.coords[0].toFixed(2);
          const labA = lab.coords[1].toFixed(2);
          const labB = lab.coords[2].toFixed(2);
          result = `lab(${labL}% ${labA} ${labB})`;
          break;

        default:
          // @ts-ignore - exhaustiveness check
          throw new Error(`Unknown format: ${targetFormat}`);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to convert to ${targetFormat}: ${error}`);
    }
  }

  /**
   * Convert a color to all supported formats at once
   * Useful for displaying color in multiple formats simultaneously
   *
   * @param color - colorjs.io Color object
   * @returns Object with color represented in all 6 formats
   */
  toAllFormats(color: Color): Record<ColorFormat, string> {
    const formats: ColorFormat[] = ['hex', 'rgb', 'hsl', 'lch', 'oklch', 'lab'];
    const result: Partial<Record<ColorFormat, string>> = {};

    for (const format of formats) {
      result[format] = this.convert(color, format);
    }

    return result as Record<ColorFormat, string>;
  }

  /**
   * Get channel values for a specific format
   * Returns array of numbers for the format's channels
   *
   * @param color - colorjs.io Color object
   * @param format - Color format to get channels for
   * @returns Array of channel values
   */
  getChannels(color: Color, format: ColorFormat): number[] {
    try {
      const config = FORMAT_CONFIGS[format];

      if (format === 'hex') {
        return []; // HEX has no channels
      }

      const converted = color.to(format);
      const coords = [...converted.coords];

      // Normalize coordinates based on format expectations
      switch (format) {
        case 'rgb':
          // Convert from 0-1 range to 0-255
          return coords.map((c) => c * 255);

        case 'hsl':
          // HSL coordinates: H (0-360), S (0-1 -> 0-100), L (0-1 -> 0-100)
          return [
            coords[0], // Hue stays as-is
            coords[1] * 100, // Saturation to percentage
            coords[2] * 100, // Lightness to percentage
          ];

        case 'lch':
        case 'oklch':
        case 'lab':
          // These formats store L as 0-100 already
          // OKLCH: L (0-1 -> 0-100), C, H
          if (format === 'oklch') {
            return [coords[0] * 100, coords[1], coords[2]];
          }
          // LCH and LAB: L, C/A, H/B
          return coords;

        default:
          return coords;
      }
    } catch (error) {
      throw new Error(`Failed to get channels for format ${format}: ${error}`);
    }
  }

  /**
   * Set a specific channel value for a color
   * Creates a new color with the updated channel
   *
   * @param color - colorjs.io Color object
   * @param format - Color format
   * @param channelIndex - Index of the channel to update (0-based)
   * @param value - New value for the channel
   * @returns New Color object with updated channel
   */
  setChannel(
    color: Color,
    format: ColorFormat,
    channelIndex: number,
    value: number
  ): Color {
    try {
      const converted = color.to(format);
      const coords = [...converted.coords];

      if (channelIndex < 0 || channelIndex >= coords.length) {
        throw new Error(
          `Channel index ${channelIndex} out of range for format ${format}`
        );
      }

      // Denormalize value back to 0-1 range if needed
      let normalizedValue = value;

      switch (format) {
        case 'rgb':
          // RGB: 0-255 to 0-1
          normalizedValue = value / 255;
          break;

        case 'hsl':
          // HSL: S and L are 0-100, convert to 0-1
          if (channelIndex > 0) {
            normalizedValue = value / 100;
          }
          break;

        case 'oklch':
          // OKLCH: L is 0-100, convert to 0-1
          if (channelIndex === 0) {
            normalizedValue = value / 100;
          }
          break;

        case 'lch':
        case 'lab':
          // LCH and LAB: L is already 0-100
          break;
      }

      coords[channelIndex] = normalizedValue;

      // Create new color with updated coordinates
      const newColor = new Color(format);
      (newColor.coords as any) = coords;

      return newColor;
    } catch (error) {
      throw new Error(`Failed to set channel: ${error}`);
    }
  }

  /**
   * Validate if a color string is valid
   *
   * @param input - Color string to validate
   * @returns true if valid, false otherwise
   */
  isValid(input: string): boolean {
    try {
      this.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clamp color values to valid ranges for a specific format
   * Uses silent clamping: modifies values to be within valid ranges
   *
   * @param color - colorjs.io Color object
   * @param format - Color format
   * @returns New Color object with clamped values
   */
  clamp(color: Color, format: ColorFormat): Color {
    try {
      const config = FORMAT_CONFIGS[format];
      const converted = color.to(format);
      const coords = [...converted.coords];

      // Clamp each coordinate to the format's valid range
      for (let i = 0; i < config.channels.length; i++) {
        const channel = config.channels[i];
        let value = coords[i];

        // Denormalize to format-specific range
        let min = channel.min;
        let max = channel.max;

        if (format === 'rgb') {
          value = value * 255;
          min = 0;
          max = 255;
        } else if (format === 'hsl' && i > 0) {
          value = value * 100;
          min = 0;
          max = 100;
        } else if (format === 'oklch' && i === 0) {
          value = value * 100;
          min = 0;
          max = 100;
        }

        // Clamp to range
        value = Math.max(min, Math.min(max, value));

        // Renormalize back
        if (format === 'rgb') {
          coords[i] = value / 255;
        } else if (format === 'hsl' && i > 0) {
          coords[i] = value / 100;
        } else if (format === 'oklch' && i === 0) {
          coords[i] = value / 100;
        } else {
          coords[i] = value;
        }
      }

      const clampedColor = new Color(format);
      (clampedColor.coords as any) = coords;

      return clampedColor;
    } catch (error) {
      throw new Error(`Failed to clamp color: ${error}`);
    }
  }
}
