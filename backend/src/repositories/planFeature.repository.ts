import { PrismaClient } from '@prisma/client';
import {
  BaseRepository,
  DatabaseError,
  ValidationError,
  FindOptions,
} from './base.repository';
import {
  PlanFeature,
  PlanFeatureCreateData,
  PlanFeatureUpdateData,
} from '../models/planFeature.model';

/**
 * Repository for PlanFeature entity data access operations
 * Extends BaseRepository to provide plan-feature relationship database operations
 * Specializes in bulk operations for entitlement matrix management
 */
export class PlanFeatureRepository extends BaseRepository<PlanFeature> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'planFeatures');
  }

  /**
   * Find a plan feature by ID
   */
  async findById(id: string): Promise<PlanFeature | null> {
    try {
      this.logger.debug(`Finding plan feature by ID: ${id}`);
      this.validateUUID(id, 'planFeatureId');

      const planFeature = await this.prisma.planFeature.findUnique({
        where: { planFeatureId: id },
      });

      if (!planFeature) {
        this.logger.debug(`Plan feature not found: ${id}`);
        return null;
      }

      this.logger.debug(`Plan feature found: ${planFeature.planFeatureId}`);
      return PlanFeature.fromDatabase(planFeature);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error finding plan feature by ID', { id, error });
      this.handleDatabaseError(error, 'find plan feature by ID');
    }
  }

  /**
   * Find plan feature by plan ID and feature ID combination
   */
  async findByPlanAndFeature(
    planId: string,
    featureId: string,
  ): Promise<PlanFeature | null> {
    try {
      this.logger.debug(
        `Finding plan feature by plan and feature: ${planId}, ${featureId}`,
      );
      this.validateUUID(planId, 'planId');
      this.validateUUID(featureId, 'featureId');

      const planFeature = await this.prisma.planFeature.findUnique({
        where: {
          planId_featureId: {
            planId,
            featureId,
          },
        },
      });

      if (!planFeature) {
        this.logger.debug(
          `Plan feature not found for plan ${planId} and feature ${featureId}`,
        );
        return null;
      }

      this.logger.debug(`Plan feature found: ${planFeature.planFeatureId}`);
      return PlanFeature.fromDatabase(planFeature);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error finding plan feature by plan and feature', {
        planId,
        featureId,
        error,
      });
      this.handleDatabaseError(error, 'find plan feature by plan and feature');
    }
  }

  /**
   * Find all plan features for a specific plan
   */
  async findByPlanId(planId: string): Promise<PlanFeature[]> {
    try {
      this.logger.debug(`Finding plan features for plan: ${planId}`);
      this.validateUUID(planId, 'planId');

      const planFeatures = await this.prisma.planFeature.findMany({
        where: { planId },
        orderBy: { createdAt: 'asc' },
      });

      this.logger.debug(
        `Found ${planFeatures.length} plan features for plan: ${planId}`,
      );
      return planFeatures.map((pf) => PlanFeature.fromDatabase(pf));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error finding plan features by plan ID', {
        planId,
        error,
      });
      this.handleDatabaseError(error, 'find plan features by plan ID');
    }
  }

  /**
   * Find all plan features for a specific feature across plans
   */
  async findByFeatureId(featureId: string): Promise<PlanFeature[]> {
    try {
      this.logger.debug(`Finding plan features for feature: ${featureId}`);
      this.validateUUID(featureId, 'featureId');

      const planFeatures = await this.prisma.planFeature.findMany({
        where: { featureId },
        orderBy: { createdAt: 'asc' },
      });

      this.logger.debug(
        `Found ${planFeatures.length} plan features for feature: ${featureId}`,
      );
      return planFeatures.map((pf) => PlanFeature.fromDatabase(pf));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error finding plan features by feature ID', {
        featureId,
        error,
      });
      this.handleDatabaseError(error, 'find plan features by feature ID');
    }
  }

  /**
   * Find plan features with advanced filtering
   */
  async findMany(
    options: {
      planIds?: string[];
      featureIds?: string[];
      isEnabled?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
  ): Promise<PlanFeature[]> {
    try {
      this.logger.debug('Finding plan features with options', options);

      const {
        planIds,
        featureIds,
        isEnabled,
        page = 1,
        limit = 100,
        sortBy = 'createdAt',
        sortOrder = 'asc',
      } = options;

      // Build where conditions
      const where: any = {};

      if (planIds && planIds.length > 0) {
        // Validate all plan IDs
        planIds.forEach((id) => this.validateUUID(id, 'planId'));
        where.planId = { in: planIds };
      }

      if (featureIds && featureIds.length > 0) {
        // Validate all feature IDs
        featureIds.forEach((id) => this.validateUUID(id, 'featureId'));
        where.featureId = { in: featureIds };
      }

      if (typeof isEnabled === 'boolean') {
        where.isEnabled = isEnabled;
      }

      // Validate sort field
      const validSortFields = [
        'createdAt',
        'updatedAt',
        'planId',
        'featureId',
        'isEnabled',
      ];
      if (!validSortFields.includes(sortBy)) {
        throw new ValidationError(
          `Invalid sort field: ${sortBy}`,
          'INVALID_SORT_FIELD',
        );
      }

      const planFeatures = await this.prisma.planFeature.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      this.logger.debug(`Found ${planFeatures.length} plan features`);
      return planFeatures.map((pf) => PlanFeature.fromDatabase(pf));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error finding plan features', { options, error });
      this.handleDatabaseError(error, 'find plan features');
    }
  }

  /**
   * Find enabled plan features for a plan (for entitlement checks)
   */
  async findEnabledByPlanId(planId: string): Promise<PlanFeature[]> {
    try {
      this.logger.debug(`Finding enabled plan features for plan: ${planId}`);
      this.validateUUID(planId, 'planId');

      const planFeatures = await this.prisma.planFeature.findMany({
        where: {
          planId,
          isEnabled: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      this.logger.debug(
        `Found ${planFeatures.length} enabled plan features for plan: ${planId}`,
      );
      return planFeatures.map((pf) => PlanFeature.fromDatabase(pf));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error finding enabled plan features by plan ID', {
        planId,
        error,
      });
      this.handleDatabaseError(error, 'find enabled plan features by plan ID');
    }
  }

  /**
   * Create a new plan feature
   */
  async create(data: PlanFeatureCreateData): Promise<PlanFeature> {
    try {
      this.logger.debug('Creating new plan feature', {
        planId: data.planId,
        featureId: data.featureId,
      });

      // Validate input data
      PlanFeature.validate(data);

      // Check for duplicate plan-feature combination
      const existing = await this.findByPlanAndFeature(
        data.planId,
        data.featureId,
      );
      if (existing) {
        throw new ValidationError(
          `Plan feature already exists for plan ${data.planId} and feature ${data.featureId}`,
          'DUPLICATE_PLAN_FEATURE',
        );
      }

      // Prepare data for database
      const dbData = PlanFeature.prepareForCreation(data);

      const createdPlanFeature = await this.prisma.planFeature.create({
        data: dbData,
      });

      this.logger.info('Plan feature created successfully', {
        planFeatureId: createdPlanFeature.planFeatureId,
        planId: createdPlanFeature.planId,
        featureId: createdPlanFeature.featureId,
      });

      return PlanFeature.fromDatabase(createdPlanFeature);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error creating plan feature', { data, error });
      this.handleDatabaseError(error, 'create plan feature');
    }
  }

  /**
   * Create multiple plan features in bulk
   */
  async createMany(data: PlanFeatureCreateData[]): Promise<PlanFeature[]> {
    try {
      this.logger.debug(`Creating ${data.length} plan features in bulk`);

      if (data.length === 0) {
        return [];
      }

      // Validate all data
      data.forEach((item, index) => {
        try {
          PlanFeature.validate(item);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          throw new ValidationError(
            `Validation failed for item at index ${index}: ${errorMessage}`,
            'BULK_VALIDATION_ERROR',
          );
        }
      });

      // Check for duplicates within the batch
      const planFeaturePairs = data.map(
        (item) => `${item.planId}-${item.featureId}`,
      );
      const uniquePairs = new Set(planFeaturePairs);
      if (uniquePairs.size !== planFeaturePairs.length) {
        throw new ValidationError(
          'Duplicate plan-feature combinations found in batch',
          'DUPLICATE_IN_BATCH',
        );
      }

      // Check for existing plan features
      const existingChecks = await Promise.all(
        data.map((item) =>
          this.findByPlanAndFeature(item.planId, item.featureId),
        ),
      );

      const existingPlanFeatures = existingChecks.filter((pf) => pf !== null);
      if (existingPlanFeatures.length > 0) {
        throw new ValidationError(
          `${existingPlanFeatures.length} plan features already exist`,
          'BULK_DUPLICATE_ERROR',
        );
      }

      // Prepare all data for database
      const dbDataArray = data.map((item) =>
        PlanFeature.prepareForCreation(item),
      );

      // Execute bulk create in transaction
      const result = await this.executeTransaction(async (tx) => {
        const createdPlanFeatures = await tx.planFeature.createMany({
          data: dbDataArray,
        });

        // Fetch the created records to return full objects
        const planIds = data.map((item) => item.planId);
        const featureIds = data.map((item) => item.featureId);

        return await tx.planFeature.findMany({
          where: {
            planId: { in: planIds },
            featureId: { in: featureIds },
          },
          orderBy: { createdAt: 'desc' },
          take: data.length,
        });
      });

      this.logger.info(`Bulk created ${result.length} plan features`);
      return result.map((pf) => PlanFeature.fromDatabase(pf));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error creating plan features in bulk', {
        count: data.length,
        error,
      });
      this.handleDatabaseError(error, 'create plan features in bulk');
    }
  }

  /**
   * Update an existing plan feature
   */
  async update(id: string, data: PlanFeatureUpdateData): Promise<PlanFeature> {
    try {
      this.logger.debug(`Updating plan feature: ${id}`, data);
      this.validateUUID(id, 'planFeatureId');

      // Check if plan feature exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new ValidationError(
          `Plan feature with ID ${id} not found`,
          'PLAN_FEATURE_NOT_FOUND',
        );
      }

      // Validate the update data
      PlanFeature.validate(data);

      // Prepare data for database update
      const dbData = PlanFeature.prepareForUpdate(data);

      const updatedPlanFeature = await this.prisma.planFeature.update({
        where: { planFeatureId: id },
        data: dbData,
      });

      this.logger.info('Plan feature updated successfully', {
        planFeatureId: updatedPlanFeature.planFeatureId,
        planId: updatedPlanFeature.planId,
        featureId: updatedPlanFeature.featureId,
      });

      return PlanFeature.fromDatabase(updatedPlanFeature);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error updating plan feature', { id, data, error });
      this.handleDatabaseError(error, 'update plan feature');
    }
  }

  /**
   * Update multiple plan features in bulk
   */
  async updateMany(
    updates: Array<{ id: string; data: PlanFeatureUpdateData }>,
  ): Promise<PlanFeature[]> {
    try {
      this.logger.debug(`Updating ${updates.length} plan features in bulk`);

      if (updates.length === 0) {
        return [];
      }

      // Validate all data
      updates.forEach((update, index) => {
        try {
          this.validateUUID(update.id, 'planFeatureId');
          PlanFeature.validate(update.data);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          throw new ValidationError(
            `Validation failed for update at index ${index}: ${errorMessage}`,
            'BULK_UPDATE_VALIDATION_ERROR',
          );
        }
      });

      // Execute bulk update in transaction
      const result = await this.executeTransaction(async (tx) => {
        const updatePromises = updates.map(async ({ id, data }) => {
          const dbData = PlanFeature.prepareForUpdate(data);
          return await tx.planFeature.update({
            where: { planFeatureId: id },
            data: dbData,
          });
        });

        return await Promise.all(updatePromises);
      });

      this.logger.info(`Bulk updated ${result.length} plan features`);
      return result.map((pf) => PlanFeature.fromDatabase(pf));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error updating plan features in bulk', {
        count: updates.length,
        error,
      });
      this.handleDatabaseError(error, 'update plan features in bulk');
    }
  }

  /**
   * Delete a plan feature
   */
  async delete(id: string): Promise<boolean> {
    try {
      this.logger.debug(`Deleting plan feature: ${id}`);
      this.validateUUID(id, 'planFeatureId');

      // Check if plan feature exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new ValidationError(
          `Plan feature with ID ${id} not found`,
          'PLAN_FEATURE_NOT_FOUND',
        );
      }

      await this.prisma.planFeature.delete({
        where: { planFeatureId: id },
      });

      this.logger.info('Plan feature deleted successfully', {
        planFeatureId: id,
        planId: existing.planId,
        featureId: existing.featureId,
      });

      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error deleting plan feature', { id, error });
      this.handleDatabaseError(error, 'delete plan feature');
    }
  }

  /**
   * Delete all plan features for a specific plan
   */
  async deleteByPlanId(planId: string): Promise<number> {
    try {
      this.logger.debug(`Deleting all plan features for plan: ${planId}`);
      this.validateUUID(planId, 'planId');

      const deleteResult = await this.prisma.planFeature.deleteMany({
        where: { planId },
      });

      this.logger.info(
        `Deleted ${deleteResult.count} plan features for plan: ${planId}`,
      );
      return deleteResult.count;
    } catch (error) {
      this.logger.error('Error deleting plan features by plan ID', {
        planId,
        error,
      });
      this.handleDatabaseError(error, 'delete plan features by plan ID');
    }
  }

  /**
   * Delete all plan features for a specific feature
   */
  async deleteByFeatureId(featureId: string): Promise<number> {
    try {
      this.logger.debug(`Deleting all plan features for feature: ${featureId}`);
      this.validateUUID(featureId, 'featureId');

      const deleteResult = await this.prisma.planFeature.deleteMany({
        where: { featureId },
      });

      this.logger.info(
        `Deleted ${deleteResult.count} plan features for feature: ${featureId}`,
      );
      return deleteResult.count;
    } catch (error) {
      this.logger.error('Error deleting plan features by feature ID', {
        featureId,
        error,
      });
      this.handleDatabaseError(error, 'delete plan features by feature ID');
    }
  }

  /**
   * Replace all features for a plan (bulk operation)
   */
  async replaceAllForPlan(
    planId: string,
    newFeatures: PlanFeatureCreateData[],
  ): Promise<PlanFeature[]> {
    try {
      this.logger.debug(
        `Replacing all features for plan ${planId} with ${newFeatures.length} new features`,
      );
      this.validateUUID(planId, 'planId');

      // Validate all new features belong to the same plan
      newFeatures.forEach((feature, index) => {
        if (feature.planId !== planId) {
          throw new ValidationError(
            `Feature at index ${index} has planId ${feature.planId} but expected ${planId}`,
            'PLAN_ID_MISMATCH',
          );
        }
      });

      // Execute replacement in transaction
      const result = await this.executeTransaction(async (tx) => {
        // Delete existing plan features
        await tx.planFeature.deleteMany({
          where: { planId },
        });

        // Create new plan features if any
        if (newFeatures.length > 0) {
          const dbDataArray = newFeatures.map((item) =>
            PlanFeature.prepareForCreation(item),
          );

          await tx.planFeature.createMany({
            data: dbDataArray,
          });

          // Fetch the created records
          return await tx.planFeature.findMany({
            where: { planId },
            orderBy: { createdAt: 'asc' },
          });
        }

        return [];
      });

      this.logger.info(
        `Replaced all features for plan ${planId}. New count: ${result.length}`,
      );
      return result.map((pf) => PlanFeature.fromDatabase(pf));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error replacing all features for plan', {
        planId,
        newFeatureCount: newFeatures.length,
        error,
      });
      this.handleDatabaseError(error, 'replace all features for plan');
    }
  }

  /**
   * Count plan features with optional filtering
   */
  async count(filters?: {
    planIds?: string[];
    featureIds?: string[];
    isEnabled?: boolean;
  }): Promise<number> {
    try {
      this.logger.debug('Counting plan features with filters', filters);

      const where: any = {};

      if (filters) {
        const { planIds, featureIds, isEnabled } = filters;

        if (planIds && planIds.length > 0) {
          planIds.forEach((id) => this.validateUUID(id, 'planId'));
          where.planId = { in: planIds };
        }

        if (featureIds && featureIds.length > 0) {
          featureIds.forEach((id) => this.validateUUID(id, 'featureId'));
          where.featureId = { in: featureIds };
        }

        if (typeof isEnabled === 'boolean') {
          where.isEnabled = isEnabled;
        }
      }

      const count = await this.prisma.planFeature.count({ where });

      this.logger.debug(`Plan feature count: ${count}`);
      return count;
    } catch (error) {
      this.logger.error('Error counting plan features', { filters, error });
      this.handleDatabaseError(error, 'count plan features');
    }
  }

  /**
   * Enable a plan feature
   */
  async enable(id: string): Promise<PlanFeature> {
    try {
      this.logger.debug(`Enabling plan feature: ${id}`);
      return await this.update(id, { isEnabled: true });
    } catch (error) {
      this.logger.error('Error enabling plan feature', { id, error });
      throw error;
    }
  }

  /**
   * Disable a plan feature
   */
  async disable(id: string): Promise<PlanFeature> {
    try {
      this.logger.debug(`Disabling plan feature: ${id}`);
      return await this.update(id, { isEnabled: false });
    } catch (error) {
      this.logger.error('Error disabling plan feature', { id, error });
      throw error;
    }
  }

  /**
   * Get entitlement matrix - all plan-feature relationships with plan and feature details
   */
  async getEntitlementMatrix(
    options: {
      planIds?: string[];
      featureIds?: string[];
      isEnabled?: boolean;
    } = {},
  ): Promise<
    Array<{
      planFeature: PlanFeature;
      planName: string;
      featureName: string;
      featureKeyName: string;
    }>
  > {
    try {
      this.logger.debug('Getting entitlement matrix', options);

      const { planIds, featureIds, isEnabled } = options;

      const where: any = {};

      if (planIds && planIds.length > 0) {
        planIds.forEach((id) => this.validateUUID(id, 'planId'));
        where.planId = { in: planIds };
      }

      if (featureIds && featureIds.length > 0) {
        featureIds.forEach((id) => this.validateUUID(id, 'featureId'));
        where.featureId = { in: featureIds };
      }

      if (typeof isEnabled === 'boolean') {
        where.isEnabled = isEnabled;
      }

      const results = await this.prisma.planFeature.findMany({
        where,
        include: {
          plan: {
            select: { name: true },
          },
          feature: {
            select: { displayName: true, keyName: true },
          },
        },
        orderBy: [
          { plan: { name: 'asc' } },
          { feature: { displayName: 'asc' } },
        ],
      });

      this.logger.debug(`Found ${results.length} entitlement matrix entries`);

      return results.map((result) => ({
        planFeature: PlanFeature.fromDatabase(result),
        planName: result.plan.name,
        featureName: result.feature.displayName,
        featureKeyName: result.feature.keyName,
      }));
    } catch (error) {
      this.logger.error('Error getting entitlement matrix', { options, error });
      this.handleDatabaseError(error, 'get entitlement matrix');
    }
  }
}

export default PlanFeatureRepository;
