import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProjectModificationsController } from '../controllers/project-modifications.controller';
import { authenticateUser } from '../middleware/auth';

/**
 * Create project modifications routes
 */
export function createProjectModificationsRoutes(prisma: PrismaClient): Router {
  const router = Router({ mergeParams: true }); // Enable mergeParams to access parent route params
  const modificationsController = new ProjectModificationsController(prisma);

  // Apply authentication middleware to all modification routes
  router.use(authenticateUser);

  // Modification routes for a specific project
  router.get('/', modificationsController.getProjectModifications);
  router.post('/', modificationsController.createProjectModification);
  router.post(
    '/batch',
    modificationsController.batchCreateProjectModifications,
  );

  return router;
}

/**
 * Default export for direct import
 */
export default createProjectModificationsRoutes;
