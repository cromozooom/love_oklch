/**
 * Supported color formats for the Color Setter Component
 */
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab';

/**
 * Configuration for how a specific color format is displayed and controlled
 */
export interface FormatConfig {
  /**
   * Format identifier
   */
  format: ColorFormat;

  /**
   * Human-readable display name for UI
   */
  displayName: string;

  /**
   * Channel definitions for this format (controls, ranges, etc.)
   */
  channels: ChannelDefinition[];

  /**
   * Input control type (text for single input, range for sliders)
   */
  inputType: 'text' | 'range';

  /**
   * Whether gamut warnings apply to this format
   * (true for LCH, OKLCH, LAB; false for HEX, RGB, HSL)
   */
  hasGamutWarnings: boolean;
}

/**
 * Definition of a single channel (e.g., Red, Green, Blue in RGB)
 */
export interface ChannelDefinition {
  /**
   * Short channel name (e.g., 'L', 'C', 'H', 'R', 'G', 'B')
   */
  name: string;

  /**
   * Full descriptive label for display
   */
  label: string;

  /**
   * Minimum valid value for this channel
   */
  min: number;

  /**
   * Maximum valid value for this channel
   */
  max: number;

  /**
   * Step increment for range inputs
   */
  step: number;

  /**
   * Unit suffix (e.g., '%', '°', '')
   */
  unit: string;
}

/**
 * Format configurations for all supported color formats
 * Defines how each format is displayed, validated, and controlled in the UI
 */
export const FORMAT_CONFIGS: Record<ColorFormat, FormatConfig> = {
  hex: {
    format: 'hex',
    displayName: 'HEX',
    channels: [], // Single text input, no channel breakdown
    inputType: 'text',
    hasGamutWarnings: false,
  },
  rgb: {
    format: 'rgb',
    displayName: 'RGB',
    channels: [
      { name: 'R', label: 'Red', min: 0, max: 255, step: 1, unit: '' },
      { name: 'G', label: 'Green', min: 0, max: 255, step: 1, unit: '' },
      { name: 'B', label: 'Blue', min: 0, max: 255, step: 1, unit: '' },
    ],
    inputType: 'range',
    hasGamutWarnings: false,
  },
  hsl: {
    format: 'hsl',
    displayName: 'HSL',
    channels: [
      { name: 'H', label: 'Hue', min: 0, max: 360, step: 1, unit: '°' },
      { name: 'S', label: 'Saturation', min: 0, max: 100, step: 1, unit: '%' },
      { name: 'L', label: 'Lightness', min: 0, max: 100, step: 1, unit: '%' },
    ],
    inputType: 'range',
    hasGamutWarnings: false,
  },
  lch: {
    format: 'lch',
    displayName: 'LCH',
    channels: [
      { name: 'L', label: 'Lightness', min: 0, max: 100, step: 0.5, unit: '%' },
      { name: 'C', label: 'Chroma', min: 0, max: 150, step: 0.5, unit: '' },
      { name: 'H', label: 'Hue', min: 0, max: 360, step: 1, unit: '°' },
    ],
    inputType: 'range',
    hasGamutWarnings: true,
  },
  oklch: {
    format: 'oklch',
    displayName: 'OKLCH',
    channels: [
      { name: 'L', label: 'Lightness', min: 0, max: 100, step: 0.5, unit: '%' },
      { name: 'C', label: 'Chroma', min: 0, max: 0.4, step: 0.001, unit: '' },
      { name: 'H', label: 'Hue', min: 0, max: 360, step: 1, unit: '°' },
    ],
    inputType: 'range',
    hasGamutWarnings: true,
  },
  lab: {
    format: 'lab',
    displayName: 'LAB',
    channels: [
      { name: 'L', label: 'Lightness', min: 0, max: 100, step: 0.5, unit: '%' },
      {
        name: 'A',
        label: 'A (green-red)',
        min: -128,
        max: 128,
        step: 1,
        unit: '',
      },
      {
        name: 'B',
        label: 'B (blue-yellow)',
        min: -128,
        max: 128,
        step: 1,
        unit: '',
      },
    ],
    inputType: 'range',
    hasGamutWarnings: true,
  },
};
