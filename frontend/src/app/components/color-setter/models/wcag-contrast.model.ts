/**
 * WCAG Contrast Ratio Models
 *
 * Defines interfaces for WCAG 2.1 accessibility compliance checking.
 * Supports 4 thresholds:
 * - Normal Text AA: 4.5:1
 * - Normal Text AAA: 7:1
 * - Large Text AA: 3:1
 * - Large Text AAA: 4.5:1
 */

/**
 * Result of a contrast calculation between two colors
 * Models the contrast ratio and AA/AAA compliance for a single background
 */
export interface WCAGResult {
  /** The contrast ratio (luminance-based, 1:1 to 21:1) */
  ratio: number;

  /** Pass/fail for normal text AA (4.5:1) */
  normalAA: boolean;

  /** Pass/fail for normal text AAA (7:1) */
  normalAAA: boolean;

  /** Pass/fail for large text AA (3:1) */
  largeAA: boolean;

  /** Pass/fail for large text AAA (4.5:1) */
  largeAAA: boolean;
}

/**
 * Complete WCAG analysis for a color
 * Includes contrast calculations against both white and black backgrounds
 */
export interface WCAGAnalysis {
  /** Contrast against white background (#FFFFFF) */
  whiteBackground: WCAGResult;

  /** Contrast against black background (#000000) */
  blackBackground: WCAGResult;

  /** Overall AA compliance (passes any threshold) */
  passesAA: boolean;

  /** Overall AAA compliance (passes any threshold) */
  passesAAA: boolean;
}
