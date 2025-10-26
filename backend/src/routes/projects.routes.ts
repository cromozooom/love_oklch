import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProjectsController } from '../controllers/projects.controller';
import { authenticateUser } from '../middleware/auth';

/**
 * Create projects routes
 */
export function createProjectsRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const projectsController = new ProjectsController(prisma);

  // Apply authentication middleware to all project routes
  router.use(authenticateUser);

  // Project CRUD routes
  router.post('/', projectsController.createProject);
  router.get('/', projectsController.getProjects);
  router.get('/options', projectsController.getProjectOptions); // Get color options (no auth needed for options)
  router.get('/limits', projectsController.getProjectLimits);
  router.get('/dashboard/summary', projectsController.getDashboardSummary);
  router.get('/search', projectsController.searchProjects);
  router.get('/:id', projectsController.getProjectById);
  router.put('/:id', projectsController.updateProject);
  router.delete('/:id', projectsController.deleteProject);

  return router;
}

/**
 * Default export for direct import
 */
export default createProjectsRoutes;
