import { PrismaClient } from '@prisma/client';
import { Plan, PlanCreateData, PlanUpdateData } from '../models/plan.model';
import { PlanRepository } from '../repositories/plan.repository';
import { PlanFeatureRepository } from '../repositories/planFeature.repository';
import { ValidationError } from '../middleware/error.middleware';
import { Logger } from '../utils/logger';

/**
 * Service for Plan business logic and operations
 * Orchestrates plan management with validation and business rules
 */
export class PlanService {
  private readonly planRepository: PlanRepository;
  private readonly planFeatureRepository: PlanFeatureRepository;
  private readonly logger: Logger;

  constructor(prisma: PrismaClient) {
    this.planRepository = new PlanRepository(prisma);
    this.planFeatureRepository = new PlanFeatureRepository(prisma);
    this.logger = new Logger('PlanService');
  }

  /**
   * Get a plan by ID with optional feature details
   */
  async getPlanById(id: string, includeFeatures = false): Promise<Plan | null> {
    try {
      this.logger.debug(`Getting plan by ID: ${id}`, { includeFeatures });

      const plan = await this.planRepository.findById(id);
      if (!plan) {
        return null;
      }

      // Note: Feature details would be added by a separate method if needed
      // This maintains the Plan type integrity
      return plan;
    } catch (error) {
      this.logger.error('Error getting plan by ID', { id, error });
      throw error;
    }
  }

  /**
   * Get a plan by slug with optional feature details
   */
  async getPlanBySlug(
    slug: string,
    includeFeatures = false,
  ): Promise<Plan | null> {
    try {
      this.logger.debug(`Getting plan by slug: ${slug}`, { includeFeatures });

      const plan = await this.planRepository.findBySlug(slug);
      if (!plan) {
        return null;
      }

      // Note: Feature details would be added by a separate method if needed
      // This maintains the Plan type integrity
      return plan;
    } catch (error) {
      this.logger.error('Error getting plan by slug', { slug, error });
      throw error;
    }
  }

