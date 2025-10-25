import { PlanFeatureRepository } from '../repositories/planFeature.repository';
import { PlanRepository } from '../repositories/plan.repository';
import { FeatureRepository } from '../repositories/feature.repository';
import {
  PlanFeature,
  PlanFeatureCreateData,
  PlanFeatureUpdateData,
} from '../models/planFeature.model';
import { ValidationError } from '../repositories/base.repository';

export interface PlanFeatureServiceCreateData {
  planId: string;
  featureId: string;
  isEnabled: boolean;
  value?: Record<string, any>;
}

export interface PlanFeatureServiceUpdateData {
  isEnabled?: boolean;
  value?: Record<string, any>;
}

export interface EntitlementMatrixRow {
  featureId: string;
  featureName: string;
  featureKeyName: string;
  plans: Array<{
    planId: string;
    planName: string;
    isEnabled: boolean;
    value: Record<string, any>;
  }>;
}

export interface PlanEntitlementSummary {
  planId: string;
  planName: string;
  totalFeatures: number;
  enabledFeatures: number;
  disabledFeatures: number;
  featuresWithValues: number;
  featuresByCategory: Record<
    string,
    {
      total: number;
      enabled: number;
    }
  >;
}

export interface BulkUpdateRequest {
  planFeatureId: string;
  isEnabled?: boolean;
  value?: Record<string, any>;
}

export interface EntitlementAnalytics {
  totalRelationships: number;
  enabledRelationships: number;
  disabledRelationships: number;
  relationshipsWithValues: number;
  planCoverage: Array<{
    planId: string;
    planName: string;
    featureCount: number;
    enabledCount: number;
    coveragePercent: number;
  }>;
  featureAdoption: Array<{
    featureId: string;
    featureName: string;
    planCount: number;
    enabledCount: number;
    adoptionPercent: number;
  }>;
}

/**
 * Service class for managing plan-feature relationships (entitlement matrix)
 * Handles business logic for feature entitlements, bulk operations, and analytics
 */
export class PlanFeatureService {
  constructor(
    private readonly planFeatureRepository: PlanFeatureRepository,
    private readonly planRepository: PlanRepository,
    private readonly featureRepository: FeatureRepository,
  ) {}

  /**
   * Create a new plan-feature relationship with validation
   */
  async createPlanFeature(
    data: PlanFeatureServiceCreateData,
  ): Promise<PlanFeature> {
    await this.validatePlanFeatureData(data);

    const planFeatureData: PlanFeatureCreateData = {
      planId: data.planId,
      featureId: data.featureId,
      isEnabled: data.isEnabled,
      value: data.value || {},
    };

    return this.planFeatureRepository.create(planFeatureData);
  }

  /**
   * Update an existing plan-feature relationship
   */
  async updatePlanFeature(
    planFeatureId: string,
    data: PlanFeatureServiceUpdateData,
  ): Promise<PlanFeature> {
    const existingPlanFeature = await this.getPlanFeatureById(planFeatureId);

    const updateData: PlanFeatureUpdateData = {};
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
    if (data.value !== undefined) updateData.value = data.value;

    return this.planFeatureRepository.update(planFeatureId, updateData);
  }

  /**
   * Get plan-feature relationship by ID
   */
  async getPlanFeatureById(planFeatureId: string): Promise<PlanFeature> {
    const planFeature =
      await this.planFeatureRepository.findById(planFeatureId);
    if (!planFeature) {
      throw new ValidationError(
        `Plan-feature relationship with ID ${planFeatureId} not found`,
        'PLAN_FEATURE_NOT_FOUND',
      );
    }
    return planFeature;
  }

  /**
   * Get plan-feature relationship by plan and feature IDs
   */
  async getPlanFeatureByPlanAndFeature(
    planId: string,
    featureId: string,
  ): Promise<PlanFeature | null> {
    return this.planFeatureRepository.findByPlanAndFeature(planId, featureId);
  }

  /**
   * Get all features for a specific plan
   */
  async getFeaturesByPlan(
    planId: string,
    enabledOnly: boolean = false,
  ): Promise<PlanFeature[]> {
    // Validate plan exists
    await this.validatePlanExists(planId);

    if (enabledOnly) {
      return this.planFeatureRepository.findEnabledByPlanId(planId);
    }

    return this.planFeatureRepository.findByPlanId(planId);
  }

  /**
   * Get all plans for a specific feature
   */
  async getPlansByFeature(featureId: string): Promise<PlanFeature[]> {
    // Validate feature exists
    await this.validateFeatureExists(featureId);

    return this.planFeatureRepository.findByFeatureId(featureId);
  }

  /**
   * Enable a feature for a plan
   */
  async enablePlanFeature(planFeatureId: string): Promise<PlanFeature> {
    return this.planFeatureRepository.enable(planFeatureId);
  }

  /**
   * Disable a feature for a plan
   */
  async disablePlanFeature(planFeatureId: string): Promise<PlanFeature> {
    return this.planFeatureRepository.disable(planFeatureId);
  }

