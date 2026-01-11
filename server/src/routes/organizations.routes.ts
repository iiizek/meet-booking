import { Router } from 'express';
import {
  createOrganization,
  getMyOrganization,
  updateOrganization,
  createInvite,
  getInvites,
  revokeInvite,
  joinOrganization,
  leaveOrganization,
  removeMember,
  changeMemberRole,
  checkInviteCode,
} from '../controllers/organizations.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Публичный эндпоинт - проверка инвайт-кода
router.get('/invites/check/:code', checkInviteCode);

// Все остальные маршруты требуют авторизации
router.use(authenticate);

// Управление организацией
router.post('/', createOrganization); // Создать организацию
router.get('/my', getMyOrganization); // Получить свою организацию
router.patch('/my', requireAdmin, updateOrganization); // Обновить (только админ)

// Присоединение/выход
router.post('/join', joinOrganization); // Присоединиться по коду
router.post('/leave', leaveOrganization); // Покинуть организацию

// Инвайты (только админ)
router.post('/invites', requireAdmin, createInvite);
router.get('/invites', requireAdmin, getInvites);
router.delete('/invites/:inviteId', requireAdmin, revokeInvite);

// Управление участниками (только админ)
router.delete('/members/:memberId', requireAdmin, removeMember);
router.patch('/members/:memberId/role', requireAdmin, changeMemberRole);

export default router;
