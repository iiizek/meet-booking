import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export const AuthCallbackPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	useEffect(() => {
		const token = searchParams.get('token');
		const error = searchParams.get('error');

		if (error) {
			navigate('/login?error=auth_failed');
			return;
		}

		if (token) {
			localStorage.setItem('token', token);
			// Инвалидируем запрос 'auth', чтобы useUser в AuthGuard подтянул свежие данные
			queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }).then(() => {
				// Редиректим в корень, а AuthGuard сам разрулит, куда дальше (в setup или dashboard)
				navigate('/');
			});
		} else {
			navigate('/login');
		}
	}, [searchParams, navigate, queryClient]);

	return (
		<div className='flex justify-center items-center h-screen'>
			<div className='text-center'>
				<Loader2 className='mx-auto mb-4 w-8 h-8 text-primary animate-spin' />
				<p className='text-muted-foreground'>Авторизация...</p>
			</div>
		</div>
	);
};

