import { Request } from 'express';
import { User } from '@prisma/client';

// Расширяем тип User с Google токенами
export interface UserWithGoogleTokens extends User {
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
}

// Расширение Request для добавления пользователя
export interface AuthRequest extends Request {
  user?: UserWithGoogleTokens;
}

// DTO для создания организации
export interface CreateOrganizationDto {
  name: string;
  slug: string;
  description?: string;
}

// DTO для обновления организации
export interface UpdateOrganizationDto {
  name?: string;
  description?: string;
}

// DTO для создания комнаты
export interface CreateRoomDto {
  organizationId: string;
  name: string;
  description?: string;
  capacity: number;
  floor?: number;
  amenities?: string[];
  imageUrl?: string;
}

// DTO для обновления комнаты
export interface UpdateRoomDto {
  name?: string;
  description?: string;
  capacity?: number;
  floor?: number;
  amenities?: string[];
  imageUrl?: string;
  isActive?: boolean;
}

// DTO для создания бронирования
export interface CreateBookingDto {
  roomId: string;
  title: string;
  description?: string;
  startTime: string; // ISO date string
  endTime: string;   // ISO date string
  participantIds?: string[];
}

// DTO для обновления бронирования
export interface UpdateBookingDto {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  participantIds?: string[];
}

// Фильтры для поиска бронирований
export interface BookingFilters {
  roomId?: string;
  userId?: string;
  status?: 'confirmed' | 'cancelled' | 'pending';
  startDate?: string;
  endDate?: string;
}

// Фильтры для поиска комнат
export interface RoomFilters {
  organizationId?: string;
  minCapacity?: number;
  maxCapacity?: number;
  floor?: number;
  amenities?: string[];
  isActive?: boolean;
}

// Стандартный ответ API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Пагинация
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
}
