import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProjectModificationsService } from '@/services/project-modifications.service';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Project Modifications API controller
 */
export class ProjectModificationsController {
  private modificationsService: ProjectModificationsService;

  constructor(prisma: PrismaClient) {
    this.modificationsService = new ProjectModificationsService(prisma);
  }

  /**
   * Get modification history for a project
   * GET /api/projects/:projectId/modifications
   */
  getProjectModifications = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const { projectId } = req.params;
      if (!projectId) {
        res.status(400).json({
          success: false,
          error: 'Project ID is required',
        });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string)
        : 0;

      // Verify user owns the project
      const project = await this.modificationsService.getProjectById(projectId);
      if (!project || project.userId !== req.user.userId) {
        res.status(404).json({
          success: false,
          error: 'Project not found or access denied',
        });
        return;
      }

      const modifications =
        await this.modificationsService.getProjectModifications(
          projectId,
          limit,
          offset,
        );

      const subscriptionLimit = req.user.isAdmin
        ? -1
        : req.user.subscription.type === 'premium'
          ? 50
          : 5;
      const remainingOperations =
        subscriptionLimit === -1
          ? -1
          : Math.max(0, subscriptionLimit - modifications.length);

      res.json({
        success: true,
        data: {
          modifications,
          total: modifications.length,
          subscriptionLimit,
          remainingOperations,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Record a new project modification
   * POST /api/projects/:projectId/modifications
   */
  createProjectModification = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const { projectId } = req.params;
      if (!projectId) {
        res.status(400).json({
          success: false,
          error: 'Project ID is required',
        });
        return;
      }

      const { type, propertyName, previousValue, newValue, commandId } =
        req.body;

      // Verify user owns the project
      const project = await this.modificationsService.getProjectById(projectId);
      if (!project || project.userId !== req.user.userId) {
        res.status(404).json({
          success: false,
          error: 'Project not found or access denied',
        });
        return;
      }

      // Check subscription limits (unlimited for admin users)
      if (!req.user.isAdmin) {
        const subscriptionLimit =
          req.user.subscription.type === 'premium' ? 50 : 5;
        const currentModifications =
          await this.modificationsService.getProjectModifications(
            projectId,
            subscriptionLimit,
            0,
          );

        if (currentModifications.length >= subscriptionLimit) {
          res.status(403).json({
            success: false,
            error: {
              code: 'UNDO_REDO_LIMIT_EXCEEDED',
              message: 'Subscription limit reached for undo/redo operations',
              details: {
                currentCount: currentModifications.length,
                maxAllowed: subscriptionLimit,
                subscriptionType: req.user.subscription.type || 'default',
              },
            },
          });
          return;
        }
      }

      const modification =
        await this.modificationsService.createProjectModification({
          projectId,
          type,
          propertyName,
          previousValue,
          newValue,
          commandId,
        });

      res.status(201).json({
        success: true,
        data: {
          modification,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Batch create multiple project modifications
   * POST /api/projects/:projectId/modifications/batch
   */
  batchCreateProjectModifications = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const { projectId } = req.params;
      if (!projectId) {
        res.status(400).json({
          success: false,
          error: 'Project ID is required',
        });
        return;
      }

      const { modifications } = req.body;

      if (!modifications || !Array.isArray(modifications)) {
        res.status(400).json({
          success: false,
          error: 'Modifications array is required',
        });
        return;
      }

      // Verify user owns the project
      const project = await this.modificationsService.getProjectById(projectId);
      if (!project || project.userId !== req.user.userId) {
        res.status(404).json({
          success: false,
          error: 'Project not found or access denied',
        });
        return;
      }

      // Check subscription limits (unlimited for admin users)
      if (!req.user.isAdmin) {
        const subscriptionLimit =
          req.user.subscription.type === 'premium' ? 50 : 5;
        const currentModifications =
          await this.modificationsService.getProjectModifications(
            projectId,
            subscriptionLimit,
            0,
          );

        const remainingSlots = subscriptionLimit - currentModifications.length;
        if (modifications.length > remainingSlots) {
          res.status(403).json({
            success: false,
            error: {
              code: 'BATCH_UNDO_REDO_LIMIT_EXCEEDED',
              message:
                'Batch would exceed subscription limit for undo/redo operations',
              details: {
                requestedCount: modifications.length,
                remainingSlots,
                maxAllowed: subscriptionLimit,
                subscriptionType: req.user.subscription.type || 'default',
              },
            },
          });
          return;
        }
      }

      // Create all modifications in batch
      const createdModifications = await Promise.all(
        modifications.map((mod) =>
          this.modificationsService.createProjectModification({
            projectId,
            type: mod.type,
            propertyName: mod.propertyName,
            previousValue: mod.previousValue,
            newValue: mod.newValue,
            commandId: mod.commandId,
          }),
        ),
      );

      // Apply property changes to the project
      // For each unique property, apply the LAST (most recent) value
      const propertyUpdates: Record<string, unknown> = {};
      for (const mod of modifications) {
        // Handle both 'PROPERTY_CHANGE' and 'property_change' formats
        const modType = String(mod.type).toUpperCase();
        if (modType === 'PROPERTY_CHANGE' && mod.propertyName) {
          propertyUpdates[mod.propertyName] = mod.newValue;
        }
      }

      // Update the project with all property changes
      if (Object.keys(propertyUpdates).length > 0) {
        try {
          await this.modificationsService.updateProject(
            projectId,
            propertyUpdates,
          );
        } catch (updateError) {
          console.error(
            `Failed to update project ${projectId} properties:`,
            updateError,
          );
          throw updateError;
        }
      }

      res.status(201).json({
        success: true,
        data: {
          modifications: createdModifications,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
