import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../types/index.js';
import { ValidationError, NotFoundError, ConflictError } from '../middleware/errorHandler.js';

// Генерация инвайт-кода
function generateInviteCode(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase(); // 12 символов
}

// Генерация slug из названия
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

// Создать организацию
export async function createOrganization(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { name, description } = req.body;

    if (!name || name.trim().length < 2) {
      throw new ValidationError('Название организации должно быть не менее 2 символов');
    }

    // Проверяем, что пользователь ещё не в организации
    if (req.user!.organizationId) {
      throw new ConflictError('Вы уже состоите в организации. Сначала покиньте текущую.');
    }

    // Генерируем уникальный slug
    let slug = generateSlug(name);
    let slugSuffix = 0;
    
    while (true) {
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: slugSuffix ? `${slug}-${slugSuffix}` : slug },
      });
      if (!existingOrg) break;
      slugSuffix++;
    }
    
    if (slugSuffix) {
      slug = `${slug}-${slugSuffix}`;
    }

    // Создаём организацию и обновляем пользователя в транзакции
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: name.trim(),
          slug,
          description: description?.trim(),
        },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: {
          organizationId: organization.id,
          role: 'admin', // Создатель становится админом
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organizationId: true,
        },
      });

      return { organization, user };
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Организация успешно создана',
    });
  } catch (error) {
    next(error);
  }
}

// Получить информацию о текущей организации
export async function getMyOrganization(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      res.json({
        success: true,
        data: null,
        message: 'Вы не состоите в организации',
      });
      return;
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            users: true,
            rooms: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
}

// Обновить организацию (только админ)
export async function updateOrganization(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const organizationId = req.user?.organizationId;
    const { name, description } = req.body;

    if (!organizationId) {
      throw new ValidationError('Вы не состоите в организации');
    }

    const updateData: Record<string, string> = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    res.json({
      success: true,
      data: organization,
      message: 'Организация обновлена',
    });
  } catch (error) {
    next(error);
  }
}

// Создать инвайт-код
export async function createInvite(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const organizationId = req.user?.organizationId;
    const { email, role = 'member', expiresInDays = 7 } = req.body;

    if (!organizationId) {
      throw new ValidationError('Вы не состоите в организации');
    }

    // Проверяем, что указанная роль допустима
    if (role !== 'member' && role !== 'admin') {
      throw new ValidationError('Недопустимая роль');
    }

    // Только админ может создавать инвайты с ролью admin
    if (role === 'admin' && req.user!.role !== 'admin') {
      throw new ValidationError('Только администратор может создавать инвайты с ролью admin');
    }

    // Если указан email, проверяем что пользователь с таким email ещё не в организации
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser?.organizationId === organizationId) {
        throw new ConflictError('Пользователь с этим email уже в вашей организации');
      }
    }

    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invite = await prisma.organizationInvite.create({
      data: {
        organizationId,
        code,
        createdById: userId,
        email: email || null,
        role,
        expiresAt,
      },
      include: {
        organization: {
          select: { name: true, slug: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        code: invite.code,
        expiresAt: invite.expiresAt,
        email: invite.email,
        role: invite.role,
        organization: invite.organization,
      },
      message: 'Инвайт-код создан',
    });
  } catch (error) {
    next(error);
  }
}

// Получить список активных инвайтов
export async function getInvites(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw new ValidationError('Вы не состоите в организации');
    }

    const invites = await prisma.organizationInvite.findMany({
      where: {
        organizationId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: invites,
    });
  } catch (error) {
    next(error);
  }
}

// Отозвать инвайт
export async function revokeInvite(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { inviteId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw new ValidationError('Вы не состоите в организации');
    }

    const invite = await prisma.organizationInvite.findFirst({
      where: { id: inviteId, organizationId },
    });

    if (!invite) {
      throw new NotFoundError('Инвайт');
    }

    if (invite.usedAt) {
      throw new ValidationError('Инвайт уже использован');
    }

    await prisma.organizationInvite.delete({
      where: { id: inviteId },
    });

    res.json({
      success: true,
      message: 'Инвайт отозван',
    });
  } catch (error) {
    next(error);
  }
}

