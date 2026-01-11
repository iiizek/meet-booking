import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest, CreateBookingDto, UpdateBookingDto } from '../types/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler.js';

// Получить все бронирования пользователя
export async function getMyBookings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { status, upcoming } = req.query;

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        ...(status && { status: status as 'confirmed' | 'cancelled' | 'pending' }),
        ...(upcoming === 'true' && {
          endTime: { gte: new Date() },
          status: 'confirmed',
        }),
      },
      include: {
        room: {
          select: { id: true, name: true, floor: true, capacity: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
}

// Получить все бронирования организации (для календаря)
export async function getOrganizationBookings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const organizationId = req.user?.organizationId;
    
    if (!organizationId) {
      throw new ValidationError('Пользователь не привязан к организации');
    }

    const { startDate, endDate, roomId } = req.query;

    if (!startDate || !endDate) {
      throw new ValidationError('Укажите startDate и endDate');
    }

    const bookings = await prisma.booking.findMany({
      where: {
        room: { organizationId },
        status: { not: 'cancelled' },
        ...(roomId && { roomId: roomId as string }),
        OR: [
          {
            startTime: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string),
            },
          },
          {
            endTime: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string),
            },
          },
          {
            AND: [
              { startTime: { lte: new Date(startDate as string) } },
              { endTime: { gte: new Date(endDate as string) } },
            ],
          },
        ],
      },
      include: {
        room: {
          select: { id: true, name: true, floor: true },
        },
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
}

// Получить бронирование по ID
export async function getBookingById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        room: { organizationId },
      },
      include: {
        room: true,
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundError('Бронирование');
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}

// Создать бронирование
export async function createBooking(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const organizationId = req.user?.organizationId;
    
    const { roomId, title, description, startTime, endTime, participantIds }: CreateBookingDto = req.body;

    // Валидация обязательных полей
    if (!roomId || !title || !startTime || !endTime) {
      throw new ValidationError('roomId, title, startTime и endTime обязательны');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Валидация времени
    if (start >= end) {
      throw new ValidationError('Время окончания должно быть позже времени начала');
    }

    if (start < new Date()) {
      throw new ValidationError('Нельзя создать бронирование в прошлом');
    }

    // Проверка длительности (максимум 8 часов)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours > 8) {
      throw new ValidationError('Максимальная длительность бронирования — 8 часов');
    }

    // Проверяем, что комната принадлежит организации пользователя
    const room = await prisma.room.findFirst({
      where: { id: roomId, organizationId },
    });

    if (!room) {
      throw new NotFoundError('Комната');
    }

    if (!room.isActive) {
      throw new ValidationError('Комната недоступна для бронирования');
    }

    // Проверка конфликтов (дополнительно к триггеру в БД)
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { not: 'cancelled' },
        OR: [
          { startTime: { gte: start, lt: end } },
          { endTime: { gt: start, lte: end } },
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gte: end } },
            ],
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw new ConflictError('Комната уже забронирована на это время');
    }

    // Создаём бронирование с участниками
    const booking = await prisma.booking.create({
      data: {
        roomId,
        userId,
        title,
        description,
        startTime: start,
        endTime: end,
        participants: participantIds?.length
          ? {
              create: participantIds
                .filter((id) => id !== userId) // Исключаем создателя
                .map((id) => ({ userId: id })),
            }
          : undefined,
      },
      include: {
        room: {
          select: { id: true, name: true, floor: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Бронирование успешно создано',
    });
  } catch (error) {
    next(error);
  }
}

// Обновить бронирование
export async function updateBooking(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    
    const { title, description, startTime, endTime, participantIds }: UpdateBookingDto = req.body;

    // Получаем существующее бронирование
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      throw new NotFoundError('Бронирование');
    }

    // Только создатель или админ может редактировать
    if (existingBooking.userId !== userId && !isAdmin) {
      throw new ValidationError('Нет прав на редактирование этого бронирования');
    }

    // Нельзя редактировать прошедшие бронирования
    if (existingBooking.endTime < new Date()) {
      throw new ValidationError('Нельзя редактировать прошедшее бронирование');
    }

    // Подготовка данных для обновления
    const updateData: Record<string, unknown> = {};
    
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    // Если меняется время, проверяем конфликты
    if (startTime || endTime) {
      const start = startTime ? new Date(startTime) : existingBooking.startTime;
      const end = endTime ? new Date(endTime) : existingBooking.endTime;

      if (start >= end) {
        throw new ValidationError('Время окончания должно быть позже времени начала');
      }

      // Проверка конфликтов
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          roomId: existingBooking.roomId,
          id: { not: id },
          status: { not: 'cancelled' },
          OR: [
            { startTime: { gte: start, lt: end } },
            { endTime: { gt: start, lte: end } },
            {
              AND: [
                { startTime: { lte: start } },
                { endTime: { gte: end } },
              ],
            },
          ],
        },
      });

      if (conflictingBooking) {
        throw new ConflictError('Комната уже забронирована на это время');
      }

      updateData.startTime = start;
      updateData.endTime = end;
    }

    // Обновляем бронирование
    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        room: {
          select: { id: true, name: true, floor: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Обновляем участников если переданы
    if (participantIds) {
      // Удаляем старых участников
      await prisma.bookingParticipant.deleteMany({
        where: { bookingId: id },
      });

      // Добавляем новых
      if (participantIds.length > 0) {
        await prisma.bookingParticipant.createMany({
          data: participantIds
            .filter((pId) => pId !== userId)
            .map((pId) => ({ bookingId: id, userId: pId })),
        });
      }
    }

    res.json({
      success: true,
      data: booking,
      message: 'Бронирование успешно обновлено',
    });
  } catch (error) {
    next(error);
  }
}

// Отменить бронирование
export async function cancelBooking(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      throw new NotFoundError('Бронирование');
    }

    // Только создатель или админ может отменить
    if (existingBooking.userId !== userId && !isAdmin) {
      throw new ValidationError('Нет прав на отмену этого бронирования');
    }

    if (existingBooking.status === 'cancelled') {
      throw new ValidationError('Бронирование уже отменено');
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json({
      success: true,
      data: booking,
      message: 'Бронирование отменено',
    });
  } catch (error) {
    next(error);
  }
}

// Удалить бронирование (только админ)
export async function deleteBooking(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        room: { organizationId },
      },
    });

    if (!existingBooking) {
      throw new NotFoundError('Бронирование');
    }

    await prisma.booking.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Бронирование удалено',
    });
  } catch (error) {
    next(error);
  }
}
