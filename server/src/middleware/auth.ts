import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import prisma from '../lib/prisma.js';
import { AuthRequest, JwtPayload } from '../types/index.js';

// Middleware для проверки JWT токена
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Токен авторизации не предоставлен',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Верификация токена
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Получаем пользователя из БД
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Пользователь не найден',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: 'Аккаунт деактивирован',
      });
      return;
    }

    // Добавляем пользователя в request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Токен истёк',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Недействительный токен',
      });
      return;
    }

    next(error);
  }
}

// Middleware для проверки роли администратора
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Требуется авторизация',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Требуются права администратора',
    });
    return;
  }

  next();
}

// Middleware для проверки принадлежности к организации
export function requireOrganization(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Требуется авторизация',
    });
    return;
  }

  if (!req.user.organizationId) {
    res.status(403).json({
      success: false,
      error: 'Пользователь не привязан к организации',
    });
    return;
  }

  next();
}

// Генерация JWT токена
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}
