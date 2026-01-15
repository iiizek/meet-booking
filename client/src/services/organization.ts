import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import type {
	CreateOrganizationDTO,
	CreateOrganizationResponse,
	JoinOrganizationDTO,
	JoinOrganizationResponse,
	InviteCheckResponse,
} from '@/types/organization';
import type { UserMeResponse } from '@/types/auth';

const createOrganization = async (data: CreateOrganizationDTO) => {
	const response = await api.post<CreateOrganizationResponse>('/organizations', data);
	if (!response.data.success) throw new Error(response.data.error);
	return response.data;
};

const joinOrganization = async (data: JoinOrganizationDTO) => {
	const response = await api.post<JoinOrganizationResponse>('/organizations/join', data);
	if (!response.data.success) throw new Error(response.data.error);
	return response.data;
};

const checkInvite = async (code: string) => {
	const response = await api.get<InviteCheckResponse>(`/organizations/invites/check/${code}`);
	if (!response.data.success) throw new Error(response.data.error);
	return response.data;
};

export const useCreateOrganization = () => {
	const setUser = useAuthStore((state) => state.setUser);
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createOrganization,
		onSuccess: ({ data }) => {
			// Обновляем юзера (у него теперь есть organizationId и role: admin)
			setUser(data.user);
			queryClient.setQueryData<UserMeResponse>(['auth', 'me'], {
				success: true,
				data: data.user,
			});
			toast.success('Организация успешно создана');
			navigate('/');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Не удалось создать организацию');
		},
	});
};

export const useJoinOrganization = () => {
	const setUser = useAuthStore((state) => state.setUser);
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: joinOrganization,
		onSuccess: ({ data }) => {
			// Обновляем юзера (у него теперь есть organizationId)
			setUser(data);
			queryClient.setQueryData<UserMeResponse>(['auth', 'me'], {
				success: true,
				data,
			});
			toast.success('Вы успешно присоединились к организации');
			navigate('/');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Не удалось присоединиться');
		},
	});
};

// Хук для ручной проверки инвайта (не автоматический query, а по клику/вводу)
export const useCheckInvite = () => {
	return useMutation({
		mutationFn: checkInvite,
		onError: (error: Error) => {
			toast.error(error.message || 'Инвайт-код недействителен');
		},
	});
};

