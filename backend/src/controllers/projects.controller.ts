import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProjectService } from '../services/project.service';
import {
  CreateProjectInput,
  UpdateProjectInput,
} from '../models/project.model';

// Extend Request interface to include authenticated user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    subscriptionType?: string;
  };
}

/**
 * Projects API controller
 */
export class ProjectsController {
  private projectService: ProjectService;

  constructor(prisma: PrismaClient) {
    this.projectService = new ProjectService(prisma);
  }

  /**
   * Create a new project
   * POST /api/projects
   */
  createProject = async (
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

      const createInput: CreateProjectInput = {
        userId: req.user.userId,
        name: req.body.name,
        description: req.body.description,
        colorGamut: req.body.colorGamut,
        colorSpace: req.body.colorSpace,
        colorCount: req.body.colorCount, // DEMO field for testing
      };

      const project = await this.projectService.createProject(createInput);

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all projects for the authenticated user
   * GET /api/projects
   */
  getProjects = async (
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

      const {
        isActive = 'true',
        limit = '20',
        offset = '0',
        sortBy = 'updatedAt',
        sortOrder = 'desc',
      } = req.query;

      const queryOptions = {
        userId: req.user.userId,
        isActive: isActive === 'true',
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await this.projectService.getProjects(queryOptions);

      res.json({
        success: true,
        data: result.projects,
        pagination: {
          total: result.total,
          limit: queryOptions.limit,
          offset: queryOptions.offset,
          hasMore: result.total > queryOptions.offset + queryOptions.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a specific project by ID
   * GET /api/projects/:id
   */
  getProjectById = async (
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

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Project ID is required',
        });
        return;
      }

      const project = await this.projectService.getProjectById(
        id,
        req.user.userId,
      );

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a project
   * PUT /api/projects/:id
   */
  updateProject = async (
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

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Project ID is required',
        });
        return;
      }

      const updateInput: UpdateProjectInput = {
        name: req.body.name,
        description: req.body.description,
        colorGamut: req.body.colorGamut,
        colorSpace: req.body.colorSpace,
        colorCount: req.body.colorCount, // DEMO field for testing
        isActive: req.body.isActive,
      };

      // Remove undefined values
      Object.keys(updateInput).forEach((key) => {
        if (updateInput[key as keyof UpdateProjectInput] === undefined) {
          delete updateInput[key as keyof UpdateProjectInput];
        }
      });

      const project = await this.projectService.updateProject(
        id,
        req.user.userId,
        updateInput,
      );

      res.json({
        success: true,
        data: project,
        message: 'Project updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Soft delete a project
   * DELETE /api/projects/:id
   */
  deleteProject = async (
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

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Project ID is required',
        });
        return;
      }

      await this.projectService.deleteProject(id, req.user.userId);

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get dashboard summary with project statistics
   * GET /api/projects/dashboard/summary
   */
  getDashboardSummary = async (
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

      const summary = await this.projectService.getProjectsSummary(
        req.user.userId,
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search projects by name
   * GET /api/projects/search?q=searchTerm
   */
  searchProjects = async (
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

      const { q: searchTerm, limit = '10' } = req.query;

      if (!searchTerm || typeof searchTerm !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search term is required',
        });
        return;
      }

      const projects = await this.projectService.searchProjects(
        req.user.userId,
        searchTerm,
        parseInt(limit as string, 10),
      );

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get project creation limits based on subscription
   * GET /api/projects/limits
   */
  getProjectLimits = async (
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

      const summary = await this.projectService.getProjectsSummary(
        req.user.userId,
      );

      res.json({
        success: true,
        data: {
          currentProjects: summary.activeProjects,
          projectLimit: summary.projectLimit,
          canCreateMore: summary.canCreateMore,
          subscriptionType: req.user.subscriptionType || 'default',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get color gamut and space options
   * GET /api/projects/options
   */
  getProjectOptions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const options = {
        colorGamuts: [
          {
            value: 'sRGB',
            label: 'sRGB (Standard)',
            description:
              'Standard RGB color space for web and general displays',
          },
          {
            value: 'Display P3',
            label: 'Display P3 (Wide Gamut)',
            description: 'Wide gamut color space for modern displays',
          },
          {
            value: 'Unlimited gamut',
            label: 'Unlimited Gamut',
            description: 'No gamut restrictions - full theoretical color range',
          },
        ],
        colorSpaces: [
          {
            value: 'LCH',
            label: 'LCH',
            description:
              'Lightness, Chroma, Hue - cylindrical representation of Lab',
          },
          {
            value: 'OKLCH',
            label: 'OKLCH',
            description:
              'OK Lightness, Chroma, Hue - improved perceptually uniform color space',
          },
        ],
      };

      res.json({
        success: true,
        data: options,
      });
    } catch (error) {
      next(error);
    }
  };
}
