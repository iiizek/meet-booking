import { Router } from 'express';
import {
  getCurrentUser,
  register,
  login,
  updateProfile,
  getOrganizationUsers,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Публичные маршруты
router.post('/register', register);
router.post('/login', login);

// Защищённые маршруты
router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, updateProfile);
router.get('/users', authenticate, getOrganizationUsers);

export default router;
