import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../core/middleware/error.middleware';
import { RegisterSchema, LoginSchema, UpdateProfileSchema, ChangeTierSchema } from './auth.schema';
import { authenticateJwt } from '../../core/middleware/auth.middleware';

const router = Router();

// Halka açık (Public) rotalar
router.post('/register', validateRequest(RegisterSchema), authController.register);
router.post('/login', validateRequest(LoginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

// Korumalı (Protected) rotalar
router.get('/me', authenticateJwt, authController.getProfile);
router.put('/me', authenticateJwt, validateRequest(UpdateProfileSchema), authController.updateProfile);
router.post('/subscription', authenticateJwt, validateRequest(ChangeTierSchema), authController.changeTier);

export const authRoutes = router;
