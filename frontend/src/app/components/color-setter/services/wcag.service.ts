/**
 * WCAG Contrast Service
 *
 * Provides WCAG 2.1 accessibility compliance calculations using colorjs.io
 * for accurate contrast ratio computation between colors.
 *
 * Implements 6 compliance thresholds:
 * - Text: Normal AA (4.5:1), Normal AAA (7:1), Large AA (3:1), Large AAA (4.5:1)
 * - Graphical Objects & UI: AA (3:1), AAA (4.5:1)
 */

import { Injectable } from '@angular/core';
import Color from 'colorjs.io';
import { WCAGResult, WCAGAnalysis } from '../models/wcag-contrast.model';

@Injectable({
  providedIn: 'root',
})
export class WCAGService {
  // ===== TEXT CONTRAST THRESHOLDS =====
  private readonly NORMAL_TEXT_AA = 4.5;
  private readonly NORMAL_TEXT_AAA = 7;
  private readonly LARGE_TEXT_AA = 3;
  private readonly LARGE_TEXT_AAA = 4.5;

  // ===== GRAPHICAL OBJECTS & UI COMPONENTS THRESHOLDS =====
  private readonly GRAPHICAL_AA = 3;
  private readonly GRAPHICAL_AAA = 4.5;

  // Standard backgrounds
  private readonly WHITE = '#FFFFFF';
  private readonly BLACK = '#000000';

  /**
   * Calculate contrast ratio between two colors using relative luminance
   * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is lighter color
   *
   * @param foreground Foreground color (hex or CSS color)
   * @param background Background color (hex or CSS color)
   * @returns Contrast ratio (1:1 to 21:1)
   */
  calculateContrast(foreground: string, background: string): number {
    try {
      const fg = new Color(foreground);
      const bg = new Color(background);

      // Get relative luminance for each color
      const fgLuminance = this.getRelativeLuminance(fg);
      const bgLuminance = this.getRelativeLuminance(bg);

      // Calculate contrast: (lighter + 0.05) / (darker + 0.05)
      const lighter = Math.max(fgLuminance, bgLuminance);
      const darker = Math.min(fgLuminance, bgLuminance);

      const ratio = (lighter + 0.05) / (darker + 0.05);
      return Math.round(ratio * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error(
        `Error calculating contrast between ${foreground} and ${background}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Check if contrast passes a specific WCAG threshold
   *
   * @param ratio Contrast ratio
   * @param threshold WCAG threshold (e.g., 4.5, 7, 3)
   * @returns True if ratio >= threshold
   */
  passes(ratio: number, threshold: number): boolean {
    return ratio >= threshold;
  }

  /**
   * Analyze color for WCAG compliance against both white and black backgrounds
   *
   * @param color Color to analyze (hex or CSS color)
   * @returns WCAGAnalysis with results for both backgrounds
   */
  analyze(color: string): WCAGAnalysis {
    try {
      const whiteContrast = this.calculateContrast(color, this.WHITE);
      const blackContrast = this.calculateContrast(color, this.BLACK);

      const whiteResult: WCAGResult = {
        ratio: whiteContrast,
        normalTextAA: this.passes(whiteContrast, this.NORMAL_TEXT_AA),
        normalTextAAA: this.passes(whiteContrast, this.NORMAL_TEXT_AAA),
        largeTextAA: this.passes(whiteContrast, this.LARGE_TEXT_AA),
        largeTextAAA: this.passes(whiteContrast, this.LARGE_TEXT_AAA),
        graphicalAA: this.passes(whiteContrast, this.GRAPHICAL_AA),
        graphicalAAA: this.passes(whiteContrast, this.GRAPHICAL_AAA),
      };

      const blackResult: WCAGResult = {
        ratio: blackContrast,
        normalTextAA: this.passes(blackContrast, this.NORMAL_TEXT_AA),
        normalTextAAA: this.passes(blackContrast, this.NORMAL_TEXT_AAA),
        largeTextAA: this.passes(blackContrast, this.LARGE_TEXT_AA),
        largeTextAAA: this.passes(blackContrast, this.LARGE_TEXT_AAA),
        graphicalAA: this.passes(blackContrast, this.GRAPHICAL_AA),
        graphicalAAA: this.passes(blackContrast, this.GRAPHICAL_AAA),
      };

      // Overall compliance: passes AA if any threshold passes, same for AAA
      const passesAA =
        whiteResult.normalTextAA ||
        whiteResult.largeTextAA ||
        whiteResult.graphicalAA ||
        blackResult.normalTextAA ||
        blackResult.largeTextAA ||
        blackResult.graphicalAA;
      const passesAAA =
        whiteResult.normalTextAAA ||
        whiteResult.largeTextAAA ||
        whiteResult.graphicalAAA ||
        blackResult.normalTextAAA ||
        blackResult.largeTextAAA ||
        blackResult.graphicalAAA;

      return {
        whiteBackground: whiteResult,
        blackBackground: blackResult,
        passesAA,
        passesAAA,
      };
    } catch (error) {
      console.error(`Error analyzing color ${color}:`, error);
      return {
        whiteBackground: {
          ratio: 0,
          normalTextAA: false,
          normalTextAAA: false,
          largeTextAA: false,
          largeTextAAA: false,
          graphicalAA: false,
          graphicalAAA: false,
        },
        blackBackground: {
          ratio: 0,
          normalTextAA: false,
          normalTextAAA: false,
          largeTextAA: false,
          largeTextAAA: false,
          graphicalAA: false,
          graphicalAAA: false,
        },
        passesAA: false,
        passesAAA: false,
      };
    }
  }

  /**
   * Calculate relative luminance as per WCAG formula
   * @param color Color object
   * @returns Relative luminance value (0-1)
   */
  private getRelativeLuminance(color: Color): number {
    // Convert to sRGB for luminance calculation
    const sRGB = color.to('srgb');
    const r = this.getLuminanceChannel(sRGB.coords[0]);
    const g = this.getLuminanceChannel(sRGB.coords[1]);
    const b = this.getLuminanceChannel(sRGB.coords[2]);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calculate luminance for a single color channel
   * @param channel Channel value (0-1)
   * @returns Luminance value
   */
  private getLuminanceChannel(channel: number): number {
    const value =
      channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    return value;
  }
}
