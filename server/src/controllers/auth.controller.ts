import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../types/index.js';
import { generateToken } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';

// Получить текущего пользователя
export async function getCurrentUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

// Регистрация нового пользователя (для разработки/тестирования)
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, name, organizationId } = req.body;

    if (!email || !name) {
      throw new ValidationError('Email и имя обязательны');
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ValidationError('Пользователь с таким email уже существует');
    }

    // Если указана организация, проверяем её существование
    if (organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      });
      if (!org) {
        throw new ValidationError('Организация не найдена');
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        organizationId,
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || undefined,
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      message: 'Регистрация успешна',
    });
  } catch (error) {
    next(error);
  }
}

// Логин по email (для разработки/тестирования)
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email обязателен');
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!user) {
      throw new ValidationError('Пользователь не найден');
    }

    if (!user.isActive) {
      throw new ValidationError('Аккаунт деактивирован');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || undefined,
    });

    res.json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Callback для Google OAuth
export async function googleCallback(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Passport уже добавил пользователя в req.user
    const user = req.user;

    if (!user) {
      throw new ValidationError('Ошибка авторизации через Google');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || undefined,
    });

    // Редирект на клиент с токеном
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  } catch (error) {
    next(error);
  }
}

// Обновить профиль
export async function updateProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { name, avatarUrl } = req.body;

    const updateData: Record<string, string> = {};
    if (name) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.json({
      success: true,
      data: user,
      message: 'Профиль обновлён',
    });
  } catch (error) {
    next(error);
  }
}

// Получить пользователей организации
export async function getOrganizationUsers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw new ValidationError('Пользователь не привязан к организации');
    }

    const users = await prisma.user.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}
