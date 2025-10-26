import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '@/config/environment';
import { Logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/error.middleware';
import { DatabaseConnection } from '@/database/connection';
import { createMainRouter } from '@/routes/index';

/**
 * Express.js server configuration for Love OKLCH Backend
 * Implements freemium entitlement system with proper security and middleware
 */
export class Server {
  private readonly app: Application;
  private readonly logger: Logger;
  private readonly dbConnection: DatabaseConnection;

  constructor() {
    this.app = express();
    this.logger = new Logger('Server');
    this.dbConnection = DatabaseConnection.getInstance();
    this.setupMiddleware();
    this.setupBasicRoutes(); // Only setup routes that don't need DB
    // NOTE: Error handling setup moved to after database routes are mounted
  }

  /**
   * Configure Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false, // Allow embedding for development
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
      }),
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: config.cors.origin,
        credentials: config.cors.credentials,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      }),
    );

    // Body parsing middleware
    this.app.use(
      express.json({
        limit: '10mb',
        type: ['application/json', 'text/plain'],
      }),
    );
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: '10mb',
      }),
    );

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.logger.info(
          `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`,
        );
      });

      next();
    });

    this.logger.info('Basic routes setup completed');
  }

  /**
   * Create API router with version handling
   */
  private createApiRouter(): express.Router {
    const router = express.Router();

    // API info endpoint
    router.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'Love OKLCH Backend API',
        description: 'Freemium Entitlement System',
        version: '1.0.0',
        documentation: '/api/v1/docs',
        endpoints: {
          health: '/health',
          entitlements: '/api/v1/entitlements',
          admin: '/api/v1/admin',
          auth: '/api/v1/auth',
        },
      });
    });

    return router;
  }

  /**
   * Setup basic routes that don't require database connection
   */
  private setupBasicRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.app.environment,
      });
    });

    this.logger.info('Basic routes setup completed');
  }

  /**
   * Setup application routes that require database connection
   */
  private setupDatabaseRoutes(): void {
    // Simple test route first
    this.app.get('/api/v1/simple-test', (req, res) => {
      console.log('🧪 Simple test endpoint hit!');
      res.json({
        message: 'Simple test works!',
        timestamp: new Date().toISOString(),
      });
    });

    // API routes with version prefix using main router
    const apiPrefix = config.app.apiPrefix; // /api/v1
    console.log(`🔧 Setting up API routes with prefix: ${apiPrefix}`);

    try {
      const mainRouter = createMainRouter(this.dbConnection.getClient());
      console.log('🔧 Main router created, mounting at:', apiPrefix);

      this.app.use(apiPrefix, mainRouter);
      console.log('🔧 Main router mounted successfully');
    } catch (error) {
      console.error('❌ Error creating main router:', error);
      this.logger.error('Failed to create main router:', error);
    }

    this.logger.info(
      'Database-dependent routes setup completed with main router including authentication and project management endpoints',
    );
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // 404 handler for undefined routes
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });

    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await this.dbConnection.connect();
      this.logger.info('Database connection established');

      // Now setup routes that require database connection
      this.setupDatabaseRoutes();

      // Setup error handling AFTER all routes are mounted
      this.setupErrorHandling();

      // Start HTTP server
      const port = config.app.port;

      this.app.listen(port, () => {
        this.logger.info(`Server started on port ${port}`);
        this.logger.info(`Environment: ${config.app.environment}`);
        this.logger.info(`API prefix: ${config.app.apiPrefix}`);
        this.logger.info(`Health check: http://localhost:${port}/health`);
        this.logger.info(
          `API info: http://localhost:${port}${config.app.apiPrefix}`,
        );
      });
    } catch (error) {
      this.logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Starting graceful shutdown...');

    try {
      // Close database connections
      await this.dbConnection.disconnect();
      this.logger.info('Database connections closed');

      this.logger.info('Server shutdown completed');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Get Express application instance
   */
  public getApp(): Application {
    return this.app;
  }
}

/**
 * Handle process signals for graceful shutdown
 */
function setupGracefulShutdown(server: Server): void {
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, starting graceful shutdown...`);
      await server.shutdown();
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

// Bootstrap function for starting the application
export async function bootstrap(): Promise<Server> {
  const server = new Server();

  // Setup graceful shutdown handlers
  setupGracefulShutdown(server);

  // Start the server
  await server.start();

  return server;
}

export default Server;
