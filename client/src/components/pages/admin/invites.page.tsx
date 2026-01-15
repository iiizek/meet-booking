import { useState } from 'react';
import { useInvites, useCreateInvite, useRevokeInvite } from '@/services/admin';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Copy, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserRole } from '@/types/auth';

export const InvitesPage = () => {
	const { data: invites, isLoading } = useInvites();
	const createMutation = useCreateInvite();
	const revokeMutation = useRevokeInvite();

	// Локальный стейт формы
	const [role, setRole] = useState<UserRole>('member');
	const [email, setEmail] = useState('');

	const handleCreate = () => {
		createMutation.mutate(
			{
				role,
				email: email || undefined,
			},
			{
				onSuccess: () => setEmail(''), // сброс email
			}
		);
	};

	const copyToClipboard = (code: string) => {
		navigator.clipboard.writeText(code);
		toast.success('Код скопирован');
	};

	if (isLoading)
		return (
			<div className='flex justify-center p-8'>
				<Loader2 className='animate-spin' />
			</div>
		);

	return (
		<div className='space-y-6'>
			<div>
				<h1 className='font-bold text-2xl'>Приглашения</h1>
				<p className='text-muted-foreground'>Коды доступа для новых сотрудников</p>
			</div>

			<div className='gap-6 grid md:grid-cols-[1fr_300px]'>
				{/* Список инвайтов */}
				<div className='bg-white border rounded-md'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Код</TableHead>
								<TableHead>Роль</TableHead>
								<TableHead>Ограничение Email</TableHead>
								<TableHead>Истекает</TableHead>
								<TableHead className='text-right'>Действия</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{invites?.length === 0 && (
								<TableRow>
									<TableCell colSpan={5} className='h-24 text-muted-foreground text-center'>
										Нет активных приглашений
									</TableCell>
								</TableRow>
							)}
							{invites?.map((invite) => (
								<TableRow key={invite.id}>
									<TableCell className='font-mono font-bold tracking-wider'>{invite.code}</TableCell>
									<TableCell>
										{invite.role === 'admin' ? (
											<Badge variant='outline'>Админ</Badge>
										) : (
											<Badge variant='secondary'>Участник</Badge>
										)}
									</TableCell>
									<TableCell>{invite.email || <span className='text-muted-foreground text-xs'>Все</span>}</TableCell>
									<TableCell className='text-muted-foreground text-sm'>
										{format(new Date(invite.expiresAt), 'd MMM yyyy', { locale: ru })}
									</TableCell>
									<TableCell className='space-x-2 text-right'>
										<Button variant='ghost' size='icon' onClick={() => copyToClipboard(invite.code)}>
											<Copy className='w-4 h-4' />
										</Button>
										<Button
											variant='ghost'
											size='icon'
											className='text-red-500 hover:text-red-600'
											onClick={() => revokeMutation.mutate(invite.id)}
										>
											<Trash2 className='w-4 h-4' />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{/* Форма создания */}
				<Card>
					<CardHeader>
						<CardTitle>Создать код</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='space-y-2'>
							<label className='font-medium text-sm'>Роль</label>
							<Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='member'>Участник</SelectItem>
									<SelectItem value='admin'>Администратор</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<label className='font-medium text-sm'>Email (опционально)</label>
							<Input placeholder='user@company.com' value={email} onChange={(e) => setEmail(e.target.value)} />
							<p className='text-muted-foreground text-xs'>Если указать, код сработает только для этого адреса.</p>
						</div>

						<Button className='w-full' onClick={handleCreate} disabled={createMutation.isPending}>
							{createMutation.isPending ? (
								<Loader2 className='mr-2 w-4 h-4 animate-spin' />
							) : (
								<Plus className='mr-2 w-4 h-4' />
							)}
							Сгенерировать
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

