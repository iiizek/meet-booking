import { Router } from 'express';
import passport from 'passport';
import {
  getCurrentUser,
  register,
  login,
  googleCallback,
  updateProfile,
  getOrganizationUsers,
  disconnectGoogle,
  getGoogleStatus,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Публичные маршруты
router.post('/register', register);
router.post('/login', login);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    accessType: 'offline',
    prompt: 'consent',
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/auth/google/failure',
  }),
  googleCallback
);

router.get('/google/failure', (_, res) => {
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=google_auth_failed`);
});

// Защищённые маршруты
router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, updateProfile);
router.get('/users', authenticate, getOrganizationUsers);

// Google интеграция
router.get('/google/status', authenticate, getGoogleStatus);
router.post('/google/disconnect', authenticate, disconnectGoogle);

export default router;