  /**
   * Get all plans with optional filtering
   */
  async getPlans(
    options: {
      isActive?: boolean;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
  ): Promise<Plan[]> {
    try {
      this.logger.debug('Getting plans with options', options);

      return await this.planRepository.findMany(options);
    } catch (error) {
      this.logger.error('Error getting plans', { options, error });
      throw error;
    }
  }

  /**
   * Get plan features for a specific plan
   */
  async getPlanFeatures(planId: string): Promise<any[]> {
    try {
      this.logger.debug(`Getting features for plan: ${planId}`);

      const planFeatures =
        await this.planFeatureRepository.findEnabledByPlanId(planId);

      return planFeatures.map((pf) => ({
        featureId: pf.featureId,
        value: pf.value,
        isEnabled: pf.isEnabled,
      }));
    } catch (error) {
      this.logger.error('Error getting plan features', { planId, error });
      throw error;
    }
  }

  /**
   * Get only active plans (for public consumption)
   */
  async getPublicPlans(): Promise<Plan[]> {
    try {
      this.logger.debug('Getting public plans');

      return await this.planRepository.findMany({
        isActive: true,
        sortBy: 'sortOrder',
        sortOrder: 'asc',
      });
    } catch (error) {
      this.logger.error('Error getting public plans', { error });
      throw error;
    }
  }

  /**
   * Create a new plan
   */
  async createPlan(data: PlanCreateData): Promise<Plan> {
    try {
      this.logger.info('Creating new plan', {
        name: data.name,
        slug: data.slug,
      });

      // Additional business validation
      await this.validatePlanData(data);

      // Check for business rule violations
      if (data.price < 0) {
        throw new ValidationError(
          'Plan price cannot be negative',
          'INVALID_PRICE',
        );
      }

      if (
        data.billingInterval &&
        !['monthly', 'yearly', 'weekly', 'daily'].includes(data.billingInterval)
      ) {
        throw new ValidationError(
          'Invalid billing interval',
          'INVALID_BILLING_INTERVAL',
        );
      }

      const plan = await this.planRepository.create(data);

      this.logger.info('Plan created successfully', {
        planId: plan.planId,
        name: plan.name,
        slug: plan.slug,
      });

      return plan;
    } catch (error) {
      this.logger.error('Error creating plan', { data, error });
      throw error;
    }
  }

  /**
   * Update an existing plan
   */
  async updatePlan(id: string, data: PlanUpdateData): Promise<Plan> {
    try {
      this.logger.info('Updating plan', { planId: id });

      // Additional business validation
      await this.validatePlanData(data, id);

      // Check for business rule violations
      if (data.price !== undefined && data.price < 0) {
        throw new ValidationError(
          'Plan price cannot be negative',
          'INVALID_PRICE',
        );
      }

      if (
        data.billingInterval &&
        !['monthly', 'yearly', 'weekly', 'daily'].includes(data.billingInterval)
      ) {
        throw new ValidationError(
          'Invalid billing interval',
          'INVALID_BILLING_INTERVAL',
        );
      }

      const plan = await this.planRepository.update(id, data);

      this.logger.info('Plan updated successfully', {
        planId: plan.planId,
        name: plan.name,
        slug: plan.slug,
      });

      return plan;
    } catch (error) {
      this.logger.error('Error updating plan', { id, data, error });
      throw error;
    }
  }

  /**
   * Delete a plan (with safety checks)
   */
  async deletePlan(id: string, force = false): Promise<boolean> {
    try {
      this.logger.info('Deleting plan', { planId: id, force });

      // Check if plan has active subscriptions (would need subscription service)
      // For now, we'll just check if it has features
      const planFeatures = await this.planFeatureRepository.findByPlanId(id);

      if (planFeatures.length > 0 && !force) {
        throw new ValidationError(
          `Cannot delete plan with ${planFeatures.length} associated features. Use force=true to override.`,
          'PLAN_HAS_FEATURES',
        );
      }

      // If forcing deletion, remove all plan features first
      if (force && planFeatures.length > 0) {
        await this.planFeatureRepository.deleteByPlanId(id);
        this.logger.info(
          `Removed ${planFeatures.length} plan features during force deletion`,
        );
      }

      const success = await this.planRepository.delete(id);

      this.logger.info('Plan deleted successfully', { planId: id });

      return success;
    } catch (error) {
      this.logger.error('Error deleting plan', { id, force, error });
      throw error;
    }
  }

  /**
   * Activate a plan
   */
  async activatePlan(id: string): Promise<Plan> {
    try {
      this.logger.info('Activating plan', { planId: id });

      const plan = await this.planRepository.activate(id);

      this.logger.info('Plan activated successfully', {
        planId: plan.planId,
        name: plan.name,
      });

      return plan;
    } catch (error) {
      this.logger.error('Error activating plan', { id, error });
      throw error;
    }
  }

  /**
   * Deactivate a plan
   */
  async deactivatePlan(id: string): Promise<Plan> {
    try {
      this.logger.info('Deactivating plan', { planId: id });

      const plan = await this.planRepository.deactivate(id);

      this.logger.info('Plan deactivated successfully', {
        planId: plan.planId,
        name: plan.name,
      });

      return plan;
    } catch (error) {
      this.logger.error('Error deactivating plan', { id, error });
      throw error;
    }
  }

  /**
   * Get plan statistics
   */
  async getPlanStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    visible: number;
    hidden: number;
  }> {
    try {
      this.logger.debug('Getting plan statistics');

      const [total, active, visible] = await Promise.all([
        this.planRepository.count(),
        this.planRepository.count({ isActive: true }),
        this.planRepository.count({ isVisible: true }),
      ]);

      const stats = {
        total,
        active,
        inactive: total - active,
        visible,
        hidden: total - visible,
      };

      this.logger.debug('Plan statistics retrieved', stats);

      return stats;
    } catch (error) {
      this.logger.error('Error getting plan statistics', { error });
      throw error;
    }
  }