  /**
   * Delete a plan-feature relationship
   */
  async deletePlanFeature(planFeatureId: string): Promise<void> {
    const planFeature = await this.getPlanFeatureById(planFeatureId);
    await this.planFeatureRepository.delete(planFeatureId);
  }

  /**
   * Replace all features for a plan (bulk operation)
   */
  async replaceAllFeaturesForPlan(
    planId: string,
    featureData: Array<{
      featureId: string;
      isEnabled: boolean;
      value?: Record<string, any>;
    }>,
  ): Promise<PlanFeature[]> {
    // Validate plan exists
    await this.validatePlanExists(planId);

    // Validate all features exist
    for (const data of featureData) {
      await this.validateFeatureExists(data.featureId);
    }

    const createData: PlanFeatureCreateData[] = featureData.map((data) => ({
      planId,
      featureId: data.featureId,
      isEnabled: data.isEnabled,
      value: data.value || {},
    }));

    return this.planFeatureRepository.replaceAllForPlan(planId, createData);
  }

  /**
   * Bulk update multiple plan-feature relationships
   */
  async bulkUpdatePlanFeatures(
    updates: BulkUpdateRequest[],
  ): Promise<PlanFeature[]> {
    const results: PlanFeature[] = [];

    for (const update of updates) {
      const updateData: PlanFeatureServiceUpdateData = {};
      if (update.isEnabled !== undefined)
        updateData.isEnabled = update.isEnabled;
      if (update.value !== undefined) updateData.value = update.value;

      const updated = await this.updatePlanFeature(
        update.planFeatureId,
        updateData,
      );
      results.push(updated);
    }

    return results;
  }

  /**
   * Get the full entitlement matrix (features vs plans)
   */
  async getEntitlementMatrix(): Promise<EntitlementMatrixRow[]> {
    const matrix = await this.planFeatureRepository.getEntitlementMatrix();

    // Transform the repository result into our service format
    const matrixMap = new Map<string, EntitlementMatrixRow>();

    for (const item of matrix) {
      const featureId = item.planFeature.featureId;

      if (!matrixMap.has(featureId)) {
        matrixMap.set(featureId, {
          featureId,
          featureName: item.featureName,
          featureKeyName: item.featureKeyName,
          plans: [],
        });
      }

      const row = matrixMap.get(featureId)!;
      row.plans.push({
        planId: item.planFeature.planId,
        planName: item.planName,
        isEnabled: item.planFeature.isEnabled,
        value: item.planFeature.value,
      });
    }

    return Array.from(matrixMap.values());
  }

  /**
   * Get entitlement summary for a specific plan
   */
  async getPlanEntitlementSummary(
    planId: string,
  ): Promise<PlanEntitlementSummary> {
    // Validate plan exists
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new ValidationError(
        `Plan with ID ${planId} not found`,
        'PLAN_NOT_FOUND',
      );
    }

    const planFeatures = await this.planFeatureRepository.findByPlanId(planId);

    const totalFeatures = planFeatures.length;
    const enabledFeatures = planFeatures.filter((pf) => pf.isEnabled).length;
    const disabledFeatures = totalFeatures - enabledFeatures;
    const featuresWithValues = planFeatures.filter(
      (pf) => pf.value && Object.keys(pf.value).length > 0,
    ).length;

    // Group by feature categories (we'd need to fetch feature details)
    const featuresByCategory: Record<
      string,
      { total: number; enabled: number }
    > = {};

    for (const pf of planFeatures) {
      const feature = await this.featureRepository.findById(pf.featureId);
      const category = feature?.category || 'Uncategorized';

      if (!featuresByCategory[category]) {
        featuresByCategory[category] = { total: 0, enabled: 0 };
      }

      featuresByCategory[category].total++;
      if (pf.isEnabled) {
        featuresByCategory[category].enabled++;
      }
    }

