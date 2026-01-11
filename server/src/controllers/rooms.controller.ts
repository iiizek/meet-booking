import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest, CreateRoomDto, UpdateRoomDto } from '../types/index.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';

// Получить все комнаты организации
export async function getRooms(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const organizationId = req.user?.organizationId;
    
    if (!organizationId) {
      throw new ValidationError('Пользователь не привязан к организации');
    }

    const { minCapacity, maxCapacity, floor, amenities, isActive } = req.query;

    const rooms = await prisma.room.findMany({
      where: {
        organizationId,
        ...(minCapacity && { capacity: { gte: Number(minCapacity) } }),
        ...(maxCapacity && { capacity: { lte: Number(maxCapacity) } }),
        ...(floor && { floor: Number(floor) }),
        ...(amenities && {
          amenities: {
            hasEvery: (amenities as string).split(','),
          },
        }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
}

// Получить комнату по ID
export async function getRoomById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const room = await prisma.room.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        bookings: {
          where: {
            status: 'confirmed',
            endTime: { gte: new Date() },
          },
          orderBy: { startTime: 'asc' },
          take: 10,
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Комната');
    }

    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

// Создать комнату (только админ)
export async function createRoom(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const organizationId = req.user?.organizationId;
    
    if (!organizationId) {
      throw new ValidationError('Пользователь не привязан к организации');
    }

    const { name, description, capacity, floor, amenities, imageUrl }: CreateRoomDto = req.body;

    if (!name || !capacity) {
      throw new ValidationError('Название и вместимость обязательны');
    }

    if (capacity <= 0) {
      throw new ValidationError('Вместимость должна быть больше 0');
    }

    const room = await prisma.room.create({
      data: {
        organizationId,
        name,
        description,
        capacity,
        floor,
        amenities: amenities || [],
        imageUrl,
      },
    });

    res.status(201).json({
      success: true,
      data: room,
      message: 'Комната успешно создана',
    });
  } catch (error) {
    next(error);
  }
}

// Обновить комнату (только админ)
export async function updateRoom(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    const updateData: UpdateRoomDto = req.body;

    // Проверяем существование комнаты
    const existingRoom = await prisma.room.findFirst({
      where: { id, organizationId },
    });

    if (!existingRoom) {
      throw new NotFoundError('Комната');
    }

    if (updateData.capacity !== undefined && updateData.capacity <= 0) {
      throw new ValidationError('Вместимость должна быть больше 0');
    }

    const room = await prisma.room.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: room,
      message: 'Комната успешно обновлена',
    });
  } catch (error) {
    next(error);
  }
}

// Удалить комнату (только админ)
export async function deleteRoom(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    // Проверяем существование комнаты
    const existingRoom = await prisma.room.findFirst({
      where: { id, organizationId },
    });

    if (!existingRoom) {
      throw new NotFoundError('Комната');
    }

    // Проверяем наличие активных бронирований
    const activeBookings = await prisma.booking.count({
      where: {
        roomId: id,
        status: 'confirmed',
        endTime: { gte: new Date() },
      },
    });

    if (activeBookings > 0) {
      throw new ValidationError(
        `Невозможно удалить комнату: есть ${activeBookings} активных бронирований`
      );
    }

    await prisma.room.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Комната успешно удалена',
    });
  } catch (error) {
    next(error);
  }
}

// Получить доступность комнаты на определённую дату
export async function getRoomAvailability(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { date } = req.query;
    const organizationId = req.user?.organizationId;

    if (!date) {
      throw new ValidationError('Дата обязательна');
    }

    // Проверяем существование комнаты
    const room = await prisma.room.findFirst({
      where: { id, organizationId },
    });

    if (!room) {
      throw new NotFoundError('Комната');
    }

    // Получаем начало и конец дня
    const startOfDay = new Date(date as string);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date as string);
    endOfDay.setHours(23, 59, 59, 999);

    // Получаем все бронирования на этот день
    const bookings = await prisma.booking.findMany({
      where: {
        roomId: id,
        status: { not: 'cancelled' },
        OR: [
          {
            startTime: { gte: startOfDay, lte: endOfDay },
          },
          {
            endTime: { gte: startOfDay, lte: endOfDay },
          },
          {
            AND: [
              { startTime: { lte: startOfDay } },
              { endTime: { gte: endOfDay } },
            ],
          },
        ],
      },
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        user: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      success: true,
      data: {
        room: {
          id: room.id,
          name: room.name,
        },
        date: date,
        bookings,
      },
    });
  } catch (error) {
    next(error);
  }
}
