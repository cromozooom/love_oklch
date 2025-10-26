import { Router } from 'express';
import { authRoutes } from './auth.routes';

/**
 * Main API Router
 * Consolidates all route modules for the Love OKLCH Backend
 * Extends existing authentication routes with project management routes
 */
export function createMainRouter(): Router {
  const router = Router();

  // Authentication routes (existing)
  router.use('/auth', authRoutes);

  // Project management routes (to be implemented)
  // router.use('/projects', projectRoutes);
  // router.use('/projects/:projectId/modifications', modificationRoutes);

  // API info endpoint
  router.get('/', (req, res) => {
    res.json({
      name: 'Love OKLCH Backend API',
      description: 'Project Management with Freemium Entitlements',
      version: '1.0.0',
      documentation: '/api/v1/docs',
      endpoints: {
        health: '/health',
        auth: '/api/v1/auth',
        projects: '/api/v1/projects',
        modifications: '/api/v1/projects/:projectId/modifications',
      },
    });
  });

  return router;
}

/**
 * Route configuration for project management endpoints
 * This will be extended as project management features are implemented
 */
export const routeConfig = {
  auth: {
    base: '/auth',
    endpoints: {
      login: '/login',
      verify: '/verify',
      logout: '/logout',
    },
  },
  projects: {
    base: '/projects',
    endpoints: {
      list: '/',
      create: '/',
      get: '/:projectId',
      update: '/:projectId',
      delete: '/:projectId',
    },
  },
  modifications: {
    base: '/projects/:projectId/modifications',
    endpoints: {
      list: '/',
      create: '/',
      get: '/:modificationId',
      undo: '/undo',
      redo: '/redo',
    },
  },
} as const;

export default createMainRouter;
