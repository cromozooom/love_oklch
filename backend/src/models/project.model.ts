import { z } from 'zod';
import {
  ColorGamut as PrismaColorGamut,
  ColorSpace as PrismaColorSpace,
} from '@prisma/client';

/**
 * Color gamut options for projects - matches Prisma enum
 */
export enum ColorGamut {
  SRGB = 'sRGB',
  DISPLAY_P3 = 'Display P3',
  UNLIMITED = 'Unlimited gamut',
}

/**
 * Color space options for projects - matches Prisma enum
 */
export enum ColorSpace {
  LCH = 'LCH',
  OKLCH = 'OKLCH',
}

/**
 * Project entity interface - matches backend model but with standard naming
 */
export interface Project {
  id: string; // Maps to projectId in Prisma
  userId: string; // Reference to user
  name: string; // User-defined project name
  description?: string | null; // Optional project description
  colorGamut: ColorGamut; // Color gamut (sRGB, Display P3, Unlimited gamut)
  colorSpace: ColorSpace; // Color space (LCH, OKLCH)
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last modification timestamp
  isActive: boolean; // Soft delete flag
}

/**
 * Project creation input (without generated fields)
 */
export interface CreateProjectInput {
  userId: string;
  name: string;
  description?: string;
  colorGamut: ColorGamut;
  colorSpace: ColorSpace;
}

/**
 * Project update input (partial fields only)
 */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  colorGamut?: ColorGamut;
  colorSpace?: ColorSpace;
  isActive?: boolean;
}

/**
 * Zod schema for project validation
 */
export const createProjectSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  colorGamut: z.nativeEnum(ColorGamut, {
    message: 'Invalid color gamut',
  }),
  colorSpace: z.nativeEnum(ColorSpace, {
    message: 'Invalid color space',
  }),
});

/**
 * Zod schema for project updates
 */
export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  colorGamut: z
    .nativeEnum(ColorGamut, {
      message: 'Invalid color gamut',
    })
    .optional(),
  colorSpace: z
    .nativeEnum(ColorSpace, {
      message: 'Invalid color space',
    })
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * Project query filters
 */
export interface ProjectQueryOptions {
  userId: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
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
 * Business rule validation
 */
export class ProjectValidation {
  static validateProjectLimits(
    userSubscriptionType: 'default' | 'premium',
    activeProjectCount: number,
  ): boolean {
    if (userSubscriptionType === 'default') {
      return activeProjectCount < 1; // Default users limited to 1 project
    }
    return true; // Premium users have unlimited projects
  }

  static validateProjectName(name: string, existingNames: string[]): boolean {
    const trimmedName = name.trim();
    return !existingNames.includes(trimmedName);
  }
}
