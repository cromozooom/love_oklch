import { FeatureRepository } from '../repositories/feature.repository';
import { PlanFeatureRepository } from '../repositories/planFeature.repository';
import {
  Feature,
  FeatureCreateData,
  FeatureUpdateData,
} from '../models/feature.model';
import { PlanFeature } from '../models/planFeature.model';
import { ValidationError } from '../repositories/base.repository';

export interface FeatureServiceCreateData {
  displayName: string;
  keyName: string;
  description?: string;
  category?: string;
  isBoolean: boolean;
  defaultValue: Record<string, any>;
  validationSchema?: Record<string, any>;
  isActive?: boolean;
}

export interface FeatureServiceUpdateData {
  displayName?: string;
  description?: string;
  category?: string;
  isBoolean?: boolean;
  defaultValue?: Record<string, any>;
  validationSchema?: Record<string, any>;
  isActive?: boolean;
}

export interface FeatureSearchFilters {
  category?: string;
  isActive?: boolean;
  search?: string; // For name/description search
  isBoolean?: boolean;
  page?: number;
  limit?: number;
}

export interface FeatureStats {
  totalFeatures: number;
  activeFeatures: number;
  inactiveFeatures: number;
  categoryCounts: Record<string, number>;
  featuresWithoutPlans: number;
  mostUsedFeatures: Array<{
    featureId: string;
    featureName: string;
    planCount: number;
  }>;
}

/**
 * Service class for managing feature catalog operations with business logic
 * Handles CRUD operations, search, categorization, and feature analytics
 */
export class FeatureService {
  constructor(
    private readonly featureRepository: FeatureRepository,
    private readonly planFeatureRepository: PlanFeatureRepository,
  ) {}

  /**
   * Create a new feature with validation
   */
  async createFeature(data: FeatureServiceCreateData): Promise<Feature> {
    await this.validateFeatureData(data);

    const featureData: FeatureCreateData = {
      keyName: data.keyName,
      displayName: data.displayName,
      description: data.description,
      category: data.category,
      isBoolean: data.isBoolean,
      defaultValue: data.defaultValue,
      validationSchema: data.validationSchema,
      isActive: data.isActive ?? true,
    };

    return this.featureRepository.create(featureData);
  }

