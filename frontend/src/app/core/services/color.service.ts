import { Injectable } from '@angular/core';
import Color from 'colorjs.io';

export interface OKLCHColor {
  l: number; // Lightness (0-1)
  c: number; // Chroma (0-0.5 typically)
  h: number; // Hue (0-360)
  alpha?: number; // Alpha (0-1)
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: OKLCHColor[];
}

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  /**
   * Convert hex color to OKLCH
   */
  hexToOKLCH(hex: string): OKLCHColor {
    const color = new Color(hex);
    const oklch = color.to('oklch');
    return {
      l: oklch.l || 0,
      c: oklch.c || 0,
      h: oklch.h || 0,
      alpha: oklch.alpha || 1,
    };
  }

  /**
   * Convert OKLCH to hex
   */
  oklchToHex(oklch: OKLCHColor): string {
    const color = new Color('oklch', [oklch.l, oklch.c, oklch.h]);
    if (oklch.alpha !== undefined) {
      color.alpha = oklch.alpha;
    }
    return color.toString({ format: 'hex' });
  }

  /**
   * Convert OKLCH to CSS oklch() string
   */
  oklchToCSS(oklch: OKLCHColor): string {
    const alpha = oklch.alpha !== undefined ? ` / ${oklch.alpha}` : '';
    return `oklch(${oklch.l} ${oklch.c} ${oklch.h}${alpha})`;
  }

  /**
   * Calculate color contrast ratio between two colors
   */
  getContrastRatio(color1: OKLCHColor, color2: OKLCHColor): number {
    const c1 = new Color('oklch', [color1.l, color1.c, color1.h]);
    const c2 = new Color('oklch', [color2.l, color2.c, color2.h]);

    return c1.contrast(c2, 'WCAG21');
  }

  /**
   * Check if color combination meets WCAG accessibility standards
   */
  isAccessible(
    foreground: OKLCHColor,
    background: OKLCHColor,
    level: 'AA' | 'AAA' = 'AA'
  ): boolean {
    const contrast = this.getContrastRatio(foreground, background);
    return level === 'AA' ? contrast >= 4.5 : contrast >= 7;
  }

  /**
   * Generate accessible text color for a given background
   */
  getAccessibleTextColor(backgroundColor: OKLCHColor): OKLCHColor {
    const darkText: OKLCHColor = { l: 0.1, c: 0, h: 0 };
    const lightText: OKLCHColor = { l: 0.9, c: 0, h: 0 };

    const darkContrast = this.getContrastRatio(darkText, backgroundColor);
    const lightContrast = this.getContrastRatio(lightText, backgroundColor);

    return darkContrast > lightContrast ? darkText : lightText;
  }

  /**
   * Validate OKLCH values
   */
  isValidOKLCH(color: OKLCHColor): boolean {
    return (
      color.l >= 0 &&
      color.l <= 1 &&
      color.c >= 0 &&
      color.h >= 0 &&
      color.h <= 360 &&
      (color.alpha === undefined || (color.alpha >= 0 && color.alpha <= 1))
    );
  }
}
