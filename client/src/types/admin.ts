import { type User, type UserRole } from './auth';
import { type Response } from './api';

export interface Invite {
	id: string;
	code: string;
	email: string | null;
	role: UserRole;
	expiresAt: string;
	createdAt: string;
	createdBy: {
		id: string;
		name: string;
	};
}

export interface CreateInviteDTO {
	email?: string;
	role?: UserRole;
	expiresInDays?: number;
}

export type UsersListResponse = Response<User[]>;
export type InvitesListResponse = Response<Invite[]>;
export type InviteResponse = Response<Invite>;

