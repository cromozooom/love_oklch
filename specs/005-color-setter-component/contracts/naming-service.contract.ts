/**
 * Color Naming Service Contract
 * Version: 1.0.0
 *
 * Defines the interface for color naming service
 */

import { Observable } from 'rxjs';
import { IColor } from './color-service.contract';

// ============================================================================
// Naming Service Interface
// ============================================================================

export interface INamingService {
  /**
   * Get human-readable name for a color
   * @param color - Color to name
   * @returns Color name with confidence score
   */
  getName(color: string | IColor): IColorName;

  /**
   * Find closest matching color name
   * @param color - Color to match
   * @param maxDeltaE - Maximum Delta-E distance to consider (default: 10)
   * @returns Best matching color name or undefined if no match
   */
  findClosestName(
    color: string | IColor,
    maxDeltaE?: number
  ): IColorName | undefined;

  /**
   * Get all color names within Delta-E threshold
   * @param color - Color to match
   * @param maxDeltaE - Maximum Delta-E distance
   * @param maxResults - Maximum number of results (default: 5)
   * @returns Array of matching color names, sorted by confidence
   */
  findSimilarNames(
    color: string | IColor,
    maxDeltaE: number,
    maxResults?: number
  ): IColorName[];

  /**
   * Search for colors by name
   * @param query - Name search query (partial match supported)
   * @returns Array of matching color entries
   */
  searchByName(query: string): IColorNameEntry[];

  /**
   * Get all available color names
   * @returns Complete color name dataset
   */
  getAllNames(): IColorNameEntry[];

  /**
   * Get color names by category
   * @param category - Color category
   * @returns Array of color names in category
   */
  getNamesByCategory(category: ColorCategory): IColorNameEntry[];

  /**
   * Add custom color name to dataset
   * @param entry - Color name entry to add
   */
  addCustomName(entry: IColorNameEntry): void;

  /**
   * Remove custom color name from dataset
   * @param name - Name to remove
   */
  removeCustomName(name: string): void;
}

// ============================================================================
// Color Name Result
// ============================================================================

export interface IColorName {
  /**
   * Human-readable color name
   */
  name: string;

  /**
   * Confidence score (0-1)
   * 1.0 = exact match, 0.0 = very different
   * Based on Delta-E distance
   */
  confidence: number;

  /**
   * Delta-E 2000 distance from reference color
   */
  deltaE: number;

  /**
   * Category of the color (if available)
   */
  category?: ColorCategory;
}

// ============================================================================
// Color Name Entry
// ============================================================================

export interface IColorNameEntry {
  /**
   * Name of the color
   */
  name: string;

  /**
   * Reference color in OKLCH format
   */
  reference: IColor;

  /**
   * Category for grouping
   */
  category?: ColorCategory;

  /**
   * Alternative names/aliases
   */
  aliases?: string[];

  /**
   * Whether this is a custom user-defined name
   */
  custom?: boolean;

  /**
   * Additional metadata
   */
  metadata?: {
    /**
     * Source of the color name (e.g., 'CSS', 'X11', 'Pantone', 'Custom')
     */
    source?: string;

    /**
     * Year color was defined
     */
    year?: number;

    /**
     * Cultural/historical context
     */
    context?: string;
  };
}

// ============================================================================
// Color Categories
// ============================================================================

export type ColorCategory =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'brown'
  | 'gray'
  | 'white'
  | 'black'
  | 'other';

// ============================================================================
// Naming Algorithm Configuration
// ============================================================================

export interface INamingConfig {
  /**
   * Delta-E threshold for "exact match"
   * @default 1.0
   */
  exactMatchThreshold: number;

  /**
   * Delta-E threshold for "close match"
   * @default 5.0
   */
  closeMatchThreshold: number;

  /**
   * Maximum Delta-E for any match
   * @default 10.0
   */
  maxDeltaE: number;

  /**
   * Whether to include custom names in search
   * @default true
   */
  includeCustomNames: boolean;

  /**
   * Prefer common/standard names over obscure ones
   * @default true
   */
  preferCommonNames: boolean;
}

// ============================================================================
// Confidence Calculation
// ============================================================================

export interface IConfidenceCalculation {
  /**
   * Calculate confidence score from Delta-E distance
   * @param deltaE - Delta-E 2000 distance
   * @returns Confidence score (0-1)
   */
  (deltaE: number): number;
}

/**
 * Default confidence calculation
 * Maps Delta-E to 0-1 confidence score
 *
 * Delta-E ≤ 1.0: confidence = 1.0 (exact match)
 * Delta-E 1.0-5.0: confidence = 0.8-1.0 (close match)
 * Delta-E 5.0-10.0: confidence = 0.5-0.8 (approximate match)
 * Delta-E > 10.0: confidence < 0.5 (poor match)
 */
export const DEFAULT_CONFIDENCE_CALCULATION: IConfidenceCalculation;

// ============================================================================
// Color Name Dataset Statistics
// ============================================================================

export interface IDatasetStatistics {
  /**
   * Total number of color names
   */
  totalNames: number;

  /**
   * Number of names per category
   */
  countByCategory: Record<ColorCategory, number>;

  /**
   * Number of custom names
   */
  customNameCount: number;

  /**
   * Average Delta-E coverage (how well dataset covers color space)
   */
  averageCoverage: number;

  /**
   * Maximum Delta-E gap (largest uncovered region)
   */
  maxGap: number;
}

// ============================================================================
// Color Name Import/Export
// ============================================================================

export interface IColorNameDataset {
  /**
   * Dataset version
   */
  version: string;

  /**
   * Dataset name/description
   */
  name: string;

  /**
   * Color name entries
   */
  entries: IColorNameEntry[];

  /**
   * Creation/modification timestamp
   */
  timestamp: number;
}

export interface INamingServiceIO {
  /**
   * Export color name dataset
   * @param includeCustom - Include custom names
   * @returns JSON-serializable dataset
   */
  exportDataset(includeCustom?: boolean): IColorNameDataset;

  /**
   * Import color name dataset
   * @param dataset - Dataset to import
   * @param merge - Merge with existing dataset (true) or replace (false)
   */
  importDataset(dataset: IColorNameDataset, merge?: boolean): void;

  /**
   * Export to CSV format
   * @returns CSV string
   */
  exportToCSV(): string;

  /**
   * Import from CSV format
   * @param csv - CSV string
   * @param merge - Merge with existing dataset
   */
  importFromCSV(csv: string, merge?: boolean): void;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default color name dataset (~150 entries)
 */
export const DEFAULT_COLOR_NAMES: IColorNameEntry[];

/**
 * Extended color name dataset (~500 entries)
 * Includes CSS, X11, Pantone, and other standard color names
 */
export const EXTENDED_COLOR_NAMES: IColorNameEntry[];
