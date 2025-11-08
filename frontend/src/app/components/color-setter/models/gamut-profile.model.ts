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
 * Helper function to convert display name to GamutProfile type
 * Useful for form selects that use human-readable values
 */
export function displayNameToGamutProfile(
  displayName: string
): GamutProfile | null {
  const entry = Object.values(GAMUT_PROFILES).find(
    (def) => def.displayName.toLowerCase() === displayName.toLowerCase()
  );
  return entry?.profile || null;
}

/**
 * Helper function to get display name from GamutProfile type
 */
export function gamutProfileToDisplayName(profile: GamutProfile): string {
  return GAMUT_PROFILES[profile].displayName;
}

/**
 * Result of gamut checking operation
 */
export interface GamutCheckResult {
  /**
   * Whether color is in gamut for the specified profile
   */
  isInGamut: boolean;

  /**
   * Gamut profile that was checked
   */
  gamut: string;

  /**
   * If out of gamut, the nearest in-gamut color (HEX format)
   */
  clipped?: string;

  /**
   * Distance from gamut boundary (0 if in-gamut, >0 if out-of-gamut)
   */
  distance?: number;

  /**
   * Human-readable warning message if out of gamut
   */
  warning?: string;
}
