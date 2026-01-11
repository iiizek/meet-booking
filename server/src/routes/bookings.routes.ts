import { Router } from 'express';
import {
  getMyBookings,
  getOrganizationBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  deleteBooking,
} from '../controllers/bookings.controller.js';
import { authenticate, requireAdmin, requireOrganization } from '../middleware/auth.js';

const router = Router();

// Все маршруты требуют авторизации
router.use(authenticate);
router.use(requireOrganization);

// Получить мои бронирования
router.get('/my', getMyBookings);

// Получить все бронирования организации (для календаря)
router.get('/', getOrganizationBookings);

// Получить бронирование по ID
router.get('/:id', getBookingById);

// Создать бронирование
router.post('/', createBooking);

// Обновить бронирование
router.patch('/:id', updateBooking);

// Отменить бронирование
router.post('/:id/cancel', cancelBooking);

// Удалить бронирование (только админ)
router.delete('/:id', requireAdmin, deleteBooking);

export default router;
