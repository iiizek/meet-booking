import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../types/index.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { 
  deleteFile, 
  getFilePath, 
  getFileUrl, 
  extractFilename 
} from '../services/upload.service.js';
import { 
  getAllAmenities, 
  getAmenitiesInfo, 
  AMENITY_GROUPS 
} from '../constants/amenities.js';

// Получить все доступные amenities
export async function getAmenities(
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  res.json({
    success: true,
    data: {
      amenities: getAllAmenities(),
      groups: AMENITY_GROUPS,
    },
  });
}

// Загрузить изображение комнаты
export async function uploadRoomImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { roomId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!req.file) {
      throw new ValidationError('Файл не загружен');
    }

    // Проверяем существование комнаты
    const room = await prisma.room.findFirst({
      where: { id: roomId, organizationId },
    });

    if (!room) {
      // Удаляем загруженный файл
      deleteFile(req.file.path);
      throw new NotFoundError('Комната');
    }

    // Если у комнаты уже есть изображение, удаляем его
    if (room.imageUrl) {
      const oldFilename = extractFilename(room.imageUrl);
      if (oldFilename) {
        deleteFile(getFilePath(oldFilename, 'rooms'));
      }
    }

    // Формируем URL нового изображения
    const imageUrl = getFileUrl(req.file.filename, 'rooms');

    // Обновляем комнату
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { imageUrl },
    });

    res.json({
      success: true,
      data: {
        imageUrl: updatedRoom.imageUrl,
      },
      message: 'Изображение успешно загружено',
    });
  } catch (error) {
    // Удаляем файл при ошибке
    if (req.file) {
      deleteFile(req.file.path);
    }
    next(error);
  }
}

// Удалить изображение комнаты
export async function deleteRoomImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { roomId } = req.params;
    const organizationId = req.user?.organizationId;

    const room = await prisma.room.findFirst({
      where: { id: roomId, organizationId },
    });

    if (!room) {
      throw new NotFoundError('Комната');
    }

    if (!room.imageUrl) {
      throw new ValidationError('У комнаты нет изображения');
    }

    // Удаляем файл
    const filename = extractFilename(room.imageUrl);
    if (filename) {
      deleteFile(getFilePath(filename, 'rooms'));
    }

    // Обновляем комнату
    await prisma.room.update({
      where: { id: roomId },
      data: { imageUrl: null },
    });

    res.json({
      success: true,
      message: 'Изображение удалено',
    });
  } catch (error) {
    next(error);
  }
}

// Получить amenities для конкретной комнаты (с полной информацией)
export async function getRoomAmenities(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { roomId } = req.params;
    const organizationId = req.user?.organizationId;

    const room = await prisma.room.findFirst({
      where: { id: roomId, organizationId },
      select: { amenities: true },
    });

    if (!room) {
      throw new NotFoundError('Комната');
    }

    const amenityCodes = room.amenities as string[];
    const amenitiesInfo = getAmenitiesInfo(amenityCodes);

    res.json({
      success: true,
      data: amenitiesInfo,
    });
  } catch (error) {
    next(error);
  }
}
