import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { Loader2, RefreshCw, LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const ProfilePage = () => {
	const { user, logout } = useAuthStore();

	const syncMutation = useMutation({
		mutationFn: async () => {
			const { data } = await api.post('/calendar/sync-all');
			return data;
		},
		onSuccess: (data) => {
			toast.success(data.message || 'Синхронизация завершена');
		},
		onError: () => toast.error('Ошибка синхронизации'),
	});

	const handleGoogleConnect = () => {
		window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
	};

	const handleLogout = () => {
		logout();
		window.location.href = '/login';
	};

	return (
		<div className='space-y-6 mx-auto max-w-2xl'>
			<h1 className='font-bold text-2xl'>Личный кабинет</h1>

			<Card>
				<CardHeader className='flex flex-row items-center gap-4'>
					<Avatar className='w-16 h-16'>
						<AvatarImage src={user?.avatarUrl || ''} />
						<AvatarFallback className='text-lg'>{user?.name?.[0]}</AvatarFallback>
					</Avatar>
					<div>
						<CardTitle>{user?.name}</CardTitle>
						<CardDescription>{user?.email}</CardDescription>
						<div className='mt-2'>
							<Badge variant='secondary' className='capitalize'>
								{user?.role}
							</Badge>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						<div className='flex justify-between items-center py-2'>
							<div>
								<p className='font-medium'>Организация</p>
								<p className='text-muted-foreground text-sm'>{user?.organization?.name}</p>
							</div>
						</div>

						<Separator />

						<div className='flex justify-between items-center py-2'>
							<div>
								<p className='font-medium'>Google Calendar</p>
								<p className='text-muted-foreground text-sm'>
									{user?.hasGoogleCalendar
										? 'Аккаунт подключен. Бронирования синхронизируются.'
										: 'Подключите календарь для автоматической синхронизации событий.'}
								</p>
							</div>
							<div>
								{user?.hasGoogleCalendar ? (
									<Button
										variant='outline'
										size='sm'
										onClick={() => syncMutation.mutate()}
										disabled={syncMutation.isPending}
									>
										{syncMutation.isPending ? (
											<Loader2 className='w-4 h-4 animate-spin' />
										) : (
											<RefreshCw className='w-4 h-4' />
										)}
										<span className='hidden sm:inline ml-2'>Синхронизировать</span>
									</Button>
								) : (
									<Button variant='outline' size='sm' onClick={handleGoogleConnect}>
										Подключить
									</Button>
								)}
							</div>
						</div>

						<Separator />

						<div className='pt-2'>
							<Button
								// variant="destructive"
								variant='ghost'
								className='justify-start hover:bg-red-50 px-0 w-full text-red-600 hover:text-red-700'
								onClick={handleLogout}
							>
								<LogOut className='mr-2 w-4 h-4' />
								Выйти из системы
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

