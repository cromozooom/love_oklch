import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './auth.routes';
import { createProjectsRoutes } from './projects.routes';

/**
 * Main API Router
 * Consolidates all route modules for the Love OKLCH Backend
 * Extends existing authentication routes with project management routes
 */
export function createMainRouter(prisma: PrismaClient): Router {
  const router = Router();

  console.log('🔧 Creating main router with test endpoint...');

  // Test endpoint (no auth required) - updated at 01:36
  router.get('/test', (req, res) => {
    console.log('🧪 Test endpoint hit!');
    res.json({
      message: 'Project management router is working!',
      timestamp: new Date().toISOString(),
      routes: ['auth', 'projects'],
    });
  });

  console.log('🔧 Test endpoint registered at /test');

  console.log('🔧 Test endpoint registered at /test');

  // Authentication routes (existing)
  router.use('/auth', authRoutes);
  console.log('🔧 Auth routes registered at /auth');

  // Project management routes
  router.use('/projects', createProjectsRoutes(prisma));
  console.log('🔧 Project routes registered at /projects');

  // Future routes
  // router.use('/projects/:projectId/modifications', modificationRoutes);

  // API info endpoint
  router.get('/', (req, res) => {
    console.log('📋 API info endpoint hit!');
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

  console.log('🔧 Main router created successfully with all routes');
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
