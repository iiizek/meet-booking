import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';
import { Booking, User, Room } from '@prisma/client';

// Типы для событий календаря
interface CalendarEventInput {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  location?: string;
}

interface CalendarEventResult {
  eventId: string;
  htmlLink: string;
}

// Класс для работы с Google Calendar
export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.callbackUrl
    );
  }

  // Установка токенов пользователя
  private setCredentials(accessToken: string, refreshToken?: string): void {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  // Обновление токена если истёк
  private async refreshAccessToken(userId: string): Promise<string> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Сохраняем новый access token в БД
      if (credentials.access_token) {
        await prisma.user.update({
          where: { id: userId },
          data: { googleAccessToken: credentials.access_token },
        });
      }

      return credentials.access_token || '';
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Не удалось обновить токен Google. Пожалуйста, войдите снова.');
    }
  }

  // Получение клиента календаря
  private async getCalendarClient(user: User): Promise<calendar_v3.Calendar> {
    if (!user.googleAccessToken) {
      throw new Error('Пользователь не авторизован через Google');
    }

    this.setCredentials(user.googleAccessToken, user.googleRefreshToken || undefined);

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Создание события в Google Calendar
  async createEvent(
    user: User,
    booking: Booking & { room: Room },
    attendeeEmails: string[] = []
  ): Promise<CalendarEventResult> {
    try {
      const calendar = await this.getCalendarClient(user);

      const event: calendar_v3.Schema$Event = {
        summary: booking.title,
        description: booking.description || undefined,
        location: `${booking.room.name}${booking.room.floor ? `, Этаж ${booking.room.floor}` : ''}`,
        start: {
          dateTime: booking.startTime.toISOString(),
          timeZone: 'Europe/Moscow',
        },
        end: {
          dateTime: booking.endTime.toISOString(),
          timeZone: 'Europe/Moscow',
        },
        attendees: attendeeEmails.map((email) => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 30 },
            { method: 'popup', minutes: 15 },
          ],
        },
        // Добавляем метаданные для идентификации
        extendedProperties: {
          private: {
            bookingId: booking.id,
            roomId: booking.roomId,
          },
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all', // Отправить приглашения участникам
      });

      if (!response.data.id) {
        throw new Error('Google Calendar не вернул ID события');
      }

      // Обновляем бронирование с ID события Google
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          googleEventId: response.data.id,
          googleCalendarSynced: true,
        },
      });

      return {
        eventId: response.data.id,
        htmlLink: response.data.htmlLink || '',
      };
    } catch (error: unknown) {
      // Если токен истёк, пробуем обновить
      if (this.isTokenExpiredError(error)) {
        await this.refreshAccessToken(user.id);
        // Повторяем запрос
        return this.createEvent(user, booking, attendeeEmails);
      }
      
      console.error('Error creating Google Calendar event:', error);
      throw new Error('Не удалось создать событие в Google Calendar');
    }
  }

  // Обновление события в Google Calendar
  async updateEvent(
    user: User,
    booking: Booking & { room: Room },
    attendeeEmails: string[] = []
  ): Promise<CalendarEventResult> {
    try {
      if (!booking.googleEventId) {
        // Если события нет, создаём новое
        return this.createEvent(user, booking, attendeeEmails);
      }

      const calendar = await this.getCalendarClient(user);

      const event: calendar_v3.Schema$Event = {
        summary: booking.title,
        description: booking.description || undefined,
        location: `${booking.room.name}${booking.room.floor ? `, Этаж ${booking.room.floor}` : ''}`,
        start: {
          dateTime: booking.startTime.toISOString(),
          timeZone: 'Europe/Moscow',
        },
        end: {
          dateTime: booking.endTime.toISOString(),
          timeZone: 'Europe/Moscow',
        },
        attendees: attendeeEmails.map((email) => ({ email })),
      };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: booking.googleEventId,
        requestBody: event,
        sendUpdates: 'all',
      });

      return {
        eventId: response.data.id || booking.googleEventId,
        htmlLink: response.data.htmlLink || '',
      };
    } catch (error: unknown) {
      if (this.isTokenExpiredError(error)) {
        await this.refreshAccessToken(user.id);
        return this.updateEvent(user, booking, attendeeEmails);
      }

      // Если событие не найдено, создаём новое
      if (this.isNotFoundError(error)) {
        return this.createEvent(user, booking, attendeeEmails);
      }

      console.error('Error updating Google Calendar event:', error);
      throw new Error('Не удалось обновить событие в Google Calendar');
    }
  }

  // Удаление события из Google Calendar
  async deleteEvent(user: User, googleEventId: string): Promise<void> {
    try {
      if (!googleEventId) return;

      const calendar = await this.getCalendarClient(user);

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId,
        sendUpdates: 'all',
      });
    } catch (error: unknown) {
      if (this.isTokenExpiredError(error)) {
        await this.refreshAccessToken(user.id);
        return this.deleteEvent(user, googleEventId);
      }

      // Если событие уже удалено, игнорируем
      if (this.isNotFoundError(error)) {
        return;
      }

      console.error('Error deleting Google Calendar event:', error);
      throw new Error('Не удалось удалить событие из Google Calendar');
    }
  }

  // Отмена события (помечает как отменённое, но не удаляет)
  async cancelEvent(user: User, googleEventId: string): Promise<void> {
    try {
      if (!googleEventId) return;

      const calendar = await this.getCalendarClient(user);

      await calendar.events.patch({
        calendarId: 'primary',
        eventId: googleEventId,
        requestBody: {
          status: 'cancelled',
        },
        sendUpdates: 'all',
      });
    } catch (error: unknown) {
      if (this.isTokenExpiredError(error)) {
        await this.refreshAccessToken(user.id);
        return this.cancelEvent(user, googleEventId);
      }

      if (this.isNotFoundError(error)) {
        return;
      }

      console.error('Error cancelling Google Calendar event:', error);
      throw new Error('Не удалось отменить событие в Google Calendar');
    }
  }

  // Получение списка событий пользователя
  async listEvents(
    user: User,
    timeMin: Date,
    timeMax: Date
  ): Promise<calendar_v3.Schema$Event[]> {
    try {
      const calendar = await this.getCalendarClient(user);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error: unknown) {
      if (this.isTokenExpiredError(error)) {
        await this.refreshAccessToken(user.id);
        return this.listEvents(user, timeMin, timeMax);
      }

      console.error('Error listing Google Calendar events:', error);
      throw new Error('Не удалось получить события из Google Calendar');
    }
  }

  // Проверка, является ли ошибка истёкшим токеном
  private isTokenExpiredError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'code' in error) {
      return (error as { code: number }).code === 401;
    }
    return false;
  }

  // Проверка, является ли ошибка "не найдено"
  private isNotFoundError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'code' in error) {
      return (error as { code: number }).code === 404;
    }
    return false;
  }
}

// Singleton instance
export const googleCalendarService = new GoogleCalendarService();
