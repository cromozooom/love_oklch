import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';

const router = Router();

/**
 * Authentication Routes
 * Base path: /api/v1/auth
 */

// POST /api/v1/auth/login
router.post('/login', AuthController.login);

// GET /api/v1/auth/verify
router.get('/verify', AuthController.verify);

// POST /api/v1/auth/logout
router.post('/logout', AuthController.logout);

export { router as authRoutes };