// Присоединиться к организации по инвайт-коду
export async function joinOrganization(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    const { code } = req.body;

    if (!code) {
      throw new ValidationError('Введите инвайт-код');
    }

    // Проверяем, что пользователь ещё не в организации
    if (req.user!.organizationId) {
      throw new ConflictError('Вы уже состоите в организации. Сначала покиньте текущую.');
    }

    // Ищем инвайт
    const invite = await prisma.organizationInvite.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        organization: true,
      },
    });

    if (!invite) {
      throw new NotFoundError('Инвайт-код не найден');
    }

    if (invite.usedAt) {
      throw new ValidationError('Этот инвайт-код уже использован');
    }

    if (invite.expiresAt < new Date()) {
      throw new ValidationError('Срок действия инвайт-кода истёк');
    }

    // Если инвайт для конкретного email, проверяем
    if (invite.email && invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ValidationError('Этот инвайт-код предназначен для другого email');
    }

    // Присоединяемся к организации
    const result = await prisma.$transaction(async (tx) => {
      // Помечаем инвайт как использованный
      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: {
          usedById: userId,
          usedAt: new Date(),
        },
      });

      // Обновляем пользователя
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          organizationId: invite.organizationId,
          role: invite.role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organizationId: true,
          organization: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      return user;
    });

    res.json({
      success: true,
      data: result,
      message: `Вы присоединились к организации "${invite.organization.name}"`,
    });
  } catch (error) {
    next(error);
  }
}

// Покинуть организацию
export async function leaveOrganization(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      throw new ValidationError('Вы не состоите в организации');
    }

    // Проверяем, не единственный ли это админ
    if (req.user!.role === 'admin') {
      const adminCount = await prisma.user.count({
        where: {
          organizationId,
          role: 'admin',
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        throw new ValidationError(
          'Вы единственный администратор. Назначьте другого администратора перед уходом или удалите организацию.'
        );
      }
    }

    // Отменяем все предстоящие бронирования пользователя
    await prisma.booking.updateMany({
      where: {
        userId,
        status: 'confirmed',
        startTime: { gt: new Date() },
      },
      data: { status: 'cancelled' },
    });

    // Убираем пользователя из организации
    await prisma.user.update({
      where: { id: userId },
      data: {
        organizationId: null,
        role: 'member',
      },
    });

    res.json({
      success: true,
      message: 'Вы покинули организацию',
    });
  } catch (error) {
    next(error);
  }
}

// Удалить участника из организации (только админ)
export async function removeMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { memberId } = req.params;
    const organizationId = req.user?.organizationId;
    const currentUserId = req.user!.id;

    if (!organizationId) {
      throw new ValidationError('Вы не состоите в организации');
    }

    if (memberId === currentUserId) {
      throw new ValidationError('Используйте функцию "Покинуть организацию" для выхода');
    }

    const member = await prisma.user.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundError('Участник не найден в вашей организации');
    }

    // Отменяем все предстоящие бронирования участника
    await prisma.booking.updateMany({
      where: {
        userId: memberId,
        status: 'confirmed',
        startTime: { gt: new Date() },
      },
      data: { status: 'cancelled' },
    });

    // Убираем участника из организации
    await prisma.user.update({
      where: { id: memberId },
      data: {
        organizationId: null,
        role: 'member',
      },
    });

    res.json({
      success: true,
      message: 'Участник удалён из организации',
    });
  } catch (error) {
    next(error);
  }
}

// Изменить роль участника (только админ)
export async function changeMemberRole(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { memberId } = req.params;
    const { role } = req.body;
    const organizationId = req.user?.organizationId;
    const currentUserId = req.user!.id;

    if (!organizationId) {
      throw new ValidationError('Вы не состоите в организации');
    }

    if (role !== 'admin' && role !== 'member') {
      throw new ValidationError('Недопустимая роль');
    }

    if (memberId === currentUserId) {
      throw new ValidationError('Вы не можете изменить свою роль');
    }

    const member = await prisma.user.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundError('Участник не найден в вашей организации');
    }

    await prisma.user.update({
      where: { id: memberId },
      data: { role },
    });

    res.json({
      success: true,
      message: `Роль пользователя изменена на ${role === 'admin' ? 'администратор' : 'участник'}`,
    });
  } catch (error) {
    next(error);
  }
}

// Проверить инвайт-код (без авторизации, для предпросмотра)
export async function checkInviteCode(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code } = req.params;

    const invite = await prisma.organizationInvite.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        organization: {
          select: { 
            id: true, 
            name: true, 
            slug: true,
            _count: {
              select: { users: true },
            },
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundError('Инвайт-код не найден');
    }

    if (invite.usedAt) {
      throw new ValidationError('Этот инвайт-код уже использован');
    }

    if (invite.expiresAt < new Date()) {
      throw new ValidationError('Срок действия инвайт-кода истёк');
    }

    res.json({
      success: true,
      data: {
        organization: invite.organization,
        role: invite.role,
        expiresAt: invite.expiresAt,
        forEmail: invite.email || null,
      },
    });
  } catch (error) {
    next(error);
  }
}
