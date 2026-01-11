import { Router } from 'express';
import {
  getAmenities,
  uploadRoomImage,
  deleteRoomImage,
  getRoomAmenities,
} from '../controllers/common.controller.js';
import { authenticate, requireAdmin, requireOrganization } from '../middleware/auth.js';
import { uploadRoomImage as uploadMiddleware } from '../services/upload.service.js';

const router = Router();

// Публичный эндпоинт - список всех amenities
router.get('/amenities', getAmenities);

// Защищённые эндпоинты
router.use(authenticate);
router.use(requireOrganization);

// Amenities комнаты
router.get('/rooms/:roomId/amenities', getRoomAmenities);

// Загрузка изображений (только админ)
router.post(
  '/rooms/:roomId/image',
  requireAdmin,
  uploadMiddleware.single('image'),
  uploadRoomImage
);

router.delete('/rooms/:roomId/image', requireAdmin, deleteRoomImage);

export default router;
