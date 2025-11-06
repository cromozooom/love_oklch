import { PrismaClient } from '@prisma/client';
import {
  BaseRepository,
  DatabaseError,
  ValidationError,
  FindOptions,
} from './base.repository';
import { Plan, PlanCreateData, PlanUpdateData } from '../models/plan.model';

/**
 * Repository for Plan entity data access operations
 * Extends BaseRepository to provide plan-specific database operations
 */
export class PlanRepository extends BaseRepository<Plan> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'plans');
  }

  /**
   * Find a plan by ID
   */
  async findById(id: string): Promise<Plan | null> {
    try {
      this.logger.debug(`Finding plan by ID: ${id}`);
      this.validateUUID(id, 'planId');

      const plan = await this.prisma.plan.findUnique({
        where: { planId: id },
      });

      if (!plan) {
        this.logger.debug(`Plan not found: ${id}`);
        return null;
      }

      this.logger.debug(`Plan found: ${plan.planId}`);
      return Plan.fromDatabase(plan);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error finding plan by ID', { id, error });
      this.handleDatabaseError(error, 'find plan by ID');
    }
  }

  /**
   * Find a plan by slug
   */
  async findBySlug(slug: string): Promise<Plan | null> {
    try {
      this.logger.debug(`Finding plan by slug: ${slug}`);

      const plan = await this.prisma.plan.findUnique({
        where: { slug },
      });

      if (!plan) {
        this.logger.debug(`Plan not found by slug: ${slug}`);
        return null;
      }

      this.logger.debug(`Plan found by slug: ${plan.planId}`);
      return Plan.fromDatabase(plan);
    } catch (error) {
      this.logger.error('Error finding plan by slug', { slug, error });
      this.handleDatabaseError(error, 'find plan by slug');
    }
  }

  /**
   * Find multiple plans with optional filtering
   */
  async findMany(filter: any = {}, options: FindOptions = {}): Promise<Plan[]> {
    try {
      this.logger.debug('Finding plans with filter', { filter, options });

      const pagination = this.buildPagination(options);
      const sort = this.buildSort(options) || { sortOrder: 'asc' };

      const plans = await this.prisma.plan.findMany({
        where: this.buildWhereClause(filter),
        ...pagination,
        orderBy: sort,
      });

      this.logger.debug(`Found ${plans.length} plans`);
      return plans.map((plan: any) => Plan.fromDatabase(plan));
    } catch (error) {
      this.logger.error('Error finding plans', { filter, options, error });
      this.handleDatabaseError(error, 'find plans');
    }
  }

  /**
   * Find active plans only
   */
  async findActive(options: FindOptions = {}): Promise<Plan[]> {
    return this.findMany({ isActive: true }, options);
  }

  /**
   * Find plans by price range
   */
  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    options: FindOptions = {},
  ): Promise<Plan[]> {
    return this.findMany(
      {
        price: {
          gte: minPrice,
          lte: maxPrice,
        },
      },
      options,
    );
  }

  /**
   * Find free plans
   */
  async findFree(options: FindOptions = {}): Promise<Plan[]> {
    return this.findMany({ price: 0 }, options);
  }

  /**
   * Create a new plan
   */
  async create(data: PlanCreateData): Promise<Plan> {
    try {
      this.logger.debug('Creating plan', { data });

      const preparedData = Plan.prepareForCreation(data);

      const plan = await this.prisma.plan.create({
        data: preparedData,
      });

      this.logger.info(`Plan created: ${plan.planId}`, {
        planId: plan.planId,
        name: plan.name,
      });
      return Plan.fromDatabase(plan);
    } catch (error: any) {
      this.logger.error('Error creating plan', { data, error });

      if (error instanceof ValidationError) {
        throw error;
      }

      // Handle unique constraint violations
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('name')) {
          throw new ValidationError(
            'Plan name already exists',
            'PLAN_NAME_EXISTS',
          );
        }
        if (target?.includes('slug')) {
          throw new ValidationError(
            'Plan slug already exists',
            'PLAN_SLUG_EXISTS',
          );
        }
      }

      this.handleDatabaseError(error, 'create plan');
    }
  }

  /**
   * Update a plan by ID
   */
  async update(id: string, data: PlanUpdateData): Promise<Plan> {
    try {
      this.logger.debug('Updating plan', { id, data });
      this.validateUUID(id, 'planId');

      const preparedData = Plan.prepareForUpdate(data);

      const plan = await this.prisma.plan.update({
        where: { planId: id },
        data: preparedData,
      });

      this.logger.info(`Plan updated: ${plan.planId}`, { planId: plan.planId });
      return Plan.fromDatabase(plan);
    } catch (error: any) {
      this.logger.error('Error updating plan', { id, data, error });

      if (error instanceof ValidationError) {
        throw error;
      }

      // Handle unique constraint violations
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('name')) {
          throw new ValidationError(
            'Plan name already exists',
            'PLAN_NAME_EXISTS',
          );
        }
        if (target?.includes('slug')) {
          throw new ValidationError(
            'Plan slug already exists',
            'PLAN_SLUG_EXISTS',
          );
        }
      }

      this.handleDatabaseError(error, 'update plan');
    }
  }

  /**
   * Delete a plan by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      this.logger.debug('Deleting plan', { id });
      this.validateUUID(id, 'planId');

      await this.prisma.plan.delete({
        where: { planId: id },
      });

      this.logger.info(`Plan deleted: ${id}`);
      return true;
    } catch (error) {
      this.logger.error('Error deleting plan', { id, error });
      this.handleDatabaseError(error, 'delete plan');
    }
  }

  /**
   * Count plans with optional filtering
   */
  async count(filter: any = {}): Promise<number> {
    try {
      this.logger.debug('Counting plans', { filter });

      const count = await this.prisma.plan.count({
        where: this.buildWhereClause(filter),
      });

      this.logger.debug(`Plan count: ${count}`);
      return count;
    } catch (error) {
      this.logger.error('Error counting plans', { filter, error });
      this.handleDatabaseError(error, 'count plans');
    }
  }

  /**
   * Deactivate a plan instead of deleting it
   */
  async deactivate(id: string): Promise<Plan> {
    return this.update(id, { isActive: false });
  }

  /**
   * Activate a plan
   */
  async activate(id: string): Promise<Plan> {
    return this.update(id, { isActive: true });
  }

  /**
   * Get plans with their features
   */
  async findWithFeatures(
    filter: any = {},
    options: FindOptions = {},
  ): Promise<Plan[]> {
    try {
      this.logger.debug('Finding plans with features', { filter, options });

      const pagination = this.buildPagination(options);
      const sort = this.buildSort(options) || { sortOrder: 'asc' };

      const plans = await this.prisma.plan.findMany({
        where: this.buildWhereClause(filter),
        include: {
          planFeatures: {
            include: {
              feature: true,
            },
          },
        },
        ...pagination,
        orderBy: sort,
      });

      this.logger.debug(`Found ${plans.length} plans with features`);
      return plans.map((plan: any) => Plan.fromDatabase(plan));
    } catch (error) {
      this.logger.error('Error finding plans with features', {
        filter,
        options,
        error,
      });
      this.handleDatabaseError(error, 'find plans with features');
    }
  }

  /**
   * Build WHERE clause for filtering
   */
  private buildWhereClause(filter: any): any {
    const where: any = {};

    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter.name) {
      where.name = {
        contains: filter.name,
        mode: 'insensitive',
      };
    }

    if (filter.slug) {
      where.slug = filter.slug;
    }

    if (filter.price !== undefined) {
      if (typeof filter.price === 'number') {
        where.price = filter.price;
      } else if (
        filter.price.gte !== undefined ||
        filter.price.lte !== undefined
      ) {
        where.price = filter.price;
      }
    }

    if (filter.currency) {
      where.currency = filter.currency;
    }

    if (filter.billingInterval) {
      where.billingInterval = filter.billingInterval;
    }

    return where;
  }
}

export default PlanRepository;
