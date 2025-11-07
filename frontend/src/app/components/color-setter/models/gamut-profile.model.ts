/**
 * Supported gamut profiles for color visualization and clipping
 */
export type GamutProfile = 'srgb' | 'display-p3' | 'unlimited';

/**
 * Definition of a gamut profile with colorjs.io reference and metadata
 */
export interface GamutDefinition {
  /**
   * Gamut profile identifier
   */
  profile: GamutProfile;

  /**
   * Human-readable display name for UI
   */
  displayName: string;

  /**
   * colorjs.io gamut identifier (string for specific gamuts, null for unlimited)
   * Used with colorjs.io's `inGamut()` and `toGamut()` methods
   */
  colorjsGamut: string | null;

  /**
   * Description explaining the gamut to users
   */
  description: string;
}

/**
 * Gamut profile definitions for all supported profiles
 * Determines how sliders visualize gamut boundaries and which colors trigger warnings
 */
export const GAMUT_PROFILES: Record<GamutProfile, GamutDefinition> = {
  srgb: {
    profile: 'srgb',
    displayName: 'sRGB',
    colorjsGamut: 'srgb',
    description: 'Standard web/monitor gamut, most compatible',
  },
  'display-p3': {
    profile: 'display-p3',
    displayName: 'Display P3',
    colorjsGamut: 'p3',
    description: 'Wide gamut for modern displays (Apple, high-end monitors)',
  },
  unlimited: {
    profile: 'unlimited',
    displayName: 'Unlimited',
    colorjsGamut: null,
    description: 'Full theoretical color space, no gamut restrictions',
  },
};

/**
 * Result of gamut checking operation
 */
export interface GamutCheckResult {
  /**
   * Whether color is in gamut for the specified profile
   */
  inGamut: boolean;

  /**
   * Gamut profile that was checked
   */
  profile: GamutProfile;

  /**
   * If out of gamut, the nearest in-gamut color
   */
  clipped?: string;

  /**
   * Human-readable warning message if out of gamut
   */
  warning?: string;
}