    return {
      planId,
      planName: plan.name,
      totalFeatures,
      enabledFeatures,
      disabledFeatures,
      featuresWithValues,
      featuresByCategory,
    };
  }

  /**
   * Get comprehensive entitlement analytics
   */
  async getEntitlementAnalytics(): Promise<EntitlementAnalytics> {
    const allPlanFeatures = await this.planFeatureRepository.findMany();
    const allPlans = await this.planRepository.findMany();
    const allFeatures = await this.featureRepository.findMany();

    const totalRelationships = allPlanFeatures.length;
    const enabledRelationships = allPlanFeatures.filter(
      (pf) => pf.isEnabled,
    ).length;
    const disabledRelationships = totalRelationships - enabledRelationships;
    const relationshipsWithValues = allPlanFeatures.filter(
      (pf) => pf.value && Object.keys(pf.value).length > 0,
    ).length;

    // Plan coverage analysis
    const planCoverage = allPlans.map((plan) => {
      const planFeatures = allPlanFeatures.filter(
        (pf) => pf.planId === plan.planId,
      );
      const enabledCount = planFeatures.filter((pf) => pf.isEnabled).length;
      const featureCount = planFeatures.length;
      const coveragePercent =
        featureCount > 0 ? (enabledCount / featureCount) * 100 : 0;

      return {
        planId: plan.planId,
        planName: plan.name,
        featureCount,
        enabledCount,
        coveragePercent: Math.round(coveragePercent * 100) / 100,
      };
    });

    // Feature adoption analysis
    const featureAdoption = allFeatures.map((feature) => {
      const featurePlans = allPlanFeatures.filter(
        (pf) => pf.featureId === feature.featureId,
      );
      const enabledCount = featurePlans.filter((pf) => pf.isEnabled).length;
      const planCount = featurePlans.length;
      const adoptionPercent =
        planCount > 0 ? (enabledCount / planCount) * 100 : 0;

      return {
        featureId: feature.featureId,
        featureName: feature.displayName,
        planCount,
        enabledCount,
        adoptionPercent: Math.round(adoptionPercent * 100) / 100,
      };
    });

    return {
      totalRelationships,
      enabledRelationships,
      disabledRelationships,
      relationshipsWithValues,
      planCoverage,
      featureAdoption,
    };
  }

  /**
   * Copy entitlements from one plan to another
   */
  async copyPlanEntitlements(
    sourcePlanId: string,
    targetPlanId: string,
    overwrite: boolean = false,
  ): Promise<PlanFeature[]> {
    // Validate both plans exist
    await this.validatePlanExists(sourcePlanId);
    await this.validatePlanExists(targetPlanId);

    const sourceFeatures =
      await this.planFeatureRepository.findByPlanId(sourcePlanId);

    if (sourceFeatures.length === 0) {
      throw new ValidationError(
        'Source plan has no feature entitlements to copy',
        'NO_FEATURES_TO_COPY',
      );
    }

    // If overwrite is true, replace all features; otherwise, add only new ones
    if (overwrite) {
      const newFeatureData = sourceFeatures.map((sf) => ({
        featureId: sf.featureId,
        isEnabled: sf.isEnabled,
        value: sf.value || {},
      }));

      return this.replaceAllFeaturesForPlan(targetPlanId, newFeatureData);
    } else {
      // Add only features that don't already exist in target plan
      const targetFeatures =
        await this.planFeatureRepository.findByPlanId(targetPlanId);
      const targetFeatureIds = new Set(
        targetFeatures.map((tf) => tf.featureId),
      );

      const newFeatures: PlanFeature[] = [];
      for (const sourceFeature of sourceFeatures) {
        if (!targetFeatureIds.has(sourceFeature.featureId)) {
          const createData: PlanFeatureServiceCreateData = {
            planId: targetPlanId,
            featureId: sourceFeature.featureId,
            isEnabled: sourceFeature.isEnabled,
            value: sourceFeature.value || {},
          };

          const newFeature = await this.createPlanFeature(createData);
          newFeatures.push(newFeature);
        }
      }

      return newFeatures;
    }
  }

  /**
   * Get features that are missing from a plan (available but not assigned)
   */
  async getMissingFeaturesForPlan(planId: string): Promise<
    Array<{
      featureId: string;
      featureName: string;
      featureKeyName: string;
      featureCategory: string | null;
      isActive: boolean;
    }>
  > {
    // Validate plan exists
    await this.validatePlanExists(planId);

    const allFeatures = await this.featureRepository.findMany();
    const planFeatures = await this.planFeatureRepository.findByPlanId(planId);
    const assignedFeatureIds = new Set(planFeatures.map((pf) => pf.featureId));

    return allFeatures
      .filter((feature) => !assignedFeatureIds.has(feature.featureId))
      .map((feature) => ({
        featureId: feature.featureId,
        featureName: feature.displayName,
        featureKeyName: feature.keyName,
        featureCategory: feature.category || null,
        isActive: feature.isActive,
      }));
  }

  /**
   * Validate that a plan exists
   */
  private async validatePlanExists(planId: string): Promise<void> {
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new ValidationError(
        `Plan with ID ${planId} not found`,
        'PLAN_NOT_FOUND',
      );
    }
  }

  /**
   * Validate that a feature exists
   */
  private async validateFeatureExists(featureId: string): Promise<void> {
    const feature = await this.featureRepository.findById(featureId);
    if (!feature) {
      throw new ValidationError(
        `Feature with ID ${featureId} not found`,
        'FEATURE_NOT_FOUND',
      );
    }
  }

  /**
   * Validate plan-feature relationship data
   */
  private async validatePlanFeatureData(
    data: PlanFeatureServiceCreateData,
  ): Promise<void> {
    // Validate plan exists
    await this.validatePlanExists(data.planId);

    // Validate feature exists
    await this.validateFeatureExists(data.featureId);

    // Check if relationship already exists
    const existing = await this.planFeatureRepository.findByPlanAndFeature(
      data.planId,
      data.featureId,
    );
    if (existing) {
      throw new ValidationError(
        `Feature is already assigned to this plan. Use update instead.`,
        'PLAN_FEATURE_ALREADY_EXISTS',
      );
    }

    // Validate value if provided
    if (data.value && typeof data.value !== 'object') {
      throw new ValidationError(
        'Feature value must be an object',
        'INVALID_VALUE',
      );
    }
  }
}
