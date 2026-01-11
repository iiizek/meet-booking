import { Router } from 'express';
import authRoutes from './auth.routes.js';
import roomsRoutes from './rooms.routes.js';
import bookingsRoutes from './bookings.routes.js';
import calendarRoutes from './calendar.routes.js';
import commonRoutes from './common.routes.js';

const router = Router();

// Health check
router.get('/health', (_, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/rooms', roomsRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/calendar', calendarRoutes);
router.use('/', commonRoutes); // amenities, uploads

export default router;
