import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useRegister } from '@/services/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
	name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
	email: z.string().email('Некорректный email'),
	password: z.string().min(6, 'Минимум 6 символов'),
});

export const RegisterPage = () => {
	const { mutate: register, isPending } = useRegister();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: { name: '', email: '', password: '' },
	});

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		register(values, {
			onError: (error) => {
				toast.error('Ошибка регистрации', {
					description: error.message,
				});
			},
		});
	};

	const handleGoogleLogin = () => {
		window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
	};

	return (
		<div className='flex justify-center items-center bg-gray-50 px-4 min-h-screen'>
			<Card className='w-full max-w-md'>
				<CardHeader className='space-y-1'>
					<CardTitle className='font-bold text-2xl'>Регистрация</CardTitle>
					<CardDescription>Создайте аккаунт для начала работы</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
							<FormField
								control={form.control}
								name='name'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Имя и Фамилия</FormLabel>
										<FormControl>
											<Input placeholder='Иван Иванов' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
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
								Создать аккаунт
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
						Войти через Google
					</Button>
				</CardContent>
				<CardFooter className='justify-center'>
					<p className='text-muted-foreground text-sm'>
						Уже есть аккаунт?{' '}
						<Link to='/login' className='text-primary hover:underline'>
							Войти
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
};

