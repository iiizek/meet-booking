import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	validateStatus: (status) => {
		if (status >= 500) return false;
		return true;
	},
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Обработка истечения сессии
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem('token');
			// Если мы не на странице логина, редиректим
			if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
				window.location.href = '/login';
			}
		}
		return Promise.reject(error);
	}
);

