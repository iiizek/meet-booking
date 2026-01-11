import { Router } from 'express';
import {
  getCalendarEvents,
  syncBookingToCalendar,
  syncAllBookings,
  unlinkFromCalendar,
} from '../controllers/calendar.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Все маршруты требуют авторизации
router.use(authenticate);

// Получить события из Google Calendar
router.get('/events', getCalendarEvents);

// Синхронизировать конкретное бронирование
router.post('/sync/:bookingId', syncBookingToCalendar);

// Синхронизировать все несинхронизированные бронирования
router.post('/sync-all', syncAllBookings);

// Отвязать бронирование от Google Calendar
router.delete('/unlink/:bookingId', unlinkFromCalendar);

export default router;
