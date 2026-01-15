import { useAuthStore } from '@/store/auth';
import { useOrganizationUsers, useRemoveUser, useChangeUserRole } from '@/services/admin';
import { Loader2, MoreVertical, Shield, Trash2, User as UserIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export const UsersPage = () => {
	const { user: currentUser } = useAuthStore();
	const { data: users, isLoading } = useOrganizationUsers();

	const removeMutation = useRemoveUser();
	const changeRoleMutation = useChangeUserRole();

	if (isLoading)
		return (
			<div className='flex justify-center p-8'>
				<Loader2 className='animate-spin' />
			</div>
		);

	return (
		<div className='space-y-6'>
			<div>
				<h1 className='font-bold text-2xl'>Сотрудники</h1>
				<p className='text-muted-foreground'>Управление доступом к организации</p>
			</div>

			<div className='bg-white border rounded-md'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='w-20'>Аватар</TableHead>
							<TableHead>Имя</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Роль</TableHead>
							<TableHead className='text-right'>Действия</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users?.map((u) => (
							<TableRow key={u.id}>
								<TableCell>
									<Avatar>
										<AvatarImage src={u.avatarUrl || ''} />
										<AvatarFallback>{u.name[0]}</AvatarFallback>
									</Avatar>
								</TableCell>
								<TableCell className='font-medium'>{u.name}</TableCell>
								<TableCell>{u.email}</TableCell>
								<TableCell>
									{u.role === 'admin' ? (
										<Badge className='bg-purple-100 hover:bg-purple-200 text-purple-800'>Админ</Badge>
									) : (
										<Badge variant='secondary'>Участник</Badge>
									)}
								</TableCell>
								<TableCell className='text-right'>
									{currentUser?.id !== u.id && (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant='ghost' size='icon'>
													<MoreVertical className='w-4 h-4' />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end'>
												<DropdownMenuLabel>Управление</DropdownMenuLabel>
												{u.role === 'member' ? (
													<DropdownMenuItem onClick={() => changeRoleMutation.mutate({ userId: u.id, role: 'admin' })}>
														<Shield className='mr-2 w-4 h-4' /> Сделать админом
													</DropdownMenuItem>
												) : (
													<DropdownMenuItem onClick={() => changeRoleMutation.mutate({ userId: u.id, role: 'member' })}>
														<UserIcon className='mr-2 w-4 h-4' /> Разжаловать
													</DropdownMenuItem>
												)}
												<DropdownMenuItem
													className='text-red-600 focus:text-red-600'
													onClick={() => {
														if (confirm('Удалить сотрудника? Все его будущие бронирования будут отменены.')) {
															removeMutation.mutate(u.id);
														}
													}}
												>
													<Trash2 className='mr-2 w-4 h-4' /> Удалить из орг.
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
};
