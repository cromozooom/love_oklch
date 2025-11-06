import { Request, Response } from 'express';
import {
  FeatureService,
  FeatureServiceCreateData,
  FeatureServiceUpdateData,
} from '../../services/feature.service';
import { FeatureRepository } from '../../repositories/feature.repository';
import { PlanFeatureRepository } from '../../repositories/planFeature.repository';
import { ValidationError } from '../../middleware/error.middleware';
import { AuthenticatedRequest } from '../../middleware/admin.middleware';
import { PrismaClient } from '@prisma/client';

/**
 * Admin Feature Management Controller
 * Handles CRUD operations for feature catalog management
 * Requires admin authentication via middleware
 */
export class AdminFeatureController {
  private featureService: FeatureService;

  constructor(prisma: PrismaClient) {
    const featureRepository = new FeatureRepository(prisma);
    const planFeatureRepository = new PlanFeatureRepository(prisma);
    this.featureService = new FeatureService(
      featureRepository,
      planFeatureRepository,
    );
  }

  /**
   * GET /admin/features
   * Get all features with optional filtering and search
   */
  async getFeatures(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        search,
        category,
        isActive,
        isBoolean,
        sortBy = 'displayName',
        sortOrder = 'asc',
        page = 1,
        limit = 50,
      } = req.query;

      const filters: any = {};

