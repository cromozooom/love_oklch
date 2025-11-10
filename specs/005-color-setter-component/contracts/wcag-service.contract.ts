/**
 * WCAG Contrast Service Contract
 * Version: 1.0.0
 *
 * Defines the interface for WCAG contrast calculation and accessibility compliance
 */

import { Observable } from 'rxjs';
import { IColor } from './color-service.contract';

// ============================================================================
// WCAG Service Interface
// ============================================================================

export interface IWCAGService {
  /**
   * Calculate contrast ratio between two colors
   * @param foreground - Foreground (text) color
   * @param background - Background color
   * @returns Contrast ratio (1-21)
   */
  calculateContrast(
    foreground: string | IColor,
    background: string | IColor
  ): number;

  /**
   * Get full WCAG compliance analysis
   * @param foreground - Foreground (text) color
   * @param background - Background color
   * @returns Complete WCAG result with all compliance levels
   */
  analyze(
    foreground: string | IColor,
    background: string | IColor
  ): IWCAGResult;

  /**
   * Check if color passes specific WCAG level
   * @param foreground - Foreground color
   * @param background - Background color
   * @param level - WCAG level to check ('AA' or 'AAA')
   * @param textSize - Text size category ('small' or 'large')
   * @returns True if passes specified level
   */
  passes(
    foreground: string | IColor,
    background: string | IColor,
    level: 'AA' | 'AAA',
    textSize: 'small' | 'large'
  ): boolean;

  /**
   * Get recommended minimum contrast ratio
   * @param level - WCAG level
   * @param textSize - Text size category
   * @returns Minimum contrast ratio required
   */
  getRequiredContrast(level: 'AA' | 'AAA', textSize: 'small' | 'large'): number;

  /**
   * Find accessible color pairings for a given color
   * @param color - Base color
   * @param options - Search options
   * @returns Array of accessible color pairs
   */
  findAccessiblePairs(
    color: string | IColor,
    options?: IAccessiblePairOptions
  ): IAccessiblePair[];

  /**
   * Suggest color adjustments to meet WCAG requirements
   * @param foreground - Current foreground color
   * @param background - Current background color
   * @param target - Target WCAG compliance
   * @returns Suggested adjusted colors
   */
  suggestAdjustments(
    foreground: string | IColor,
    background: string | IColor,
    target: IWCAGTarget
  ): IWCAGSuggestion;
}

// ============================================================================
// WCAG Result
// ============================================================================

export interface IWCAGResult {
  /**
   * Contrast ratio (1-21)
   */
  ratio: number;

  /**
   * Passes AA for small text (≥4.5:1)
   */
  aaSmall: boolean;

  /**
   * Passes AA for large text (≥3:1)
   */
  aaLarge: boolean;

  /**
   * Passes AAA for small text (≥7:1)
   */
  aaaSmall: boolean;

  /**
   * Passes AAA for large text (≥4.5:1)
   */
  aaaLarge: boolean;

  /**
   * Highest compliance level achieved
   */
  level: 'fail' | 'AA' | 'AAA';

  /**
   * Foreground color tested
   */
  foreground: IColor;

  /**
   * Background color tested
   */
  background: IColor;

  /**
   * Relative luminance of foreground (0-1)
   */
  foregroundLuminance: number;

  /**
   * Relative luminance of background (0-1)
   */
  backgroundLuminance: number;

  /**
   * Timestamp of calculation
   */
  timestamp: number;
}

// ============================================================================
// WCAG Analysis (Multiple Backgrounds)
// ============================================================================

export interface IWCAGAnalysis {
  /**
   * Contrast against white background (#FFFFFF)
   */
  onWhite: IWCAGResult;

  /**
   * Contrast against black background (#000000)
   */
  onBlack: IWCAGResult;

  /**
   * Additional custom background tests
   */
  custom?: Array<{
    background: IColor;
    result: IWCAGResult;
  }>;

  /**
   * Timestamp of analysis
   */
  calculatedAt: number;
}

// ============================================================================
// Accessible Pair Search
// ============================================================================

export interface IAccessiblePairOptions {
  /**
   * Target WCAG level
   * @default 'AA'
   */
  level?: 'AA' | 'AAA';

  /**
   * Text size category
   * @default 'small'
   */
  textSize?: 'small' | 'large';

  /**
   * Search for backgrounds (true) or foregrounds (false)
   * @default true
   */
  searchBackgrounds?: boolean;

  /**
   * Maximum number of results
   * @default 10
   */
  maxResults?: number;

  /**
   * Prefer colors similar to input color
   * @default true
   */
  preferSimilar?: boolean;

