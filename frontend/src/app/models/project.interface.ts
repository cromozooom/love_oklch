import { ColorGamut, ColorSpace } from './color-enums';

/**
 * Project entity interface - matches backend model
 */
export interface Project {
  id: string; // UUID v4
  userId: string; // Reference to user
  name: string; // User-defined project name
  description?: string; // Optional project description
  colorGamut: ColorGamut; // Color gamut (sRGB, Display P3, Unlimited gamut)
  colorSpace: ColorSpace; // Color space (LCH, OKLCH)
  colorCount?: number; // DEMO: Number of colors (for testing history)
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last modification timestamp
  isActive: boolean; // Soft delete flag
}

/**
 * Project creation input (without generated fields)
 */
export interface CreateProjectRequest {
  name: string;
  description?: string;
  colorGamut: ColorGamut;
  colorSpace: ColorSpace;
  colorCount?: number; // DEMO: Number of colors (for testing)
}

/**
 * Project update input (partial fields only)
 */
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  colorGamut?: ColorGamut;
  colorSpace?: ColorSpace;
  colorCount?: number; // DEMO: Number of colors (for testing)
  isActive?: boolean;
}

/**
 * Project API response
 */
export interface ProjectResponse {
  success: boolean;
  data?: Project;
  error?: string;
  message?: string;
}

/**
 * Project list API response
 */
export interface ProjectListResponse {
  success: boolean;
  data?: Project[];
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

/**
 * Project query options for API calls
 */
export interface ProjectQueryParams {
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Project form model for Angular reactive forms
 */
export interface ProjectFormModel {
  name: string;
  description: string;
  colorGamut: ColorGamut;
  colorSpace: ColorSpace;
}

/**
 * Project state for application store
 */
export interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  lastUpdated: Date | null;
}

/**
 * Project list item for display in components
 */
export interface ProjectListItem {
  id: string;
  name: string;
  description?: string;
  colorGamut: ColorGamut;
  colorSpace: ColorSpace;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * Type guards for runtime type checking
 */
export const isValidColorGamut = (value: string): value is ColorGamut => {
  return Object.values(ColorGamut).includes(value as ColorGamut);
};

export const isValidColorSpace = (value: string): value is ColorSpace => {
  return Object.values(ColorSpace).includes(value as ColorSpace);
};

/**
 * Project helper functions
 */
export class ProjectHelpers {
  static getColorGamutOptions(): { value: ColorGamut; label: string }[] {
    return [
      { value: ColorGamut.SRGB, label: 'sRGB (Standard)' },
      { value: ColorGamut.DISPLAY_P3, label: 'Display P3 (Wide Gamut)' },
      { value: ColorGamut.UNLIMITED, label: 'Unlimited Gamut' },
    ];
  }

  static getColorSpaceOptions(): { value: ColorSpace; label: string }[] {
    return [
      { value: ColorSpace.LCH, label: 'LCH' },
      { value: ColorSpace.OKLCH, label: 'OKLCH' },
    ];
  }

  static formatProjectName(name: string): string {
    return name.trim();
  }

  static getProjectDisplayName(project: Project): string {
    return project.name || 'Untitled Project';
  }

  static isProjectActive(project: Project): boolean {
    return project.isActive;
  }

  static getProjectAge(project: Project): string {
    const now = new Date();
    const created = new Date(project.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}
