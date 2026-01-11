import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { config } from '../config/index.js';

// Кастомный класс ошибки
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Ошибка "Не найдено"
export class NotFoundError extends AppError {
  constructor(resource: string = 'Ресурс') {
    super(`${resource} не найден`, 404);
  }
}

// Ошибка валидации
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

// Ошибка конфликта (например, при бронировании)
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

// Глобальный обработчик ошибок
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Логирование ошибки
  console.error('Error:', {
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Обработка ошибок Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Нарушение уникальности
        res.status(409).json({
          success: false,
          error: 'Запись с такими данными уже существует',
        });
        return;
      case 'P2025':
        // Запись не найдена
        res.status(404).json({
          success: false,
          error: 'Запись не найдена',
        });
        return;
      case 'P2003':
        // Нарушение внешнего ключа
        res.status(400).json({
          success: false,
          error: 'Связанная запись не найдена',
        });
        return;
      default:
        res.status(500).json({
          success: false,
          error: 'Ошибка базы данных',
        });
        return;
    }
  }

  // Ошибка от триггера PostgreSQL (конфликт бронирования)
  if (err.message.includes('Booking conflict')) {
    res.status(409).json({
      success: false,
      error: 'Комната уже забронирована на это время',
    });
    return;
  }

  // Обработка кастомных ошибок приложения
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Неизвестные ошибки
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'production' 
      ? 'Внутренняя ошибка сервера' 
      : err.message,
  });
}

// Обработчик для несуществующих маршрутов
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Маршрут ${req.method} ${req.path} не найден`,
  });
}