  /**
   * Allowed color categories
   */
  categories?: Array<'light' | 'dark' | 'saturated' | 'muted'>;
}

export interface IAccessiblePair {
  /**
   * Paired color (background or foreground)
   */
  color: IColor;

  /**
   * Contrast ratio with original color
   */
  contrastRatio: number;

  /**
   * WCAG compliance result
   */
  wcag: IWCAGResult;

  /**
   * Delta-E distance from original color
   */
  similarity: number;

  /**
   * Category classification
   */
  category: 'light' | 'dark' | 'saturated' | 'muted';
}

// ============================================================================
// WCAG Suggestions
// ============================================================================

export interface IWCAGTarget {
  /**
   * Target WCAG level
   */
  level: 'AA' | 'AAA';

  /**
   * Text size category
   */
  textSize: 'small' | 'large';

  /**
   * Prefer adjusting foreground (true) or background (false)
   * @default true
   */
  adjustForeground?: boolean;

  /**
   * Maximum allowed color change (Delta-E)
   * @default 10
   */
  maxDeltaE?: number;
}

export interface IWCAGSuggestion {
  /**
   * Whether suggestion found
   */
  possible: boolean;

  /**
   * Original foreground color
   */
  originalForeground: IColor;

  /**
   * Original background color
   */
  originalBackground: IColor;

  /**
   * Suggested foreground color
   */
  suggestedForeground?: IColor;

  /**
   * Suggested background color
   */
  suggestedBackground?: IColor;

  /**
   * New contrast ratio
   */
  newRatio?: number;

  /**
   * WCAG result for suggestion
   */
  wcag?: IWCAGResult;

  /**
   * Color change magnitude (Delta-E)
   */
  deltaE?: number;

  /**
   * Explanation of adjustment made
   */
  explanation?: string;

  /**
   * Alternative suggestions
   */
  alternatives?: IWCAGSuggestion[];
}

// ============================================================================
// WCAG Constants
// ============================================================================

/**
 * WCAG 2.1 contrast ratio requirements
 */
export const WCAG_RATIOS = {
  /**
   * AA level for small text (normal size)
   */
  AA_SMALL: 4.5,

  /**
   * AA level for large text (18pt+ or 14pt+ bold)
   */
  AA_LARGE: 3.0,

  /**
   * AAA level for small text
   */
  AAA_SMALL: 7.0,

  /**
   * AAA level for large text
   */
  AAA_LARGE: 4.5,
} as const;

/**
 * Text size definitions (WCAG)
 */
export const TEXT_SIZES = {
  /**
   * Large text threshold (18pt or 14pt bold)
   */
  LARGE_TEXT_THRESHOLD_PT: 18,
  LARGE_TEXT_THRESHOLD_BOLD_PT: 14,

  /**
   * Large text threshold in pixels (approximate)
   */
  LARGE_TEXT_THRESHOLD_PX: 24,
  LARGE_TEXT_THRESHOLD_BOLD_PX: 19,
} as const;

// ============================================================================
// Luminance Calculation
// ============================================================================

export interface ILuminanceService {
  /**
   * Calculate relative luminance (WCAG definition)
   * @param color - Color to calculate luminance for
   * @returns Relative luminance (0-1)
   */
  calculateLuminance(color: string | IColor): number;

  /**
   * Compare luminance of two colors
   * @param color1 - First color
   * @param color2 - Second color
   * @returns Negative if color1 darker, positive if color1 lighter, 0 if equal
   */
  compareLuminance(color1: string | IColor, color2: string | IColor): number;

  /**
   * Classify color by luminance
   * @param color - Color to classify
   * @returns Luminance category
   */
  classifyByLuminance(
    color: string | IColor
  ): 'very-dark' | 'dark' | 'medium' | 'light' | 'very-light';
}

// ============================================================================
// WCAG Compliance Report
// ============================================================================

export interface IWCAGComplianceReport {
  /**
   * Overall compliance status
   */
  compliant: boolean;

  /**
   * Highest level achieved
   */
  highestLevel: 'fail' | 'AA' | 'AAA';

  /**
   * Individual test results
   */
  tests: {
    aaSmall: { passed: boolean; ratio: number; required: number };
    aaLarge: { passed: boolean; ratio: number; required: number };
    aaaSmall: { passed: boolean; ratio: number; required: number };
    aaaLarge: { passed: boolean; ratio: number; required: number };
  };

  /**
   * Recommendations for improvement
   */
  recommendations: string[];

  /**
   * Tested colors
   */
  colors: {
    foreground: IColor;
    background: IColor;
  };

  /**
   * Report generation timestamp
   */
  generatedAt: number;
}
