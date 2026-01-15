import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useLogin } from '@/services/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
	email: z.string().email('Некорректный email'),
	password: z.string().min(1, 'Введите пароль'),
});

export const LoginPage = () => {
	const { mutate: login, isPending } = useLogin();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: { email: '', password: '' },
	});

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		login(values, {
			onError: (error) => {
				toast.error('Ошибка входа', {
					description: error.message,
				});
			},
		});
	};

	const handleGoogleLogin = () => {
		// Редирект на эндпоинт бэкенда
		window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
	};

	return (
		<div className='flex justify-center items-center bg-gray-50 px-4 min-h-screen'>
			<Card className='w-full max-w-md'>
				<CardHeader className='space-y-1'>
					<CardTitle className='font-bold text-2xl'>Вход в систему</CardTitle>
					<CardDescription>Введите email и пароль для входа</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
							<FormField
								control={form.control}
								name='email'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input placeholder='name@example.com' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='password'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Пароль</FormLabel>
										<FormControl>
											<Input type='password' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type='submit' className='w-full' disabled={isPending}>
								{isPending && <Loader2 className='mr-2 w-4 h-4 animate-spin' />}
								Войти
							</Button>
						</form>
					</Form>

					<div className='relative my-4'>
						<div className='absolute inset-0 flex items-center'>
							<Separator />
						</div>
						<div className='relative flex justify-center text-xs uppercase'>
							<span className='bg-background px-2 text-muted-foreground'>Или</span>
						</div>
					</div>

					<Button variant='outline' className='w-full' onClick={handleGoogleLogin}>
						<svg
							className='mr-2 w-4 h-4'
							aria-hidden='true'
							focusable='false'
							data-prefix='fab'
							data-icon='google'
							role='img'
							xmlns='http://www.w3.org/2000/svg'
							viewBox='0 0 488 512'
						>
							<path
								fill='currentColor'
								d='M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z'
							></path>
						</svg>
						Войти через Google
					</Button>
				</CardContent>
				<CardFooter className='justify-center'>
					<p className='text-muted-foreground text-sm'>
						Нет аккаунта?{' '}
						<Link to='/register' className='text-primary hover:underline'>
							Регистрация
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
};

