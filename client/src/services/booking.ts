import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BookingFilters, BookingsListResponse, CreateBookingDTO, BookingResponse } from '@/types/booking';
import { toast } from 'sonner';

const getBookings = async (filters: BookingFilters) => {
	const params = new URLSearchParams({
		startDate: filters.startDate,
		endDate: filters.endDate,
	});
	if (filters.roomId) params.append('roomId', filters.roomId);

	const { data } = await api.get<BookingsListResponse>('/bookings', { params });
	if (!data.success) throw new Error(data.error);
	return data.data;
};

const createBooking = async (dto: CreateBookingDTO) => {
	const { data } = await api.post<BookingResponse>('/bookings', dto);
	if (!data.success) throw new Error(data.error);
	return data.data;
};

const cancelBooking = async (id: string) => {
	const { data } = await api.post<BookingResponse>(`/bookings/${id}/cancel`);
	if (!data.success) throw new Error(data.error);
	return data.data;
};

export const useBookings = (filters: BookingFilters) => {
	return useQuery({
		queryKey: ['bookings', filters.startDate, filters.endDate, filters.roomId],
		queryFn: () => getBookings(filters),
		// TODO: календарь часто дергает данные, можно поставить keepPreviousData (в v5 это placeholderData)
		// но пока оставим стандартное поведение
	});
};

export const useCreateBooking = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createBooking,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['bookings'] });
			queryClient.invalidateQueries({ queryKey: ['rooms'] });
			toast.success('Бронирование создано');
		},
		onError: (e) => toast.error(e.message),
	});
};

export const useCancelBooking = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: cancelBooking,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['bookings'] });
			toast.success('Бронирование отменено');
		},
		onError: (e) => toast.error(e.message),
	});
};

