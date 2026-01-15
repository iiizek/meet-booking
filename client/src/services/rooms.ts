import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateRoomDTO, RoomResponse, RoomsListResponse, RoomFilters, UpdateRoomDTO } from '@/types/room';
import { toast } from 'sonner';
import type { Response } from '@/types/api';

const getRooms = async (filters?: RoomFilters) => {
	const params = new URLSearchParams();
	if (filters?.minCapacity) params.append('minCapacity', String(filters.minCapacity));
	if (filters?.amenities?.length) params.append('amenities', filters.amenities.join(','));

	const { data } = await api.get<RoomsListResponse>('/rooms', { params });
	if (!data.success) throw new Error(data.error);
	return data.data;
};

const getRoom = async (id: string) => {
	const { data } = await api.get<RoomResponse>(`/rooms/${id}`);
	if (!data.success) throw new Error(data.error);
	return data.data;
};

const createRoom = async (roomData: CreateRoomDTO) => {
	const { data } = await api.post<RoomResponse>('/rooms', roomData);
	if (!data.success) throw new Error(data.error);
	return data.data;
};

const updateRoom = async ({ id, data }: { id: string; data: UpdateRoomDTO }) => {
	const { data: res } = await api.patch<RoomResponse>(`/rooms/${id}`, data);
	if (!res.success) throw new Error(res.error);
	return res.data;
};

const deleteRoom = async (id: string) => {
	const { data } = await api.delete<Response<void>>(`/rooms/${id}`);
	if (!data.success) throw new Error(data.error);
};

const uploadRoomImage = async ({ id, file }: { id: string; file: File }) => {
	const formData = new FormData();
	formData.append('image', file);

	const { data } = await api.post<Response<{ imageUrl: string }>>(`/rooms/${id}/image`, formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
	if (!data.success) throw new Error(data.error);
	return data.data;
};

export const useRooms = (filters?: RoomFilters) => {
	return useQuery({
		queryKey: ['rooms', filters],
		queryFn: () => getRooms(filters),
	});
};

export const useRoom = (id: string) => {
	return useQuery({
		queryKey: ['rooms', id],
		queryFn: () => getRoom(id),
		enabled: !!id,
	});
};

export const useCreateRoom = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createRoom,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
			toast.success('Комната создана');
		},
		onError: (e) => toast.error(e.message),
	});
};

export const useUpdateRoom = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: updateRoom,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
			queryClient.invalidateQueries({ queryKey: ['rooms', data.id] });
			toast.success('Комната обновлена');
		},
		onError: (e) => toast.error(e.message),
	});
};

export const useDeleteRoom = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteRoom,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
			toast.success('Комната удалена');
		},
		onError: (e) => toast.error(e.message),
	});
};

export const useUploadRoomImage = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: uploadRoomImage,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['rooms', variables.id] });
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
		},
	});
};

