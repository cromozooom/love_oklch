import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Types for project modifications
export interface ProjectModification {
  id: string;
  projectId: string;
  type: 'property_change' | 'initial_state';
  propertyName: string;
  previousValue: any;
  newValue: any;
  timestamp: Date;
  commandId: string;
}

export interface CreateProjectModificationInput {
  projectId: string;
  type: 'property_change' | 'initial_state';
  propertyName: string;
  previousValue?: any;
  newValue: any;
  commandId: string;
}

// Type for Prisma project modification result
type PrismaProjectModification = {
  modificationId: string;
  projectId: string;
  type: import('@prisma/client').ModificationType;
  propertyName: string;
  previousValue: any;
  newValue: any;
  timestamp: Date;
  commandId: string;
};

/**
 * Service for project modification tracking operations
 */
export class ProjectModificationsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Transform Prisma project modification to our interface
   */
  private transformPrismaModification(
    prismaMod: PrismaProjectModification,
  ): ProjectModification {
    return {
      id: prismaMod.modificationId,
      projectId: prismaMod.projectId,
      type:
        prismaMod.type === 'property_change'
          ? 'property_change'
          : 'initial_state',
      propertyName: prismaMod.propertyName,
      previousValue: prismaMod.previousValue,
      newValue: prismaMod.newValue,
      timestamp: prismaMod.timestamp,
      commandId: prismaMod.commandId,
    };
  }

  /**
   * Map our modification type to Prisma enum
   */
  private mapModificationType(
    type: string,
  ): 'property_change' | 'initial_state' {
    return type === 'property_change' ? 'property_change' : 'initial_state';
  }

  /**
   * Get a project by ID (for ownership verification)
   */
  async getProjectById(projectId: string) {
    return this.prisma.project.findUnique({
      where: { projectId },
    });
  }

  /**
   * Update project properties (for batch modifications)
   */
  async updateProject(
    projectId: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.project.update({
      where: { projectId },
      data: updates,
    });
  }

  /**
   * Get modification history for a project
   */
  async getProjectModifications(
    projectId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ProjectModification[]> {
    const modifications = await this.prisma.projectModification.findMany({
      where: { projectId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    return modifications.map(this.transformPrismaModification);
  }

  /**
   * Create a new project modification
   */
  async createProjectModification(
    input: CreateProjectModificationInput,
  ): Promise<ProjectModification> {
    const modificationId = uuidv4();

    const prismaMod = await this.prisma.projectModification.create({
      data: {
        modificationId,
        projectId: input.projectId,
        type: this.mapModificationType(input.type),
        propertyName: input.propertyName,
        previousValue: input.previousValue,
        newValue: input.newValue,
        commandId: input.commandId,
      },
    });

    return this.transformPrismaModification(prismaMod);
  }

  /**
   * Delete modifications for a project (for cleanup)
   */
  async deleteProjectModifications(projectId: string): Promise<number> {
    const result = await this.prisma.projectModification.deleteMany({
      where: { projectId },
    });

    return result.count;
  }

  /**
   * Get modification count for a project
   */
  async getProjectModificationCount(projectId: string): Promise<number> {
    return this.prisma.projectModification.count({
      where: { projectId },
    });
  }

  /**
   * Clean up old modifications when limit is exceeded
   * Keeps the most recent N modifications
   */
  async pruneOldModifications(
    projectId: string,
    keepCount: number,
  ): Promise<number> {
    // Get all modifications ordered by timestamp (oldest first)
    const allMods = await this.prisma.projectModification.findMany({
      where: { projectId },
      orderBy: { timestamp: 'asc' },
      select: { modificationId: true },
    });

    if (allMods.length <= keepCount) {
      return 0; // No pruning needed
    }

    // Delete the oldest modifications
    const toDelete = allMods.slice(0, allMods.length - keepCount);
    const deleteIds = toDelete.map((mod) => mod.modificationId);

    const result = await this.prisma.projectModification.deleteMany({
      where: {
        modificationId: { in: deleteIds },
      },
    });

    return result.count;
  }
}
