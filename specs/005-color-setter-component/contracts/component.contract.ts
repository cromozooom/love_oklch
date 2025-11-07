/**
 * Color Setter Component Public API Contract
 * Version: 1.0.0
 *
 * Defines the public interface for the ColorSetterComponent
 */

import { EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';

// ============================================================================
// Type Definitions
// ============================================================================

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'lch' | 'oklch' | 'lab';
export type GamutProfile = 'srgb' | 'display-p3' | 'unlimited';
export type WCAGLevel = 'fail' | 'AA' | 'AAA';

// ============================================================================
// Component Inputs
// ============================================================================

export interface IColorSetterInputs {
  /**
   * Initial color value (any valid CSS color string)
   * @default '#FF0000'
   */
  initialColor?: string;

  /**
   * Initial color format to display
   * @default 'hex'
   */
  initialFormat?: ColorFormat;

  /**
   * Initial gamut profile
   * @default 'srgb'
   */
  initialGamut?: GamutProfile;

  /**
   * Available gamut profiles for user selection
   * @default ['srgb', 'display-p3', 'unlimited']
   */
  supportedGamuts?: GamutProfile[];

  /**
   * Whether to display color name
   * @default true
   */
  showColorName?: boolean;

  /**
   * Whether to display WCAG contrast panel
   * @default true
   */
  showWCAG?: boolean;

  /**
   * Enable/disable the component
   * @default false
   */
  disabled?: boolean;
}

// ============================================================================
// Component Outputs
// ============================================================================

export interface IColorSetterOutputs {
  /**
   * Emitted when the color changes (user interaction or programmatic)
   * Debounced to prevent excessive emissions during slider interactions
   */
  colorChange: EventEmitter<IColorChangeEvent>;

  /**
   * Emitted when the display format changes
   */
  formatChange: EventEmitter<ColorFormat>;

  /**
   * Emitted when the gamut profile changes
   */
  gamutChange: EventEmitter<GamutProfile>;

  /**
   * Emitted when a gamut warning occurs (color out of gamut)
   */
  gamutWarning: EventEmitter<IGamutWarning>;
}

// ============================================================================
// Event Payloads
// ============================================================================

export interface IColorChangeEvent {
  /**
   * Color value in the currently selected format
   */
  value: string;

  /**
   * Internal high-fidelity OKLCH representation
   */
  oklch: string;

  /**
   * Color in all supported formats
   */
  formats: {
    hex: string;
    rgb: string;
    hsl: string;
    lch: string;
    oklch: string;
    lab: string;
  };

  /**
   * Color name with confidence score
   */
  name: {
    name: string;
    confidence: number;
    deltaE: number;
  };

  /**
   * WCAG contrast analysis
   */
  wcag: {
    onWhite: IWCAGResult;
    onBlack: IWCAGResult;
  };

  /**
   * Gamut status for current profile
   */
  gamutStatus: {
    inGamut: boolean;
    distance?: number;
    warning?: string;
  };

  /**
   * Timestamp of change
   */
  timestamp: number;
}

export interface IWCAGResult {
  ratio: number;
  aaSmall: boolean;
  aaLarge: boolean;
  aaaSmall: boolean;
  aaaLarge: boolean;
  level: WCAGLevel;
}

export interface IGamutWarning {
  /**
   * Current gamut profile
   */
  gamut: GamutProfile;

  /**
   * Distance from gamut boundary
   */
  distance: number;

  /**
   * Warning message
   */
  message: string;

  /**
   * Suggested action for user
   */
  suggestion: string;
}

// ============================================================================
// Public Methods
// ============================================================================

export interface IColorSetterComponent {
  /**
   * Programmatically set the color
   * @param color - Valid color string (any format)
   * @returns Promise that resolves when color is set
   * @throws Error if color is invalid
   */
  setColor(color: string): Promise<void>;

  /**
   * Get the current color in specified format
   * @param format - Desired output format (defaults to current format)
   * @returns Color string in requested format
   */
  getColor(format?: ColorFormat): string;

  /**
   * Get the current color in all formats
   * @returns Object containing color in all formats
   */
  getAllFormats(): IColorChangeEvent['formats'];

  /**
   * Change the display format
   * @param format - New format to display
   */
  setFormat(format: ColorFormat): void;

  /**
   * Change the gamut profile
   * @param gamut - New gamut profile
   */
  setGamut(gamut: GamutProfile): void;

  /**
   * Reset to initial color
   */
  reset(): void;

  /**
   * Check if current color is in gamut
   * @param gamut - Gamut to check against (defaults to current gamut)
   * @returns True if color is in gamut
   */
  isInGamut(gamut?: GamutProfile): boolean;

  /**
   * Get WCAG contrast analysis
   * @returns Current WCAG analysis
   */
  getWCAGAnalysis(): IColorChangeEvent['wcag'];

  /**
   * Observable of color changes
   * Useful for reactive programming patterns
   */
  readonly color$: Observable<IColorChangeEvent>;
}

// ============================================================================
// Component State (Read-only)
// ============================================================================

export interface IColorSetterState {
  /**
   * Current color in selected format
   */
  readonly currentColor: string;

  /**
   * Current display format
   */
  readonly currentFormat: ColorFormat;

  /**
   * Current gamut profile
   */
  readonly currentGamut: GamutProfile;

  /**
   * Whether component is disabled
   */
  readonly isDisabled: boolean;

  /**
   * Whether current color is in gamut
   */
  readonly inGamut: boolean;

  /**
   * Last update timestamp
   */
  readonly lastUpdated: number;
}

// ============================================================================
// Error Types
// ============================================================================

export class InvalidColorError extends Error {
  constructor(public readonly input: string, public readonly reason: string) {
    super(`Invalid color: ${input}. Reason: ${reason}`);
    this.name = 'InvalidColorError';
  }
}

export class UnsupportedFormatError extends Error {
  constructor(public readonly format: string) {
    super(`Unsupported color format: ${format}`);
    this.name = 'UnsupportedFormatError';
  }
}

export class UnsupportedGamutError extends Error {
  constructor(public readonly gamut: string) {
    super(`Unsupported gamut profile: ${gamut}`);
    this.name = 'UnsupportedGamutError';
  }
}