  /**
   * Update an existing feature with validation
   */
  async updateFeature(
    featureId: string,
    data: FeatureServiceUpdateData,
  ): Promise<Feature> {
    const existingFeature = await this.getFeatureById(featureId);
    await this.validateFeatureData(data, featureId);

    const updateData: FeatureUpdateData = {};

    if (data.displayName !== undefined)
      updateData.displayName = data.displayName;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.isBoolean !== undefined) updateData.isBoolean = data.isBoolean;
    if (data.defaultValue !== undefined)
      updateData.defaultValue = data.defaultValue;
    if (data.validationSchema !== undefined)
      updateData.validationSchema = data.validationSchema;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.featureRepository.update(featureId, updateData);
  }

  /**
   * Get feature by ID with error handling
   */
  async getFeatureById(featureId: string): Promise<Feature> {
    const feature = await this.featureRepository.findById(featureId);
    if (!feature) {
      throw new ValidationError(
        `Feature with ID ${featureId} not found`,
        'FEATURE_NOT_FOUND',
      );
    }
    return feature;
  }

  /**
   * Get feature by key name with error handling
   */
  async getFeatureByKeyName(keyName: string): Promise<Feature> {
    const feature = await this.featureRepository.findByKeyName(keyName);
    if (!feature) {
      throw new ValidationError(
        `Feature with key '${keyName}' not found`,
        'FEATURE_NOT_FOUND',
      );
    }
    return feature;
  }

  /**
   * Get all features with optional filtering
   */
  async getFeatures(filters: FeatureSearchFilters = {}): Promise<Feature[]> {
    const searchOptions: any = {};

    if (filters.search) searchOptions.search = filters.search;
    if (filters.category) searchOptions.category = filters.category;
    if (filters.isActive !== undefined)
      searchOptions.isActive = filters.isActive;
    if (filters.isBoolean !== undefined)
      searchOptions.isBoolean = filters.isBoolean;
    if (filters.page) searchOptions.page = filters.page;
    if (filters.limit) searchOptions.limit = filters.limit;

    return this.featureRepository.findMany(searchOptions);
  }

  /**
   * Get all unique categories from features
   */
  async getFeatureCategories(): Promise<string[]> {
    return this.featureRepository.getCategories();
  }

  /**
   * Get features that are not assigned to any plan
   */
  async getUnassignedFeatures(): Promise<Feature[]> {
    const allFeatures = await this.featureRepository.findMany();
    const usedFeatureIds = new Set<string>();

    // Get all features that are used in plans
    for (const feature of allFeatures) {
      const planFeatures = await this.planFeatureRepository.findByFeatureId(
        feature.featureId,
      );
      if (planFeatures.length > 0) {
        usedFeatureIds.add(feature.featureId);
      }
    }

    return allFeatures.filter(
      (feature) => !usedFeatureIds.has(feature.featureId),
    );
  }

  /**
   * Get comprehensive feature statistics
   */
  async getFeatureStats(): Promise<FeatureStats> {
    const allFeatures = await this.featureRepository.findMany();

    // Basic counts
    const totalFeatures = allFeatures.length;
    const activeFeatures = allFeatures.filter((f) => f.isActive).length;
    const inactiveFeatures = totalFeatures - activeFeatures;

    // Category counts
    const categoryCounts: Record<string, number> = {};
    allFeatures.forEach((feature) => {
      const category = feature.category || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Calculate features without plans and most used features
    const featureUsage: Record<string, number> = {};
    let featuresWithoutPlans = 0;

    for (const feature of allFeatures) {
      const planFeatures = await this.planFeatureRepository.findByFeatureId(
        feature.featureId,
      );
      const planCount = planFeatures.length;

      if (planCount === 0) {
        featuresWithoutPlans++;
      } else {
        featureUsage[feature.featureId] = planCount;
      }
    }

    // Most used features (by plan count)
    const mostUsedFeatures = Object.entries(featureUsage)
      .map(([featureId, planCount]) => {
        const feature = allFeatures.find((f) => f.featureId === featureId);
        return {
          featureId,
          featureName: feature?.displayName || 'Unknown',
          planCount,
        };
      })
      .sort((a, b) => b.planCount - a.planCount)
      .slice(0, 10); // Top 10

    return {
      totalFeatures,
      activeFeatures,
      inactiveFeatures,
      categoryCounts,
      featuresWithoutPlans,
      mostUsedFeatures,
    };
  }

  /**
   * Activate a feature
   */
  async activateFeature(featureId: string): Promise<Feature> {
    await this.getFeatureById(featureId); // Validate existence
    return this.featureRepository.activate(featureId);
  }

  /**
   * Deactivate a feature
   */
  async deactivateFeature(featureId: string): Promise<Feature> {
    await this.getFeatureById(featureId); // Validate existence
    return this.featureRepository.deactivate(featureId);
  }

  /**
   * Bulk update feature categories
   */
  async bulkUpdateFeatureCategory(
    featureIds: string[],
    category: string,
  ): Promise<void> {
    // Validate all feature IDs exist
    for (const featureId of featureIds) {
      await this.getFeatureById(featureId);
    }

    // Update each feature individually (repository doesn't have bulk update)
    for (const featureId of featureIds) {
      await this.featureRepository.update(featureId, { category });
    }
  }

  /**
   * Delete a feature with cascade validation
   */
  async deleteFeature(featureId: string): Promise<void> {
    const feature = await this.getFeatureById(featureId);

    // Check if feature is used in any plans
    const planFeatures =
      await this.planFeatureRepository.findByFeatureId(featureId);
    if (planFeatures.length > 0) {
      const planCount = planFeatures.length;
      throw new ValidationError(
        `Cannot delete feature '${feature.displayName}' - it is used in ${planCount} plan(s). Remove from plans first.`,
        'FEATURE_IN_USE',
      );
    }

    await this.featureRepository.delete(featureId);
  }

  /**
   * Duplicate a feature with new key name
   */
  async duplicateFeature(
    featureId: string,
    newKeyName: string,
    newDisplayName?: string,
  ): Promise<Feature> {
    const sourceFeature = await this.getFeatureById(featureId);

    const duplicateData: FeatureServiceCreateData = {
      displayName: newDisplayName || `${sourceFeature.displayName} (Copy)`,
      keyName: newKeyName,
      isBoolean: sourceFeature.isBoolean,
      defaultValue: { ...sourceFeature.defaultValue },
      isActive: sourceFeature.isActive,
    };

    // Add optional fields only if they exist
    if (sourceFeature.description) {
      duplicateData.description = sourceFeature.description;
    }
    if (sourceFeature.category) {
      duplicateData.category = sourceFeature.category;
    }
    if (sourceFeature.validationSchema) {
      duplicateData.validationSchema = { ...sourceFeature.validationSchema };
    }

    return this.createFeature(duplicateData);
  }

  /**
   * Search features across multiple fields
   */
  async searchFeatures(
    query: string,
    filters: Omit<FeatureSearchFilters, 'search'> = {},
  ): Promise<Feature[]> {
    return this.getFeatures({ ...filters, search: query });
  }

  /**
   * Get feature usage summary (which plans use this feature)
   */
  async getFeatureUsage(featureId: string): Promise<PlanFeature[]> {
    const feature = await this.getFeatureById(featureId);
    return this.planFeatureRepository.findByFeatureId(featureId);
  }

  /**
   * Get features by category
   */
  async getFeaturesByCategory(category: string): Promise<Feature[]> {
    return this.featureRepository.findByCategory(category);
  }

  /**
   * Get active features only
   */
  async getActiveFeatures(): Promise<Feature[]> {
    return this.featureRepository.findActive();
  }

  /**
   * Count features with optional filters
   */
  async countFeatures(
    filters: {
      category?: string;
      isActive?: boolean;
      isBoolean?: boolean;
    } = {},
  ): Promise<number> {
    const features = await this.featureRepository.findMany(filters);
    return features.length;
  }

  /**
   * Private helper to validate feature data with business rules
   */
  private async validateFeatureData(
    data: FeatureServiceCreateData | FeatureServiceUpdateData,
    excludeId?: string,
  ): Promise<void> {
    // Key name uniqueness check (only for create or if keyName is being updated)
    if ('keyName' in data && data.keyName) {
      const existingByKey = await this.featureRepository.findByKeyName(
        data.keyName,
      );
      if (existingByKey && existingByKey.featureId !== excludeId) {
        throw new ValidationError(
          `Feature key '${data.keyName}' already exists`,
          'DUPLICATE_KEY',
        );
      }

      // Business rule: Key must be alphanumeric with underscores/hyphens only
      if (!/^[a-zA-Z0-9_-]+$/.test(data.keyName)) {
        throw new ValidationError(
          'Feature key must contain only alphanumeric characters, underscores, and hyphens',
          'INVALID_KEY_FORMAT',
        );
      }
    }

    // Display name validation
    if (data.displayName) {
      if (data.displayName.trim().length === 0) {
        throw new ValidationError(
          'Feature display name cannot be empty',
          'INVALID_NAME',
        );
      }
      if (data.displayName.length > 100) {
        throw new ValidationError(
          'Feature display name cannot exceed 100 characters',
          'NAME_TOO_LONG',
        );
      }
    }

    // Category validation (if provided)
    if (data.category && data.category.length > 50) {
      throw new ValidationError(
        'Feature category cannot exceed 50 characters',
        'CATEGORY_TOO_LONG',
      );
    }

    // Default value validation for create operations
    if ('defaultValue' in data && data.defaultValue) {
      if (
        typeof data.defaultValue !== 'object' ||
        Array.isArray(data.defaultValue)
      ) {
        throw new ValidationError(
          'Default value must be an object',
          'INVALID_DEFAULT_VALUE',
        );
      }
    }
  }
}
