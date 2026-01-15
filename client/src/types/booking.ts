import { type Response } from './api';
import { type Room } from './room';
import { type User } from './auth';

export type BookingStatus = 'confirmed' | 'cancelled' | 'pending';

// Участник бронирования (вложенная сущность)
export interface BookingParticipant {
	id: string;
	user: User;
}

export interface Booking {
	id: string;
	title: string;
	description: string | null;
	startTime: string; // ISO Date
	endTime: string; // ISO Date
	status: BookingStatus;
	roomId: string;
	userId: string;
	googleEventId: string | null;
	googleCalendarSynced: boolean;

	room?: Room;
	user?: User; // Создатель
	participants?: BookingParticipant[];
}

export interface CreateBookingDTO {
	roomId: string;
	title: string;
	description?: string;
	startTime: string; // ISO
	endTime: string; // ISO
	participantIds?: string[];
}

export interface BookingFilters {
	startDate: string;
	endDate: string;
	roomId?: string;
}

export type BookingResponse = Response<Booking>;
export type BookingsListResponse = Response<Booking[]>;
