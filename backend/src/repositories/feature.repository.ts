import { PrismaClient } from '@prisma/client';
import {
  BaseRepository,
  DatabaseError,
  ValidationError,
  FindOptions,
} from './base.repository';
import {
  Feature,
  FeatureCreateData,
  FeatureUpdateData,
} from '../models/feature.model';

/**
 * Repository for Feature entity data access operations
 * Extends BaseRepository to provide feature-specific database operations
 */
export class FeatureRepository extends BaseRepository<Feature> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'features');
  }

  /**
   * Find a feature by ID
   */
  async findById(id: string): Promise<Feature | null> {
    try {
      this.logger.debug(`Finding feature by ID: ${id}`);
      this.validateUUID(id, 'featureId');

      const feature = await this.prisma.feature.findUnique({
        where: { featureId: id },
      });

      if (!feature) {
        this.logger.debug(`Feature not found: ${id}`);
        return null;
      }

      this.logger.debug(`Feature found: ${feature.featureId}`);
      return Feature.fromDatabase(feature);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error finding feature by ID', { id, error });
      this.handleDatabaseError(error, 'find feature by ID');
    }
  }

  /**
   * Find a feature by key name
   */
  async findByKeyName(keyName: string): Promise<Feature | null> {
    try {
      this.logger.debug(`Finding feature by key name: ${keyName}`);

      if (!keyName || typeof keyName !== 'string') {
        throw new ValidationError(
          'Key name is required and must be a string',
          'INVALID_KEY_NAME',
        );
      }

      const feature = await this.prisma.feature.findUnique({
        where: { keyName },
      });

      if (!feature) {
        this.logger.debug(`Feature not found by key name: ${keyName}`);
        return null;
      }

      this.logger.debug(`Feature found by key name: ${feature.featureId}`);
      return Feature.fromDatabase(feature);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error finding feature by key name', {
        keyName,
        error,
      });
      this.handleDatabaseError(error, 'find feature by key name');
    }
  }

  /**
   * Find features with advanced filtering and search capabilities
   */
  async findMany(
    options: {
      search?: string;
      category?: string;
      isActive?: boolean;
      isBoolean?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
  ): Promise<Feature[]> {
    try {
      this.logger.debug('Finding features with options', options);

      const {
        search,
        category,
        isActive,
        isBoolean,
        page = 1,
        limit = 50,
        sortBy = 'displayName',
        sortOrder = 'asc',
      } = options;

      // Build where conditions
      const where: any = {};

      // Search across display name, key name, and description
      if (search && typeof search === 'string') {
        where.OR = [
          { displayName: { contains: search, mode: 'insensitive' } },
          { keyName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Filter by category
      if (category && typeof category === 'string') {
        where.category = category;
      }

      // Filter by active status
      if (typeof isActive === 'boolean') {
        where.isActive = isActive;
      }

      // Filter by feature type (boolean vs value-based)
      if (typeof isBoolean === 'boolean') {
        where.isBoolean = isBoolean;
      }

      // Validate sort field
      const validSortFields = [
        'displayName',
        'keyName',
        'category',
        'isActive',
        'createdAt',
        'updatedAt',
      ];
      if (!validSortFields.includes(sortBy)) {
        throw new ValidationError(
          `Invalid sort field: ${sortBy}`,
          'INVALID_SORT_FIELD',
        );
      }

      // Build order by
      const orderBy = { [sortBy]: sortOrder };

      const features = await this.prisma.feature.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });

      this.logger.debug(`Found ${features.length} features`);
      return features.map((feature) => Feature.fromDatabase(feature));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error finding features', { options, error });
      this.handleDatabaseError(error, 'find features');
    }
  }

  /**
   * Find features by category
   */
  async findByCategory(category: string): Promise<Feature[]> {
    try {
      this.logger.debug(`Finding features by category: ${category}`);

      if (!category || typeof category !== 'string') {
        throw new ValidationError(
          'Category is required and must be a string',
          'INVALID_CATEGORY',
        );
      }

      const features = await this.prisma.feature.findMany({
        where: { category },
        orderBy: { displayName: 'asc' },
      });

      this.logger.debug(
        `Found ${features.length} features in category: ${category}`,
      );
      return features.map((feature) => Feature.fromDatabase(feature));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error finding features by category', {
        category,
        error,
      });
      this.handleDatabaseError(error, 'find features by category');
    }
  }

  /**
   * Find all active features
   */
  async findActive(): Promise<Feature[]> {
    try {
      this.logger.debug('Finding all active features');

      const features = await this.prisma.feature.findMany({
        where: { isActive: true },
        orderBy: { displayName: 'asc' },
      });

      this.logger.debug(`Found ${features.length} active features`);
      return features.map((feature) => Feature.fromDatabase(feature));
    } catch (error) {
      this.logger.error('Error finding active features', { error });
      this.handleDatabaseError(error, 'find active features');
    }
  }

  /**
   * Get unique categories
   */
  async getCategories(): Promise<string[]> {
    try {
      this.logger.debug('Getting feature categories');

      const result = await this.prisma.feature.findMany({
        select: { category: true },
        where: { category: { not: null } },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });

      const categories = result
        .map((item) => item.category)
        .filter((category): category is string => category !== null);

      this.logger.debug(`Found ${categories.length} categories`);
      return categories;
    } catch (error) {
      this.logger.error('Error getting feature categories', { error });
      this.handleDatabaseError(error, 'get feature categories');
    }
  }

  /**
   * Create a new feature
   */
  async create(data: FeatureCreateData): Promise<Feature> {
    try {
      this.logger.debug('Creating new feature', { keyName: data.keyName });

      // Validate input data
      Feature.validate(data);

      // Check for duplicate key name
      const existing = await this.findByKeyName(data.keyName);
      if (existing) {
        throw new ValidationError(
          `Feature with key name '${data.keyName}' already exists`,
          'DUPLICATE_KEY_NAME',
        );
      }

      // Prepare data for database
      const dbData = Feature.prepareForCreation(data);

      const createdFeature = await this.prisma.feature.create({
        data: dbData,
      });

      this.logger.info('Feature created successfully', {
        featureId: createdFeature.featureId,
        keyName: createdFeature.keyName,
      });

      return Feature.fromDatabase(createdFeature);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error creating feature', { data, error });
      this.handleDatabaseError(error, 'create feature');
    }
  }

  /**
   * Update an existing feature
   */
  async update(id: string, data: FeatureUpdateData): Promise<Feature> {
    try {
      this.logger.debug(`Updating feature: ${id}`, data);
      this.validateUUID(id, 'featureId');

      // Check if feature exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new ValidationError(
          `Feature with ID ${id} not found`,
          'FEATURE_NOT_FOUND',
        );
      }

      // Validate the update data
      Feature.validate(data);

      // Check for key name conflicts if key name is being updated
      if (data.keyName && data.keyName !== existing.keyName) {
        const keyNameConflict = await this.findByKeyName(data.keyName);
        if (keyNameConflict) {
          throw new ValidationError(
            `Feature with key name '${data.keyName}' already exists`,
            'DUPLICATE_KEY_NAME',
          );
        }
      }

      // Prepare data for database update
      const dbData = Feature.prepareForUpdate(data);

      const updatedFeature = await this.prisma.feature.update({
        where: { featureId: id },
        data: dbData,
      });

      this.logger.info('Feature updated successfully', {
        featureId: updatedFeature.featureId,
        keyName: updatedFeature.keyName,
      });

      return Feature.fromDatabase(updatedFeature);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error updating feature', { id, data, error });
      this.handleDatabaseError(error, 'update feature');
    }
  }

  /**
   * Delete a feature (soft delete by setting isActive to false)
   */
  async delete(id: string): Promise<boolean> {
    try {
      this.logger.debug(`Deleting feature: ${id}`);
      this.validateUUID(id, 'featureId');

      // Check if feature exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new ValidationError(
          `Feature with ID ${id} not found`,
          'FEATURE_NOT_FOUND',
        );
      }

      // Check if feature is used in any plan features
      const planFeatureCount = await this.prisma.planFeature.count({
        where: { featureId: id },
      });

      if (planFeatureCount > 0) {
        // Soft delete - just deactivate
        await this.prisma.feature.update({
          where: { featureId: id },
          data: { isActive: false },
        });

        this.logger.info(
          'Feature deactivated (soft delete) due to plan associations',
          {
            featureId: id,
            planFeatureCount,
          },
        );
      } else {
        // Hard delete if not referenced
        await this.prisma.feature.delete({
          where: { featureId: id },
        });

        this.logger.info('Feature hard deleted', { featureId: id });
      }

      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error('Error deleting feature', { id, error });
      this.handleDatabaseError(error, 'delete feature');
    }
  }

  /**
   * Activate a feature
   */
  async activate(id: string): Promise<Feature> {
    try {
      this.logger.debug(`Activating feature: ${id}`);
      return await this.update(id, { isActive: true });
    } catch (error) {
      this.logger.error('Error activating feature', { id, error });
      throw error;
    }
  }

  /**
   * Deactivate a feature
   */
  async deactivate(id: string): Promise<Feature> {
    try {
      this.logger.debug(`Deactivating feature: ${id}`);
      return await this.update(id, { isActive: false });
    } catch (error) {
      this.logger.error('Error deactivating feature', { id, error });
      throw error;
    }
  }

  /**
   * Count features with optional filtering
   */
  async count(filters?: {
    search?: string;
    category?: string;
    isActive?: boolean;
    isBoolean?: boolean;
  }): Promise<number> {
    try {
      this.logger.debug('Counting features with filters', filters);

      const where: any = {};

      if (filters) {
        const { search, category, isActive, isBoolean } = filters;

        // Search across display name, key name, and description
        if (search && typeof search === 'string') {
          where.OR = [
            { displayName: { contains: search, mode: 'insensitive' } },
            { keyName: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ];
        }

        // Filter by category
        if (category && typeof category === 'string') {
          where.category = category;
        }

        // Filter by active status
        if (typeof isActive === 'boolean') {
          where.isActive = isActive;
        }

        // Filter by feature type
        if (typeof isBoolean === 'boolean') {
          where.isBoolean = isBoolean;
        }
      }

      const count = await this.prisma.feature.count({ where });

      this.logger.debug(`Feature count: ${count}`);
      return count;
    } catch (error) {
      this.logger.error('Error counting features', { filters, error });
      this.handleDatabaseError(error, 'count features');
    }
  }
}

export default FeatureRepository;
