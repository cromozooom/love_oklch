import { ValidationError } from '../middleware/error.middleware';

// Type definition that matches the Prisma Feature model
interface PrismaFeature {
  featureId: string;
  keyName: string;
  displayName: string;
  description: string | null;
  category: string | null;
  isBoolean: boolean;
  defaultValue: any; // Json type from Prisma
  validationSchema: any | null; // Json type from Prisma
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Feature model for platform feature management
 * Handles validation and business logic for feature definitions
 */
export interface FeatureData {
  featureId?: string;
  keyName: string;
  displayName: string;
  description?: string | undefined;
  category?: string | undefined;
  isBoolean: boolean;
  defaultValue: Record<string, any>;
  validationSchema?: Record<string, any> | null | undefined;
  isActive: boolean;
}

export interface FeatureCreateData extends Omit<FeatureData, 'featureId'> {}

export interface FeatureUpdateData
  extends Partial<Omit<FeatureData, 'featureId'>> {}

export class Feature {
  public readonly featureId: string;
  public readonly keyName: string;
  public readonly displayName: string;
  public readonly description?: string | undefined;
  public readonly category?: string | undefined;
  public readonly isBoolean: boolean;
  public readonly defaultValue: Record<string, any>;
  public readonly validationSchema?: Record<string, any> | null;
  public readonly isActive: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(data: PrismaFeature) {
    this.featureId = data.featureId;
    this.keyName = data.keyName;
    this.displayName = data.displayName;
    this.description = data.description || undefined;
    this.category = data.category || undefined;
    this.isBoolean = data.isBoolean;
    this.defaultValue = data.defaultValue as Record<string, any>;
    this.validationSchema = data.validationSchema as Record<string, any> | null;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Validate feature data before creation/update
   */
  public static validate(data: FeatureCreateData | FeatureUpdateData): void {
    const errors: string[] = [];

    // Validate keyName
    if ('keyName' in data && data.keyName !== undefined) {
      if (!data.keyName || data.keyName.trim().length === 0) {
        errors.push('Feature key name is required');
      } else if (data.keyName.length > 100) {
        errors.push('Feature key name must be 100 characters or less');
      } else if (!/^[a-z0-9-_]+$/.test(data.keyName)) {
        errors.push(
          'Feature key name must contain only lowercase letters, numbers, hyphens, and underscores',
        );
      }
    }

    // Validate displayName
    if ('displayName' in data && data.displayName !== undefined) {
      if (!data.displayName || data.displayName.trim().length === 0) {
        errors.push('Feature display name is required');
      } else if (data.displayName.length > 255) {
        errors.push('Feature display name must be 255 characters or less');
      }
    }

    // Validate category
    if (
      'category' in data &&
      data.category !== undefined &&
      data.category !== null
    ) {
      if (data.category.length > 100) {
        errors.push('Feature category must be 100 characters or less');
      }
    }

    // Validate description
    if (
      'description' in data &&
      data.description !== undefined &&
      data.description !== null
    ) {
      if (data.description.length > 500) {
        errors.push('Feature description must be 500 characters or less');
      }
    }

    // Validate defaultValue
    if ('defaultValue' in data && data.defaultValue !== undefined) {
      try {
        JSON.stringify(data.defaultValue);
      } catch {
        errors.push('Default value must be a valid JSON object');
      }
    }

    // Validate validationSchema
    if (
      'validationSchema' in data &&
      data.validationSchema !== undefined &&
      data.validationSchema !== null
    ) {
      try {
        JSON.stringify(data.validationSchema);
      } catch {
        errors.push('Validation schema must be a valid JSON object');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(
        `Feature validation failed: ${errors.join(', ')}`,
        'VALIDATION_ERROR',
      );
    }
  }

  /**
   * Check if feature is a boolean feature
   */
  public get isBooleanFeature(): boolean {
    return this.isBoolean;
  }

  /**
   * Check if feature is a quota/limit feature
   */
  public get isQuantityFeature(): boolean {
    return !this.isBoolean;
  }

  /**
   * Get the feature's display name or key name as fallback
   */
  public get name(): string {
    return this.displayName || this.keyName;
  }

  /**
   * Convert to plain object for API responses
   */
  public toJSON(): FeatureData & {
    featureId: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      featureId: this.featureId,
      keyName: this.keyName,
      displayName: this.displayName,
      description: this.description,
      category: this.category,
      isBoolean: this.isBoolean,
      defaultValue: this.defaultValue,
      validationSchema: this.validationSchema,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create Feature instance from database data
   */
  public static fromDatabase(data: PrismaFeature): Feature {
    return new Feature(data);
  }

  /**
   * Prepare data for database creation
   */
  public static prepareForCreation(data: FeatureCreateData): any {
    Feature.validate(data);

    return {
      keyName: data.keyName.trim().toLowerCase(),
      displayName: data.displayName.trim(),
      description: data.description?.trim() || null,
      category: data.category?.trim() || null,
      isBoolean: data.isBoolean,
      defaultValue: data.defaultValue || {},
      validationSchema: data.validationSchema || null,
      isActive: data.isActive,
    };
  }

  /**
   * Prepare data for database update
   */
  public static prepareForUpdate(data: FeatureUpdateData): any {
    Feature.validate(data);

    const updateData: any = {};

    if (data.keyName !== undefined) {
      updateData.keyName = data.keyName.trim().toLowerCase();
    }

    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }

    if (data.category !== undefined) {
      updateData.category = data.category?.trim() || null;
    }

    if (data.isBoolean !== undefined) {
      updateData.isBoolean = data.isBoolean;
    }

    if (data.defaultValue !== undefined) {
      updateData.defaultValue = data.defaultValue;
    }

    if (data.validationSchema !== undefined) {
      updateData.validationSchema = data.validationSchema;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    return updateData;
  }
}

export default Feature;
