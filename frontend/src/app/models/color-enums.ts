/**
 * Color gamut options for projects
 * Defines the range of colors that can be represented in the project
 */
export enum ColorGamut {
  SRGB = 'sRGB',
  DISPLAY_P3 = 'Display P3',
  REC2020 = 'Rec2020',
  UNLIMITED = 'Unlimited gamut',
}

/**
 * Color space options for projects
 * Defines the mathematical model used to represent colors
 */
export enum ColorSpace {
  LCH = 'LCH',
  OKLCH = 'OKLCH',
}

/**
 * Color gamut configuration with metadata
 */
export interface ColorGamutInfo {
  value: ColorGamut;
  label: string;
  description: string;
  coverage: string; // Percentage of human visible colors
  recommendation: string;
}

/**
 * Color space configuration with metadata
 */
export interface ColorSpaceInfo {
  value: ColorSpace;
  label: string;
  description: string;
  perceptualUniformity: 'good' | 'excellent';
  recommendation: string;
}

/**
 * Complete color gamut information
 */
export const COLOR_GAMUT_INFO: Record<ColorGamut, ColorGamutInfo> = {
  [ColorGamut.SRGB]: {
    value: ColorGamut.SRGB,
    label: 'sRGB (Standard)',
    description: 'Standard RGB color space for web and general displays',
    coverage: '~35%',
    recommendation: 'Best for web compatibility and standard displays',
  },
  [ColorGamut.DISPLAY_P3]: {
    value: ColorGamut.DISPLAY_P3,
    label: 'Display P3 (Wide Gamut)',
    description: 'Wide gamut color space for modern displays and Apple devices',
    coverage: '~45%',
    recommendation: 'Ideal for modern displays and creative work',
  },
  [ColorGamut.REC2020]: {
    value: ColorGamut.REC2020,
    label: 'Rec2020 (Ultra Wide)',
    description: 'Ultra-wide gamut standard for HDR and professional displays',
    coverage: '~75%',
    recommendation: 'For HDR content and professional color work',
  },
  [ColorGamut.UNLIMITED]: {
    value: ColorGamut.UNLIMITED,
    label: 'Unlimited Gamut',
    description: 'No gamut restrictions - full theoretical color range',
    coverage: '100%',
    recommendation: 'For experimental work and future display technologies',
  },
};

/**
 * Complete color space information
 */
export const COLOR_SPACE_INFO: Record<ColorSpace, ColorSpaceInfo> = {
  [ColorSpace.LCH]: {
    value: ColorSpace.LCH,
    label: 'LCH',
    description:
      'Lightness, Chroma, Hue - cylindrical representation of Lab color space',
    perceptualUniformity: 'good',
    recommendation:
      'Good for color manipulation with moderate perceptual uniformity',
  },
  [ColorSpace.OKLCH]: {
    value: ColorSpace.OKLCH,
    label: 'OKLCH',
    description:
      'OK Lightness, Chroma, Hue - improved perceptually uniform color space',
    perceptualUniformity: 'excellent',
    recommendation:
      'Best for precise color work with excellent perceptual uniformity',
  },
};

/**
 * Helper functions for color enums
 */
export class ColorEnumHelpers {
  /**
   * Get all color gamut options for UI dropdowns
   */
  static getColorGamutOptions(): {
    value: ColorGamut;
    label: string;
    description: string;
  }[] {
    return Object.values(COLOR_GAMUT_INFO).map((info) => ({
      value: info.value,
      label: info.label,
      description: info.description,
    }));
  }

  /**
   * Get all color space options for UI dropdowns
   */
  static getColorSpaceOptions(): {
    value: ColorSpace;
    label: string;
    description: string;
  }[] {
    return Object.values(COLOR_SPACE_INFO).map((info) => ({
      value: info.value,
      label: info.label,
      description: info.description,
    }));
  }

  /**
   * Get color gamut information by value
   */
  static getColorGamutInfo(gamut: ColorGamut): ColorGamutInfo {
    return COLOR_GAMUT_INFO[gamut];
  }

  /**
   * Get color space information by value
   */
  static getColorSpaceInfo(space: ColorSpace): ColorSpaceInfo {
    return COLOR_SPACE_INFO[space];
  }

  /**
   * Validate color gamut value
   */
  static isValidColorGamut(value: string): value is ColorGamut {
    return Object.values(ColorGamut).includes(value as ColorGamut);
  }

  /**
   * Validate color space value
   */
  static isValidColorSpace(value: string): value is ColorSpace {
    return Object.values(ColorSpace).includes(value as ColorSpace);
  }

  /**
   * Get recommended color space for a given gamut
   */
  static getRecommendedColorSpace(gamut: ColorGamut): ColorSpace {
    // OKLCH is generally recommended for its superior perceptual uniformity
    // But for sRGB compatibility, LCH might be preferred in some cases
    switch (gamut) {
      case ColorGamut.SRGB:
        return ColorSpace.LCH; // More established for web use
      case ColorGamut.DISPLAY_P3:
      case ColorGamut.UNLIMITED:
        return ColorSpace.OKLCH; // Better for wide gamut work
      default:
        return ColorSpace.OKLCH;
    }
  }

  /**
   * Get default project configuration
   */
  static getDefaultProjectConfig(): {
    colorGamut: ColorGamut;
    colorSpace: ColorSpace;
  } {
    return {
      colorGamut: ColorGamut.SRGB, // Most compatible default
      colorSpace: ColorSpace.OKLCH, // Best perceptual uniformity
    };
  }
}