      if (search) filters.search = search as string;
      if (category) filters.category = category as string;
      if (isActive !== undefined) {
        filters.isActive =
          isActive === 'true' ? true : isActive === 'false' ? false : undefined;
      }
      if (isBoolean !== undefined) {
        filters.isBoolean =
          isBoolean === 'true'
            ? true
            : isBoolean === 'false'
              ? false
              : undefined;
      }
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);
      if (sortBy) filters.sortBy = sortBy as string;
      if (sortOrder) filters.sortOrder = sortOrder as 'asc' | 'desc';

      const features = await this.featureService.getFeatures(filters);

      res.json({
        success: true,
        data: features,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 50,
          total: features.length,
        },
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch features');
    }
  }

  /**
   * GET /admin/features/:id
   * Get a specific feature by ID
   */
  async getFeature(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Feature ID is required',
        });
        return;
      }

      const feature = await this.featureService.getFeatureById(id);

      res.json({
        success: true,
        data: feature,
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch feature');
    }
  }

  /**
   * POST /admin/features
   * Create a new feature
   */
  async createFeature(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const featureData: FeatureServiceCreateData = {
        keyName: req.body.keyName,
        displayName: req.body.displayName,
        description: req.body.description,
        category: req.body.category,
        isBoolean: req.body.isBoolean ?? true,
        defaultValue: req.body.defaultValue,
        validationSchema: req.body.validationSchema,
        isActive: req.body.isActive ?? true,
      };

      const feature = await this.featureService.createFeature(featureData);

      res.status(201).json({
        success: true,
        data: feature,
        message: 'Feature created successfully',
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to create feature');
    }
  }

  /**
   * PUT /admin/features/:id
   * Update an existing feature
   */
  async updateFeature(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Feature ID is required',
        });
        return;
      }

      const updateData: FeatureServiceUpdateData = {};

      // Only update provided fields
      if (req.body.displayName !== undefined)
        updateData.displayName = req.body.displayName;
      if (req.body.description !== undefined)
        updateData.description = req.body.description;
      if (req.body.category !== undefined)
        updateData.category = req.body.category;
      if (req.body.isBoolean !== undefined)
        updateData.isBoolean = req.body.isBoolean;
      if (req.body.defaultValue !== undefined)
        updateData.defaultValue = req.body.defaultValue;
      if (req.body.validationSchema !== undefined)
        updateData.validationSchema = req.body.validationSchema;
      if (req.body.isActive !== undefined)
        updateData.isActive = req.body.isActive;

      const feature = await this.featureService.updateFeature(id, updateData);

      res.json({
        success: true,
        data: feature,
        message: 'Feature updated successfully',
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to update feature');
    }
  }

  /**
   * DELETE /admin/features/:id
   * Delete a feature
   */
  async deleteFeature(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Feature ID is required',
        });
        return;
      }

      await this.featureService.deleteFeature(id);

      res.json({
        success: true,
        message: 'Feature deleted successfully',
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to delete feature');
    }
  }

  /**
   * POST /admin/features/:id/duplicate
   * Duplicate an existing feature
   */
  async duplicateFeature(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { keyName, displayName, ...otherModifications } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Feature ID is required',
        });
        return;
      }

      if (!keyName || !displayName) {
        res.status(400).json({
          success: false,
          error: 'New keyName and displayName are required for duplication',
        });
        return;
      }

      const modifications = {
        keyName,
        displayName,
        ...otherModifications,
      };

      const feature = await this.featureService.duplicateFeature(
        id,
        modifications,
      );

      res.status(201).json({
        success: true,
        data: feature,
        message: 'Feature duplicated successfully',
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to duplicate feature');
    }
  }

  /**
   * GET /admin/features/categories
   * Get all feature categories
   */
  async getFeatureCategories(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const categories = await this.featureService.getFeatureCategories();

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch feature categories');
    }
  }

  /**
   * GET /admin/features/stats
   * Get feature statistics and analytics
   */
  async getFeatureStats(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const stats = await this.featureService.getFeatureStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch feature statistics');
    }
  }

  /**
   * GET /admin/features/key/:keyName
   * Get a feature by key name
   */
  async getFeatureByKey(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { keyName } = req.params;

      if (!keyName) {
        res.status(400).json({
          success: false,
          error: 'Feature key name is required',
        });
        return;
      }

      const feature = await this.featureService.getFeatureByKeyName(keyName);

      res.json({
        success: true,
        data: feature,
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch feature by key');
    }
  }

  /**
   * PUT /admin/features/:id/activate
   * Activate a feature
   */
  async activateFeature(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Feature ID is required',
        });
        return;
      }

      const feature = await this.featureService.activateFeature(id);

      res.json({
        success: true,
        data: feature,
        message: 'Feature activated successfully',
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to activate feature');
    }
  }

  /**
   * PUT /admin/features/:id/deactivate
   * Deactivate a feature
   */
  async deactivateFeature(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Feature ID is required',
        });
        return;
      }

      const feature = await this.featureService.deactivateFeature(id);

      res.json({
        success: true,
        data: feature,
        message: 'Feature deactivated successfully',
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to deactivate feature');
    }
  }

  /**
   * GET /admin/features/unassigned
   * Get features not assigned to any plan
   */
  async getUnassignedFeatures(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const features = await this.featureService.getUnassignedFeatures();

      res.json({
        success: true,
        data: features,
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch unassigned features');
    }
  }

  /**
   * GET /admin/features/category/:category
   * Get features by category
   */
  async getFeaturesByCategory(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { category } = req.params;

      if (!category) {
        res.status(400).json({
          success: false,
          error: 'Feature category is required',
        });
        return;
      }

      const features =
        await this.featureService.getFeaturesByCategory(category);

      res.json({
        success: true,
        data: features,
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch features by category');
    }
  }

  /**
   * GET /admin/features/active
   * Get all active features
   */
  async getActiveFeatures(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const features = await this.featureService.getActiveFeatures();

      res.json({
        success: true,
        data: features,
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch active features');
    }
  }

  /**
   * PUT /admin/features/bulk/category
   * Bulk update feature categories
   */
  async bulkUpdateCategory(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { featureIds, newCategory } = req.body;

      if (!Array.isArray(featureIds) || !newCategory) {
        res.status(400).json({
          success: false,
          error: 'featureIds array and newCategory are required',
        });
        return;
      }

      await this.featureService.bulkUpdateFeatureCategory(
        featureIds,
        newCategory,
      );

      res.json({
        success: true,
        message: 'Features updated successfully',
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to bulk update features');
    }
  }

  /**
   * GET /admin/features/:id/usage
   * Get feature usage across plans
   */
  async getFeatureUsage(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Feature ID is required',
        });
        return;
      }

      const usage = await this.featureService.getFeatureUsage(id);

      res.json({
        success: true,
        data: usage,
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch feature usage');
    }
  }

  /**
   * POST /admin/features/search
   * Advanced feature search with complex filters
   */
  async searchFeatures(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { query, filters } = req.body;

      const searchQuery = query || '';
      const searchFilters = filters || {};

      const results = await this.featureService.searchFeatures(
        searchQuery,
        searchFilters,
      );

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to search features');
    }
  }

  /**
   * Error handling helper
   */
  private handleError(res: Response, error: any, defaultMessage: string): void {
    console.error('Admin Feature Controller Error:', error);

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    // Handle Prisma errors
    if (error.code === 'P2002') {
      res.status(400).json({
        success: false,
        error: 'A feature with this key name already exists',
        code: 'DUPLICATE_KEY_NAME',
      });
      return;
    }

    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Feature not found',
        code: 'FEATURE_NOT_FOUND',
      });
      return;
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: defaultMessage,
      code: 'INTERNAL_ERROR',
    });
  }
}

// Factory function to create controller instance
export function createAdminFeatureController(
  prisma: PrismaClient,
): AdminFeatureController {
  return new AdminFeatureController(prisma);
}

export default AdminFeatureController;
