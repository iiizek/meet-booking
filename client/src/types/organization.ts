import { type Response } from './api';
import { type User, type UserRole } from './auth';

// Базовая структура организации
export interface Organization {
	id: string;
	name: string;
	slug: string;
	description?: string;
	_count?: {
		users: number;
		rooms: number;
	};
}

// DTO для создания
export interface CreateOrganizationDTO {
	name: string;
	description?: string;
}

// DTO для входа
export interface JoinOrganizationDTO {
	code: string;
}

// Ответ при проверке инвайта
export interface InviteCheckResult {
	organization: Organization;
	role: UserRole;
	expiresAt: string;
	forEmail: string | null;
}

// Ответы API
export type CreateOrganizationResponse = Response<{
	organization: Organization;
	user: User; // Обновленный юзер
}>;

export type JoinOrganizationResponse = Response<User>; // Возвращает обновленного юзера

export type InviteCheckResponse = Response<InviteCheckResult>;

