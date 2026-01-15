import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type AuthCredentials, type AuthResponse, type RegisterCredentials, type UserMeResponse } from '@/types/auth';
import { useAuthStore } from '@/store/auth';
import { useNavigate } from 'react-router';

const getUser = async () => {
	const { data } = await api.get<UserMeResponse>('/auth/me');

	if (!data.success) {
		throw new Error(data.error);
	}

	return data;
};

const login = async (credentials: AuthCredentials) => {
	const { data } = await api.post<AuthResponse>('/auth/login', credentials);

	if (!data.success) {
		throw new Error(data.error);
	}

	return data;
};

const register = async (credentials: RegisterCredentials) => {
	const { data } = await api.post<AuthResponse>('/auth/register', credentials);

	if (!data.success) {
		throw new Error(data.error);
	}

	return data;
};

// Хук инициализации (проверка сессии при старте)
export const useUser = () =>
	useQuery({
		queryKey: ['auth', 'me'],
		queryFn: getUser,
		select: (response) => response.data,
		retry: false,
		staleTime: Infinity,
	});

// Хук логина
export const useLogin = () => {
	const setUser = useAuthStore((state) => state.setUser);
	const navigate = useNavigate();

	return useMutation({
		mutationFn: login,
		onSuccess: ({ data }) => {
			localStorage.setItem('token', data.token);
			setUser(data.user);

			// Логика редиректа согласно ТЗ
			if (data.user.needsOrganization) {
				navigate('/organization/setup');
			} else {
				navigate('/');
			}
		},
	});
};

// Хук регистрации
export const useRegister = () => {
	const setUser = useAuthStore((state) => state.setUser);
	const navigate = useNavigate();

	return useMutation({
		mutationFn: register,
		onSuccess: ({ data }) => {
			localStorage.setItem('token', data.token);
			setUser(data.user);
			// Новые юзеры всегда без организации
			navigate('/organization/setup');
		},
	});
};

