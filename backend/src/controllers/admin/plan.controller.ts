import { Request, Response } from 'express';
import { PlanService } from '../../services/plan.service';
import { PlanCreateData, PlanUpdateData } from '../../models/plan.model';
import { ValidationError } from '../../middleware/error.middleware';
import { AuthenticatedRequest } from '../../middleware/admin.middleware';
import { PrismaClient } from '@prisma/client';

/**
 * Admin Plan Management Controller
 * Handles CRUD operations and business logic for subscription plans
 * Requires admin authentication via middleware
 */
export class AdminPlanController {
  private planService: PlanService;

  constructor(prisma: PrismaClient) {
    this.planService = new PlanService(prisma);
  }

  /**
   * GET /admin/plans
   * Get all plans with optional filtering and search
   */
  async getPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        search,
        isActive,
        currency,
        sortBy = 'sortOrder',
        sortOrder = 'asc',
        page = 1,
        limit = 50
      } = req.query;

      const filters: any = {};
      
      if (search) filters.search = search as string;
      if (isActive !== undefined) {
        filters.isActive = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
      }
      if (currency) filters.currency = currency as string;
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);
      if (sortBy) filters.sortBy = sortBy as string;
      if (sortOrder) filters.sortOrder = sortOrder as 'asc' | 'desc';

      const plans = await this.planService.getPlans(filters);

      res.json({
        success: true,
        data: plans,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 50,
          total: plans.length
        }
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch plans');
    }
  }

  /**
   * GET /admin/plans/:id
   * Get a specific plan by ID
   */
  async getPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Plan ID is required'
        });
        return;
      }

      const plan = await this.planService.getPlanById(id);

      res.json({
        success: true,
        data: plan
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch plan');
    }
  }

  /**
   * POST /admin/plans
   * Create a new plan
   */
  async createPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const planData: PlanCreateData = {
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description,
        price: req.body.price || 0,
        currency: req.body.currency,
        billingInterval: req.body.billingInterval,
        isActive: req.body.isActive ?? true,
        sortOrder: req.body.sortOrder || 0,
        metadata: req.body.metadata || {}
      };

      const plan = await this.planService.createPlan(planData);

      res.status(201).json({
        success: true,
        data: plan,
        message: 'Plan created successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to create plan');
    }
  }

  /**
   * PUT /admin/plans/:id
   * Update an existing plan
   */
  async updatePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Plan ID is required'
        });
        return;
      }

      const updateData: PlanUpdateData = {};

      // Only update provided fields
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.price !== undefined) updateData.price = req.body.price;
      if (req.body.currency !== undefined) updateData.currency = req.body.currency;
      if (req.body.billingInterval !== undefined) updateData.billingInterval = req.body.billingInterval;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
      if (req.body.sortOrder !== undefined) updateData.sortOrder = req.body.sortOrder;
      if (req.body.metadata !== undefined) updateData.metadata = req.body.metadata;

      const plan = await this.planService.updatePlan(id, updateData);

      res.json({
        success: true,
        data: plan,
        message: 'Plan updated successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to update plan');
    }
  }

  /**
   * DELETE /admin/plans/:id
   * Delete a plan
   */
  async deletePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { force } = req.query;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Plan ID is required'
        });
        return;
      }

      await this.planService.deletePlan(id, force === 'true');

      res.json({
        success: true,
        message: 'Plan deleted successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to delete plan');
    }
  }

  /**
   * POST /admin/plans/:id/duplicate
   * Duplicate an existing plan
   */
  async duplicatePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, slug, ...otherModifications } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Plan ID is required'
        });
        return;
      }

      if (!name || !slug) {
        res.status(400).json({
          success: false,
          error: 'New name and slug are required for duplication'
        });
        return;
      }

      const modifications = {
        name,
        slug,
        ...otherModifications
      };

      const plan = await this.planService.duplicatePlan(id, modifications);

      res.status(201).json({
        success: true,
        data: plan,
        message: 'Plan duplicated successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to duplicate plan');
    }
  }

  /**
   * PUT /admin/plans/reorder
   * Reorder multiple plans
   */
  async reorderPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { planOrders } = req.body;

      if (!Array.isArray(planOrders)) {
        res.status(400).json({
          success: false,
          error: 'planOrders must be an array of {planId, sortOrder} objects'
        });
        return;
      }

      await this.planService.reorderPlans(planOrders);

      res.json({
        success: true,
        message: 'Plans reordered successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to reorder plans');
    }
  }

  /**
   * GET /admin/plans/stats
   * Get plan statistics and analytics
   */
  async getPlanStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await this.planService.getPlanStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch plan statistics');
    }
  }

  /**
   * GET /admin/plans/:id/features
   * Get all features for a specific plan
   */
  async getPlanFeatures(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Plan ID is required'
        });
        return;
      }

      const features = await this.planService.getPlanFeatures(id);

      res.json({
        success: true,
        data: features
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch plan features');
    }
  }

  /**
   * GET /admin/plans/slug/:slug
   * Get a plan by slug
   */
  async getPlanBySlug(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      
      if (!slug) {
        res.status(400).json({
          success: false,
          error: 'Plan slug is required'
        });
        return;
      }

      const plan = await this.planService.getPlanBySlug(slug);

      res.json({
        success: true,
        data: plan
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch plan by slug');
    }
  }

  /**
   * PUT /admin/plans/:id/activate
   * Activate a plan
   */
  async activatePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Plan ID is required'
        });
        return;
      }

      const plan = await this.planService.activatePlan(id);

      res.json({
        success: true,
        data: plan,
        message: 'Plan activated successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to activate plan');
    }
  }

  /**
   * PUT /admin/plans/:id/deactivate
   * Deactivate a plan
   */
  async deactivatePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Plan ID is required'
        });
        return;
      }

      const plan = await this.planService.deactivatePlan(id);

      res.json({
        success: true,
        data: plan,
        message: 'Plan deactivated successfully'
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to deactivate plan');
    }
  }

  /**
   * GET /admin/plans/public
   * Get all public plans
   */
  async getPublicPlans(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const plans = await this.planService.getPublicPlans();

      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch public plans');
    }
  }

  /**
   * Error handling helper
   */
  private handleError(res: Response, error: any, defaultMessage: string): void {
    console.error('Admin Plan Controller Error:', error);

    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code
      });
      return;
    }

    // Handle Prisma errors
    if (error.code === 'P2002') {
      res.status(400).json({
        success: false,
        error: 'A plan with this slug already exists',
        code: 'DUPLICATE_SLUG'
      });
      return;
    }

    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Plan not found',
        code: 'PLAN_NOT_FOUND'
      });
      return;
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: defaultMessage,
      code: 'INTERNAL_ERROR'
    });
  }
}

// Factory function to create controller instance
export function createAdminPlanController(prisma: PrismaClient): AdminPlanController {
  return new AdminPlanController(prisma);
}

export default AdminPlanController;