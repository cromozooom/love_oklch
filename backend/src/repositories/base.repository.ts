import { PrismaClient } from '@prisma/client';
import { Logger } from '@/utils/logger';

/**
 * Base repository pattern for all data access operations
 * Provides common CRUD operations and standardized error handling
 */
export abstract class BaseRepository<T> {
  protected readonly prisma: PrismaClient;
  protected readonly logger: Logger;
  protected readonly tableName: string;

  constructor(prisma: PrismaClient, tableName: string) {
    this.prisma = prisma;
    this.logger = new Logger(`${this.constructor.name}`);
    this.tableName = tableName;
  }

  /**
   * Find a single record by ID
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Find multiple records with optional filtering
   */
  abstract findMany(filter?: any, options?: FindOptions): Promise<T[]>;

  /**
   * Create a new record
   */
  abstract create(data: any): Promise<T>;

  /**
   * Update a record by ID
   */
  abstract update(id: string, data: any): Promise<T>;

  /**
   * Delete a record by ID
   */
  abstract delete(id: string): Promise<boolean>;

  /**
   * Count records with optional filtering
   */
  abstract count(filter?: any): Promise<number>;

  /**
   * Check if a record exists by ID
   */
  async exists(id: string): Promise<boolean> {
    try {
      const record = await this.findById(id);
      return record !== null;
    } catch (error) {
      this.logger.error(`Error checking existence for ID ${id}:`, error);
      return false;
    }
  }

  /**
   * Execute a transaction with multiple operations
   */
  protected async executeTransaction<R>(
    operations: (tx: PrismaClient) => Promise<R>
  ): Promise<R> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        return await operations(tx);
      });
    } catch (error) {
      this.logger.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Handle common database errors and convert to application errors
   */
  protected handleDatabaseError(error: any, operation: string): never {
    this.logger.error(`Database error during ${operation}:`, error);

    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      throw new DatabaseError('Unique constraint violation', 'DUPLICATE_KEY', error);
    }

    if (error.code === 'P2025') {
      throw new DatabaseError('Record not found', 'NOT_FOUND', error);
    }

    if (error.code === 'P2003') {
      throw new DatabaseError('Foreign key constraint violation', 'FOREIGN_KEY', error);
    }

    if (error.code === 'P2014') {
      throw new DatabaseError('Invalid data provided', 'INVALID_DATA', error);
    }

    // Handle connection errors
    if (error.code === 'P1001') {
      throw new DatabaseError('Database connection failed', 'CONNECTION_ERROR', error);
    }

    // Generic database error
    throw new DatabaseError(
      error.message || 'Unknown database error',
      'DATABASE_ERROR',
      error
    );
  }

  /**
   * Build pagination parameters
   */
  protected buildPagination(options?: FindOptions): { skip?: number; take?: number } {
    if (!options?.pagination) {
      return {};
    }

    const { page, limit } = options.pagination;
    const skip = (page - 1) * limit;

    return {
      skip,
      take: limit,
    };
  }

  /**
   * Build sort parameters
   */
  protected buildSort(options?: FindOptions): any {
    if (!options?.sort) {
      return undefined;
    }

    const { field, direction } = options.sort;
    return {
      [field]: direction,
    };
  }

  /**
   * Validate UUID format
   */
  protected validateUUID(id: string, fieldName: string = 'id'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(id)) {
      throw new ValidationError(`Invalid ${fieldName} format: ${id}`, 'INVALID_UUID');
    }
  }

  /**
   * Log performance metrics for queries
   */
  protected async withPerformanceLogging<R>(
    operation: string,
    queryFn: () => Promise<R>
  ): Promise<R> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      this.logger.debug(`${operation} completed in ${duration}ms`);
      
      // Log slow queries (>100ms)
      if (duration > 100) {
        this.logger.warn(`Slow query detected: ${operation} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`${operation} failed after ${duration}ms:`, error);
      throw error;
    }
  }
}

/**
 * Options for find operations
 */
export interface FindOptions {
  pagination?: {
    page: number;
    limit: number;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  include?: string[];
}

/**
 * Custom database error class
 */
export class DatabaseError extends Error {
  public readonly code: string;
  public readonly originalError?: any;

  constructor(message: string, code: string, originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

/**
 * Repository factory for dependency injection
 */
export class RepositoryFactory {
  private static instance: RepositoryFactory;
  private readonly prisma: PrismaClient;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public static getInstance(prisma: PrismaClient): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory(prisma);
    }
    return RepositoryFactory.instance;
  }

  public getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}

export default BaseRepository;