  /**
   * Reorder plans (update sort order)
   */
  async reorderPlans(
    planOrders: Array<{ id: string; sortOrder: number }>,
  ): Promise<Plan[]> {
    try {
      this.logger.info('Reordering plans', { count: planOrders.length });

      // Validate all plan IDs exist
      const planIds = planOrders.map((po) => po.id);
      const existingPlans = await Promise.all(
        planIds.map((id) => this.planRepository.findById(id)),
      );

      const missingPlans = existingPlans
        .map((plan, index) => (plan ? null : planIds[index]))
        .filter((id) => id !== null);

      if (missingPlans.length > 0) {
        throw new ValidationError(
          `Plans not found: ${missingPlans.join(', ')}`,
          'PLANS_NOT_FOUND',
        );
      }

      // Update sort orders
      const updatePromises = planOrders.map(({ id, sortOrder }) =>
        this.planRepository.update(id, { sortOrder }),
      );

      const updatedPlans = await Promise.all(updatePromises);

      this.logger.info('Plans reordered successfully', {
        count: updatedPlans.length,
      });

      return updatedPlans;
    } catch (error) {
      this.logger.error('Error reordering plans', { planOrders, error });
      throw error;
    }
  }

  /**
   * Duplicate a plan with optional modifications
   */
  async duplicatePlan(
    sourceId: string,
    modifications: Partial<PlanCreateData> = {},
  ): Promise<Plan> {
    try {
      this.logger.info('Duplicating plan', { sourceId, modifications });

      // Get source plan
      const sourcePlan = await this.planRepository.findById(sourceId);
      if (!sourcePlan) {
        throw new ValidationError(
          `Source plan ${sourceId} not found`,
          'SOURCE_PLAN_NOT_FOUND',
        );
      }

      // Get source plan features
      const sourceFeatures =
        await this.planFeatureRepository.findByPlanId(sourceId);

      // Create new plan data
      const newPlanData: PlanCreateData = {
        name: modifications.name || `${sourcePlan.name} (Copy)`,
        slug: modifications.slug || `${sourcePlan.slug}-copy`,
        description: modifications.description || sourcePlan.description,
        price:
          modifications.price !== undefined
            ? modifications.price
            : sourcePlan.price,
        currency: sourcePlan.currency,
        billingInterval:
          modifications.billingInterval || sourcePlan.billingInterval,
        isActive:
          modifications.isActive !== undefined ? modifications.isActive : false, // Default inactive for copies
        sortOrder:
          modifications.sortOrder !== undefined
            ? modifications.sortOrder
            : sourcePlan.sortOrder + 1,
        metadata: sourcePlan.metadata,
      };

      // Create the new plan
      const newPlan = await this.createPlan(newPlanData);

      // Copy features if source has any
      if (sourceFeatures.length > 0) {
        const newPlanFeatures = sourceFeatures.map((sf) => ({
          planId: newPlan.planId,
          featureId: sf.featureId,
          value: sf.value,
          isEnabled: sf.isEnabled,
        }));

        await this.planFeatureRepository.createMany(newPlanFeatures);

        this.logger.info(
          `Copied ${sourceFeatures.length} features to new plan`,
        );
      }

      this.logger.info('Plan duplicated successfully', {
        sourceId,
        newPlanId: newPlan.planId,
        featuresCount: sourceFeatures.length,
      });

      return newPlan;
    } catch (error) {
      this.logger.error('Error duplicating plan', {
        sourceId,
        modifications,
        error,
      });
      throw error;
    }
  }

  /**
   * Private helper to validate plan data with business rules
   */
  private async validatePlanData(
    data: PlanCreateData | PlanUpdateData,
    excludeId?: string,
  ): Promise<void> {
    // Note: Name uniqueness would need to be implemented via a search method
    // For now, we'll rely on the model/repository validation

    // Slug uniqueness check (if slug is being set/updated)
    if (data.slug) {
      const existingBySlug = await this.planRepository.findBySlug(data.slug);
      if (existingBySlug && existingBySlug.planId !== excludeId) {
        throw new ValidationError(
          `Plan slug '${data.slug}' already exists`,
          'DUPLICATE_SLUG',
        );
      }
    }

    // Business rule: Cannot have sortOrder less than 0
    if (data.sortOrder !== undefined && data.sortOrder < 0) {
      throw new ValidationError(
        'Sort order cannot be negative',
        'INVALID_SORT_ORDER',
      );
    }
  }
}

export default PlanService;
