import { type Response } from './api';

export interface Amenity {
	code: string;
	name: string;
	icon: string;
}

export interface Room {
	id: string;
	organizationId: string;
	name: string;
	description: string | null;
	capacity: number;
	floor: number;
	amenities: string[]; // Массив кодов, например ['tv', 'wifi']
	imageUrl: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateRoomDTO {
	name: string;
	description?: string;
	capacity: number;
	floor?: number;
	amenities?: string[];
	imageUrl?: string;
}

export interface UpdateRoomDTO extends Partial<CreateRoomDTO> {
	isActive?: boolean;
}

export interface RoomFilters {
	minCapacity?: number;
	maxCapacity?: number;
	floor?: number;
	amenities?: string[];
	isActive?: boolean;
}

export type RoomResponse = Response<Room>;
export type RoomsListResponse = Response<Room[]>;
