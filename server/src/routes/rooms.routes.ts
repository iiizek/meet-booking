import { Router } from 'express';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomAvailability,
} from '../controllers/rooms.controller.js';
import { authenticate, requireAdmin, requireOrganization } from '../middleware/auth.js';

const router = Router();

// Все маршруты требуют авторизации и принадлежности к организации
router.use(authenticate);
router.use(requireOrganization);

// Получить все комнаты
router.get('/', getRooms);

// Получить комнату по ID
router.get('/:id', getRoomById);

// Получить доступность комнаты на дату
router.get('/:id/availability', getRoomAvailability);

// Создать комнату (только админ)
router.post('/', requireAdmin, createRoom);

// Обновить комнату (только админ)
router.patch('/:id', requireAdmin, updateRoom);

// Удалить комнату (только админ)
router.delete('/:id', requireAdmin, deleteRoom);

export default router;
