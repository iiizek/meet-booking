import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useUser } from '@/services/auth';
import { useAuthStore } from '@/store/auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
	children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { setUser, setLoading } = useAuthStore();

	// Запрос пользователя
	const { data: user, isLoading, isError } = useUser();

	useEffect(() => {
		if (user) {
			setUser(user);
		} else if (isError) {
			setUser(null);
		}
		setLoading(isLoading);
	}, [user, isError, isLoading, setUser, setLoading]);

	// Логика редиректов
	useEffect(() => {
		if (isLoading) return;

		if (!user) {
			navigate('/login', { replace: true });
		} else {
			// Если залогинен, проверяем needsOrganization
			const isOrgSetupPage = location.pathname.startsWith('/organization');

			if (user.needsOrganization && !isOrgSetupPage) {
				navigate('/organization/setup', { replace: true });
			}

			// Если юзер уже в организации, но пытается зайти на setup
			if (!user.needsOrganization && isOrgSetupPage && location.pathname !== '/organization/join') {
				navigate('/');
			}
		}
	}, [user, isLoading, navigate, location.pathname]);

	if (isLoading) {
		return (
			<div className='flex justify-center items-center h-screen'>
				<Loader2 className='w-8 h-8 text-primary animate-spin' />
			</div>
		);
	}

	if (!user) return null;

	return <>{children}</>;
};

