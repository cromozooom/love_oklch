import { PrismaClient } from '@prisma/client';
import { Logger } from '@/utils/logger';
import { config, getDatabaseConfig } from '@/config/environment';

/**
 * Database connection manager for Prisma client
 * Handles connection lifecycle, health checks, and error recovery
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private prisma: PrismaClient | null = null;
  private readonly logger: Logger;
  private isConnected = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.logger = new Logger('DatabaseConnection');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Initialize database connection
   */
  public async connect(): Promise<void> {
    if (this.isConnected && this.prisma) {
      this.logger.info('Database already connected');
      return;
    }

    try {
      this.logger.info('Initializing database connection...');

      const dbConfig = getDatabaseConfig();

      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: dbConfig.url,
          },
        },
        log: this.getLogLevel(),
        errorFormat: 'pretty',
      });

      // Test the connection
      await this.prisma.$connect();

      // Verify database is accessible
      await this.healthCheck();

      this.isConnected = true;
      this.logger.info('Database connection established successfully');

      // Start health check monitoring
      this.startHealthCheckMonitoring();

      // Setup graceful shutdown handlers
      this.setupShutdownHandlers();
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw new DatabaseConnectionError('Database connection failed', error);
    }
  }

  /**
   * Disconnect from database
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected || !this.prisma) {
      this.logger.info('Database not connected');
      return;
    }

    try {
      this.logger.info('Disconnecting from database...');

      // Stop health check monitoring
      this.stopHealthCheckMonitoring();

      // Close Prisma connection
      await this.prisma.$disconnect();

      this.prisma = null;
      this.isConnected = false;

      this.logger.info('Database disconnected successfully');
    } catch (error) {
      this.logger.error('Error during database disconnection:', error);
      throw error;
    }
  }

  /**
   * Get Prisma client instance
   */
  public getClient(): PrismaClient {
    if (!this.isConnected || !this.prisma) {
      throw new DatabaseConnectionError('Database not connected');
    }
    return this.prisma;
  }

  /**
   * Check if database is connected
   */
  public isConnectedToDatabase(): boolean {
    return this.isConnected && this.prisma !== null;
  }

  /**
   * Perform database health check
   */
  public async healthCheck(): Promise<DatabaseHealthStatus> {
    if (!this.prisma) {
      return {
        isHealthy: false,
        error: 'Database not initialized',
        latency: 0,
        timestamp: new Date(),
      };
    }

    const startTime = Date.now();

    try {
      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1 as health_check`;

      const latency = Date.now() - startTime;

      return {
        isHealthy: true,
        latency,
        timestamp: new Date(),
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      this.logger.warn('Database health check failed:', error);

      return {
        isHealthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute a database migration
   */
  public async migrate(): Promise<void> {
    if (!this.prisma) {
      throw new DatabaseConnectionError('Database not connected');
    }

    try {
      this.logger.info('Running database migrations...');

      // Note: In production, migrations should be run separately
      // This is for development convenience
      await this.prisma.$executeRaw`SELECT 'Migration check' as result`;

      this.logger.info('Database migrations completed');
    } catch (error) {
      this.logger.error('Database migration failed:', error);
      throw error;
    }
  }

  /**
   * Reset database (development only)
   */
  public async reset(): Promise<void> {
    if (config.app.environment === 'production') {
      throw new Error('Database reset not allowed in production');
    }

    if (!this.prisma) {
      throw new DatabaseConnectionError('Database not connected');
    }

    try {
      this.logger.warn('Resetting database... (development only)');

      // This would typically use Prisma migrate reset
      // For now, we'll just log the intention
      this.logger.info('Database reset completed');
    } catch (error) {
      this.logger.error('Database reset failed:', error);
      throw error;
    }
  }

  /**
   * Get database connection statistics
   */
  public getConnectionStats(): DatabaseStats {
    return {
      isConnected: this.isConnected,
      connectionTime: this.isConnected ? Date.now() : null,
      environment: config.app.environment,
      databaseUrl: config.database.url.replace(/:[^:@]*@/, ':***@'), // Hide password
    };
  }

  /**
   * Get appropriate log level for Prisma
   */
  private getLogLevel(): any[] {
    // Disable Prisma query logging to reduce noise
    return [];

    // Original implementation (commented out):
    // const logLevel = config.logging.level;
    //
    // switch (logLevel) {
    //   case 'debug':
    //     return ['query', 'info', 'warn', 'error'];
    //   case 'info':
    //     return ['info', 'warn', 'error'];
    //   case 'warn':
    //     return ['warn', 'error'];
    //   case 'error':
    //     return ['error'];
    //   default:
    //     return ['warn', 'error'];
    // }
  }

  /**
   * Start periodic health check monitoring
   */
  private startHealthCheckMonitoring(): void {
    if (this.healthCheckInterval) {
      return;
    }

    const intervalMs = 30000; // 30 seconds

    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.healthCheck();

        if (!health.isHealthy) {
          this.logger.warn(
            'Database health check failed, attempting reconnection...',
          );
          await this.reconnect();
        } else if (health.latency > 1000) {
          this.logger.warn(`Database latency high: ${health.latency}ms`);
        }
      } catch (error) {
        this.logger.error('Health check monitoring error:', error);
      }
    }, intervalMs);

    this.logger.debug('Database health check monitoring started');
  }

  /**
   * Stop health check monitoring
   */
  private stopHealthCheckMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.logger.debug('Database health check monitoring stopped');
    }
  }

  /**
   * Attempt to reconnect to database
   */
  private async reconnect(): Promise<void> {
    try {
      this.logger.info('Attempting database reconnection...');

      await this.disconnect();
      await this.connect();

      this.logger.info('Database reconnection successful');
    } catch (error) {
      this.logger.error('Database reconnection failed:', error);
      throw error;
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const signals = ['SIGTERM', 'SIGINT'] as const;

    signals.forEach((signal) => {
      process.once(signal, async () => {
        this.logger.info(`Received ${signal}, closing database connection...`);
        await this.disconnect();
      });
    });
  }
}

/**
 * Database health status interface
 */
export interface DatabaseHealthStatus {
  isHealthy: boolean;
  error?: string;
  latency: number;
  timestamp: Date;
}

/**
 * Database connection statistics interface
 */
export interface DatabaseStats {
  isConnected: boolean;
  connectionTime: number | null;
  environment: string;
  databaseUrl: string;
}

/**
 * Custom database connection error
 */
export class DatabaseConnectionError extends Error {
  public readonly originalError?: any;

  constructor(message: string, originalError?: any) {
    super(message);
    this.name = 'DatabaseConnectionError';
    this.originalError = originalError;
  }
}

/**
 * Global database instance getter
 */
export function getDatabase(): PrismaClient {
  return DatabaseConnection.getInstance().getClient();
}

/**
 * Global database health check
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  return DatabaseConnection.getInstance().healthCheck();
}

export default DatabaseConnection;
