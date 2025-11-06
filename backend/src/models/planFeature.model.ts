import { ValidationError } from '../middleware/error.middleware';

// Type definition that matches the Prisma PlanFeature model
interface PrismaPlanFeature {
  planFeatureId: string;
  planId: string;
  featureId: string;
  value: any; // Json type from Prisma
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PlanFeature model for linking plans with features and their configurations
 * Handles validation and business logic for plan-feature relationships
 */
export interface PlanFeatureData {
  planFeatureId?: string;
  planId: string;
  featureId: string;
  value: Record<string, any>;
  isEnabled: boolean;
}

export interface PlanFeatureCreateData
  extends Omit<PlanFeatureData, 'planFeatureId'> {}

export interface PlanFeatureUpdateData
  extends Partial<
    Omit<PlanFeatureData, 'planFeatureId' | 'planId' | 'featureId'>
  > {}

export class PlanFeature {
  public readonly planFeatureId: string;
  public readonly planId: string;
  public readonly featureId: string;
  public readonly value: Record<string, any>;
  public readonly isEnabled: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(data: PrismaPlanFeature) {
    this.planFeatureId = data.planFeatureId;
    this.planId = data.planId;
    this.featureId = data.featureId;
    this.value = data.value as Record<string, any>;
    this.isEnabled = data.isEnabled;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Validate plan feature data before creation/update
   */
  public static validate(
    data: PlanFeatureCreateData | PlanFeatureUpdateData,
  ): void {
    const errors: string[] = [];

    // Validate planId (required for creation)
    if ('planId' in data && data.planId !== undefined) {
      if (!data.planId || data.planId.trim().length === 0) {
        errors.push('Plan ID is required');
      }
    }

    // Validate featureId (required for creation)
    if ('featureId' in data && data.featureId !== undefined) {
      if (!data.featureId || data.featureId.trim().length === 0) {
        errors.push('Feature ID is required');
      }
    }

    // Validate value
    if ('value' in data && data.value !== undefined) {
      try {
        JSON.stringify(data.value);
      } catch {
        errors.push('Value must be a valid JSON object');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(
        `PlanFeature validation failed: ${errors.join(', ')}`,
        'VALIDATION_ERROR',
      );
    }
  }

  /**
   * Get numeric value if value contains a number
   */
  public get numericValue(): number | null {
    if (typeof this.value === 'number') return this.value;
    if (this.value && typeof this.value.limit === 'number')
      return this.value.limit;
    if (this.value && typeof this.value.quota === 'number')
      return this.value.quota;
    if (this.value && typeof this.value.count === 'number')
      return this.value.count;
    return null;
  }

  /**
   * Get boolean value if value contains a boolean
   */
  public get booleanValue(): boolean | null {
    if (typeof this.value === 'boolean') return this.value;
    if (this.value && typeof this.value.enabled === 'boolean')
      return this.value.enabled;
    if (this.value && typeof this.value.allowed === 'boolean')
      return this.value.allowed;
    return null;
  }

  /**
   * Check if feature has a numeric value
   */
  public get hasNumericValue(): boolean {
    return this.numericValue !== null;
  }

  /**
   * Check if feature has a boolean value
   */
  public get hasBooleanValue(): boolean {
    return this.booleanValue !== null;
  }

  /**
   * Get display value formatted appropriately
   */
  public get displayValue(): string {
    if (!this.isEnabled) return 'Disabled';

    const numVal = this.numericValue;
    if (numVal !== null) {
      return numVal.toLocaleString();
    }

    const boolVal = this.booleanValue;
    if (boolVal !== null) {
      return boolVal ? 'Enabled' : 'Disabled';
    }

    // Return JSON string for complex values
    try {
      return JSON.stringify(this.value);
    } catch {
      return 'Invalid value';
    }
  }

  /**
   * Convert to plain object for API responses
   */
  public toJSON(): PlanFeatureData & {
    planFeatureId: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      planFeatureId: this.planFeatureId,
      planId: this.planId,
      featureId: this.featureId,
      value: this.value,
      isEnabled: this.isEnabled,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create PlanFeature instance from database data
   */
  public static fromDatabase(data: PrismaPlanFeature): PlanFeature {
    return new PlanFeature(data);
  }

  /**
   * Prepare data for database creation
   */
  public static prepareForCreation(data: PlanFeatureCreateData): any {
    PlanFeature.validate(data);

    return {
      planId: data.planId.trim(),
      featureId: data.featureId.trim(),
      value: data.value || {},
      isEnabled: data.isEnabled,
    };
  }

  /**
   * Prepare data for database update
   */
  public static prepareForUpdate(data: PlanFeatureUpdateData): any {
    PlanFeature.validate(data);

    const updateData: any = {};

    if (data.value !== undefined) {
      updateData.value = data.value;
    }

    if (data.isEnabled !== undefined) {
      updateData.isEnabled = data.isEnabled;
    }

    return updateData;
  }

  /**
   * Create a quota configuration
   */
  public static createQuotaConfig(
    planId: string,
    featureId: string,
    quota: number,
    enabled: boolean = true,
  ): PlanFeatureCreateData {
    return {
      planId,
      featureId,
      value: { type: 'quota', quota },
      isEnabled: enabled,
    };
  }

  /**
   * Create a limit configuration
   */
  public static createLimitConfig(
    planId: string,
    featureId: string,
    limit: number,
    enabled: boolean = true,
  ): PlanFeatureCreateData {
    return {
      planId,
      featureId,
      value: { type: 'limit', limit },
      isEnabled: enabled,
    };
  }

  /**
   * Create a boolean configuration
   */
  public static createBooleanConfig(
    planId: string,
    featureId: string,
    allowed: boolean,
  ): PlanFeatureCreateData {
    return {
      planId,
      featureId,
      value: { type: 'boolean', allowed },
      isEnabled: allowed,
    };
  }

  /**
   * Create an access configuration
   */
  public static createAccessConfig(
    planId: string,
    featureId: string,
    access: string,
    enabled: boolean = true,
  ): PlanFeatureCreateData {
    return {
      planId,
      featureId,
      value: { type: 'access', access },
      isEnabled: enabled,
    };
  }
}

export default PlanFeature;
