import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQueryOptions,
  createProjectSchema,
  updateProjectSchema,
  ProjectValidation,
  ColorGamut,
  ColorSpace,
} from '../models/project.model';

// Type for Prisma project result
type PrismaProject = {
  projectId: string;
  userId: string;
  name: string;
  description: string | null;
  colorGamut: import('@prisma/client').ColorGamut;
  colorSpace: import('@prisma/client').ColorSpace;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
};

/**
 * Service for project CRUD operations
 */
export class ProjectService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Transform Prisma project to our Project interface
   */
  private transformPrismaProject(prismaProject: PrismaProject): Project {
    return {
      id: prismaProject.projectId,
      userId: prismaProject.userId,
      name: prismaProject.name,
      description: prismaProject.description,
      colorGamut: this.mapPrismaColorGamut(prismaProject.colorGamut),
      colorSpace: this.mapPrismaColorSpace(prismaProject.colorSpace),
      createdAt: prismaProject.createdAt,
      updatedAt: prismaProject.updatedAt,
      isActive: prismaProject.isActive,
    };
  }

  /**
   * Map Prisma ColorGamut to our enum
   */
  private mapPrismaColorGamut(
    prismaGamut: import('@prisma/client').ColorGamut,
  ): ColorGamut {
    switch (prismaGamut) {
      case 'sRGB':
        return ColorGamut.SRGB;
      case 'Display_P3':
        return ColorGamut.DISPLAY_P3;
      case 'Unlimited':
        return ColorGamut.UNLIMITED;
      default:
        return ColorGamut.SRGB;
    }
  }

  /**
   * Map our ColorGamut to Prisma enum
   */
  private mapToPrismaColorGamut(
    gamut: ColorGamut,
  ): import('@prisma/client').ColorGamut {
    switch (gamut) {
      case ColorGamut.SRGB:
        return 'sRGB';
      case ColorGamut.DISPLAY_P3:
        return 'Display_P3';
      case ColorGamut.UNLIMITED:
        return 'Unlimited';
      default:
        return 'sRGB';
    }
  }

  /**
   * Map Prisma ColorSpace to our enum
   */
  private mapPrismaColorSpace(
    prismaSpace: import('@prisma/client').ColorSpace,
  ): ColorSpace {
    switch (prismaSpace) {
      case 'LCH':
        return ColorSpace.LCH;
      case 'OKLCH':
        return ColorSpace.OKLCH;
      default:
        return ColorSpace.OKLCH;
    }
  }

  /**
   * Map our ColorSpace to Prisma enum
   */
  private mapToPrismaColorSpace(
    space: ColorSpace,
  ): import('@prisma/client').ColorSpace {
    switch (space) {
      case ColorSpace.LCH:
        return 'LCH';
      case ColorSpace.OKLCH:
        return 'OKLCH';
      default:
        return 'OKLCH';
    }
  }

  /**
   * Create a new project
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    // Validate input
    const validatedInput = createProjectSchema.parse(input);

    // Check project limits based on user subscription
    const activeProjectsCount = await this.getActiveProjectsCount(
      validatedInput.userId,
    );
    const user = await this.prisma.user.findUnique({
      where: { userId: validatedInput.userId },
      include: { subscriptions: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get the most recent active subscription
    const activeSubscription = user.subscriptions.find(
      (sub) => sub.status === 'active',
    );
    const subscriptionType = activeSubscription ? 'premium' : 'default';

    if (
      !ProjectValidation.validateProjectLimits(
        subscriptionType,
        activeProjectsCount,
      )
    ) {
      throw new Error('Project limit exceeded for current subscription');
    }

    // Check for duplicate project names for this user
    const existingNames = await this.getProjectNames(validatedInput.userId);
    if (
      !ProjectValidation.validateProjectName(validatedInput.name, existingNames)
    ) {
      throw new Error('A project with this name already exists');
    }

    // Create project
    const project = await this.prisma.project.create({
      data: {
        userId: validatedInput.userId,
        name: validatedInput.name,
        description: validatedInput.description || null,
        colorGamut: this.mapToPrismaColorGamut(validatedInput.colorGamut),
        colorSpace: this.mapToPrismaColorSpace(validatedInput.colorSpace),
      },
    });

    return this.transformPrismaProject(project);
  }

  /**
   * Get project by ID
   */
  async getProjectById(id: string, userId: string): Promise<Project | null> {
    const project = await this.prisma.project.findFirst({
      where: {
        projectId: id,
        userId,
        isActive: true,
      },
    });

    return project ? this.transformPrismaProject(project) : null;
  }

  /**
   * Get projects for a user with optional filters
   */
  async getProjects(
    options: ProjectQueryOptions,
  ): Promise<{ projects: Project[]; total: number }> {
    const {
      userId,
      isActive = true,
      limit = 20,
      offset = 0,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = options;

    const where = {
      userId,
      isActive,
    };

    const orderBy = {
      [sortBy]: sortOrder,
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      projects: projects.map((p) => this.transformPrismaProject(p)),
      total,
    };
  }

  /**
   * Update project
   */
  async updateProject(
    id: string,
    userId: string,
    input: UpdateProjectInput,
  ): Promise<Project> {
    // Validate input
    const validatedInput = updateProjectSchema.parse(input);

    // Check if project exists and user owns it
    const existingProject = await this.getProjectById(id, userId);
    if (!existingProject) {
      throw new Error('Project not found');
    }

    // If name is being updated, check for duplicates
    if (validatedInput.name) {
      const existingNames = await this.getProjectNames(userId);
      const otherNames = existingNames.filter(
        (name) => name !== existingProject.name,
      );

      if (
        !ProjectValidation.validateProjectName(validatedInput.name, otherNames)
      ) {
        throw new Error('A project with this name already exists');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedInput.name !== undefined)
      updateData.name = validatedInput.name;
    if (validatedInput.description !== undefined)
      updateData.description = validatedInput.description;
    if (validatedInput.colorGamut !== undefined)
      updateData.colorGamut = this.mapToPrismaColorGamut(
        validatedInput.colorGamut,
      );
    if (validatedInput.colorSpace !== undefined)
      updateData.colorSpace = this.mapToPrismaColorSpace(
        validatedInput.colorSpace,
      );
    if (validatedInput.isActive !== undefined)
      updateData.isActive = validatedInput.isActive;

    // Update project
    const updatedProject = await this.prisma.project.update({
      where: { projectId: id },
      data: updateData,
    });

    return this.transformPrismaProject(updatedProject);
  }

  /**
   * Soft delete project (set isActive to false)
   */
  async deleteProject(id: string, userId: string): Promise<void> {
    // Check if project exists and user owns it
    const existingProject = await this.getProjectById(id, userId);
    if (!existingProject) {
      throw new Error('Project not found');
    }

    await this.prisma.project.update({
      where: { projectId: id },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Get count of active projects for a user
   */
  async getActiveProjectsCount(userId: string): Promise<number> {
    return await this.prisma.project.count({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  /**
   * Get all project names for a user (for duplicate checking)
   */
  async getProjectNames(userId: string): Promise<string[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        name: true,
      },
    });

    return projects.map((p) => p.name);
  }

  /**
   * Get projects summary for dashboard
   */
  async getProjectsSummary(userId: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    recentProjects: Project[];
    projectLimit: number;
    canCreateMore: boolean;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { subscriptions: true },
    });

    const activeSubscription = user?.subscriptions.find(
      (sub) => sub.status === 'active',
    );
    const subscriptionType = activeSubscription ? 'premium' : 'default';
    const projectLimit = subscriptionType === 'premium' ? -1 : 1; // -1 means unlimited

    const [totalProjects, activeProjects, recentProjects] = await Promise.all([
      this.prisma.project.count({ where: { userId } }),
      this.prisma.project.count({ where: { userId, isActive: true } }),
      this.prisma.project.findMany({
        where: { userId, isActive: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    const canCreateMore = projectLimit === -1 || activeProjects < projectLimit;

    return {
      totalProjects,
      activeProjects,
      recentProjects: recentProjects.map((p) => this.transformPrismaProject(p)),
      projectLimit,
      canCreateMore,
    };
  }

  /**
   * Search projects by name
   */
  async searchProjects(
    userId: string,
    searchTerm: string,
    limit: number = 10,
  ): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        userId,
        isActive: true,
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
    });

    return projects.map((p) => this.transformPrismaProject(p));
  }
}
