import type { Response } from './api';

export type UserRole = 'admin' | 'member';

export interface Organization {
	id: string;
	name: string;
	slug: string;
}

export interface User {
	id: string;
	email: string;
	name: string;
	avatarUrl: string | null;
	role: UserRole;
	organizationId: string | null;
	organization: Organization | null;
	isActive: boolean;
	needsOrganization?: boolean; // Флаг из ТЗ
	hasGoogleCalendar?: boolean; // Флаг из ТЗ
}

export interface AuthResponseData {
	user: User;
	token: string;
}

export type AuthResponse = Response<AuthResponseData>;
export type UserMeResponse = Response<User>;

export interface AuthCredentials {
	email: string;
	password: string;
}

export interface RegisterCredentials extends AuthCredentials {
	name: string;
}

