import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../types/index.js';
import { ValidationError } from '../middleware/errorHandler.js';
import { googleCalendarService } from '../services/googleCalendar.service.js';

// Получить события из Google Calendar
export async function getCalendarEvents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    const { startDate, endDate } = req.query;

    if (!user.googleAccessToken) {
      throw new ValidationError('Google Calendar не подключён');
    }

    if (!startDate || !endDate) {
      throw new ValidationError('Укажите startDate и endDate');
    }

    const events = await googleCalendarService.listEvents(
      user,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: events.map((event) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        htmlLink: event.htmlLink,
        status: event.status,
        // Проверяем, связано ли событие с нашей системой
        isBookingEvent: !!event.extendedProperties?.private?.bookingId,
        bookingId: event.extendedProperties?.private?.bookingId,
      })),
    });
  } catch (error) {
    next(error);
  }
}

// Синхронизировать бронирование с Google Calendar вручную
export async function syncBookingToCalendar(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { bookingId } = req.params;
    const user = req.user!;

    if (!user.googleAccessToken) {
      throw new ValidationError('Google Calendar не подключён');
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: user.id,
      },
      include: {
        room: true,
        participants: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new ValidationError('Бронирование не найдено');
    }

    if (booking.status === 'cancelled') {
      throw new ValidationError('Нельзя синхронизировать отменённое бронирование');
    }

    const attendeeEmails = booking.participants.map((p) => p.user.email);

    let result;
    if (booking.googleEventId) {
      result = await googleCalendarService.updateEvent(user, booking, attendeeEmails);
    } else {
      result = await googleCalendarService.createEvent(user, booking, attendeeEmails);
    }

    res.json({
      success: true,
      data: result,
      message: 'Бронирование синхронизировано с Google Calendar',
    });
  } catch (error) {
    next(error);
  }
}

// Синхронизировать все предстоящие бронирования
export async function syncAllBookings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;

    if (!user.googleAccessToken) {
      throw new ValidationError('Google Calendar не подключён');
    }

    // Получаем все предстоящие бронирования пользователя без синхронизации
    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        status: 'confirmed',
        endTime: { gte: new Date() },
        googleCalendarSynced: false,
      },
      include: {
        room: true,
        participants: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    const results = {
      total: bookings.length,
      synced: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const booking of bookings) {
      try {
        const attendeeEmails = booking.participants.map((p) => p.user.email);
        await googleCalendarService.createEvent(user, booking, attendeeEmails);
        results.synced++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Booking ${booking.id}: ${(error as Error).message}`);
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Синхронизировано ${results.synced} из ${results.total} бронирований`,
    });
  } catch (error) {
    next(error);
  }
}

// Удалить событие из Google Calendar (отвязать)
export async function unlinkFromCalendar(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { bookingId } = req.params;
    const user = req.user!;

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: user.id,
      },
    });

    if (!booking) {
      throw new ValidationError('Бронирование не найдено');
    }

    if (booking.googleEventId && user.googleAccessToken) {
      try {
        await googleCalendarService.deleteEvent(user, booking.googleEventId);
      } catch (error) {
        console.error('Failed to delete Google Calendar event:', error);
      }
    }

    // Обновляем бронирование
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        googleEventId: null,
        googleCalendarSynced: false,
      },
    });

    res.json({
      success: true,
      message: 'Событие удалено из Google Calendar',
    });
  } catch (error) {
    next(error);
  }
}
