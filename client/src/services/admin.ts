import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { UsersListResponse, InvitesListResponse, CreateInviteDTO, InviteResponse } from '@/types/admin';
import type { Response } from '@/types/api';
import { toast } from 'sonner';

const getUsers = async () => {
	const { data } = await api.get<UsersListResponse>('/auth/users');
	if (!data.success) throw new Error(data.error);
	return data.data;
};

const changeUserRole = async ({ userId, role }: { userId: string; role: 'admin' | 'member' }) => {
	const { data } = await api.patch<Response<void>>(`/organizations/members/${userId}/role`, { role });
	if (!data.success) throw new Error(data.error);
	return data;
};

const removeUser = async (userId: string) => {
	const { data } = await api.delete<Response<void>>(`/organizations/members/${userId}`);
	if (!data.success) throw new Error(data.error);
	return data;
};

const getInvites = async () => {
	const { data } = await api.get<InvitesListResponse>('/organizations/invites');
	if (!data.success) throw new Error(data.error);
	return data.data;
};

const createInvite = async (dto: CreateInviteDTO) => {
	const { data } = await api.post<InviteResponse>('/organizations/invites', dto);
	if (!data.success) throw new Error(data.error);
	return data.data;
};

const revokeInvite = async (inviteId: string) => {
	const { data } = await api.delete<Response<void>>(`/organizations/invites/${inviteId}`);
	if (!data.success) throw new Error(data.error);
	return data;
};

export const useOrganizationUsers = () => {
	return useQuery({
		queryKey: ['admin', 'users'],
		queryFn: getUsers,
	});
};

export const useChangeUserRole = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: changeUserRole,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
			toast.success('Роль пользователя обновлена');
		},
		onError: (e) => toast.error(e.message),
	});
};

export const useRemoveUser = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: removeUser,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
			toast.success('Пользователь удален из организации');
		},
		onError: (e) => toast.error(e.message),
	});
};

export const useInvites = () => {
	return useQuery({
		queryKey: ['admin', 'invites'],
		queryFn: getInvites,
	});
};

export const useCreateInvite = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createInvite,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] });
			toast.success('Инвайт создан');
		},
		onError: (e) => toast.error(e.message),
	});
};

export const useRevokeInvite = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: revokeInvite,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] });
			toast.success('Инвайт отозван');
		},
		onError: (e) => toast.error(e.message),
	});
};

