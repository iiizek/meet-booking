import { Link, Outlet, useLocation } from 'react-router';
import { LayoutDashboard, Ticket, DoorOpen, LogOut, CalendarDays, Users } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/tw-utils';

export const DashboardLayout = () => {
	const { user, logout } = useAuthStore();
	const location = useLocation();

	const handleLogout = () => {
		logout();
		window.location.href = '/login';
	};

	const navItems = [
		{ href: '/', label: 'Календарь', icon: CalendarDays },
		{ href: '/rooms', label: 'Комнаты', icon: DoorOpen },
		...(user?.role === 'admin'
			? [
					{ href: '/users', label: 'Сотрудники', icon: Users },
					{ href: '/invites', label: 'Приглашения', icon: Ticket },
			  ]
			: []),
	];

	return (
		<div className='flex bg-gray-50 min-h-screen'>
			{/* SIDEBAR */}
			<aside className='hidden z-10 fixed md:flex flex-col bg-white border-r w-64 h-full'>
				<div className='flex items-center px-6 border-b h-16'>
					<Link to='/' className='flex items-center gap-2 font-bold text-primary text-xl'>
						<LayoutDashboard className='w-6 h-6' />
						<span>Meet Booking</span>
					</Link>
				</div>

				<div className='flex-1 space-y-1 px-4 py-6'>
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = location.pathname === item.href;
						return (
							<Link
								key={item.href}
								to={item.href}
								className={cn(
									'flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors',
									isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'
								)}
							>
								<Icon className='w-5 h-5' />
								{item.label}
							</Link>
						);
					})}
				</div>

				<div className='p-4 border-t'>
					<div className='flex items-center gap-3 mb-4 px-2'>
						<div className='flex justify-center items-center bg-primary/20 rounded-full w-8 h-8 font-bold text-primary text-xs'>
							{user?.organization?.name?.[0].toUpperCase()}
						</div>
						<div className='overflow-hidden'>
							<p className='font-medium text-sm truncate'>{user?.organization?.name}</p>
							<p className='text-muted-foreground text-xs truncate capitalize'>{user?.role}</p>
						</div>
					</div>
				</div>
			</aside>

			{/* MAIN CONTENT */}
			<main className='flex flex-col flex-1 md:ml-64 min-h-screen'>
				{/* HEADER (Mobile & User Menu) */}
				<header className='top-0 z-10 sticky flex justify-between items-center bg-white px-4 sm:px-8 border-b h-16'>
					<div className='md:hidden'>
						{/* Тут мог бы быть MobileSheetTrigger */}
						<span className='font-bold'>Booking</span>
					</div>

					<div className='flex items-center gap-4 ml-auto'>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' className='relative rounded-full w-8 h-8'>
									<Avatar className='w-8 h-8'>
										<AvatarImage src={user?.avatarUrl || ''} alt={user?.name} />
										<AvatarFallback>{user?.name?.[0]}</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className='w-56' align='end' forceMount>
								<DropdownMenuLabel className='font-normal'>
									<div className='flex flex-col space-y-1'>
										<p className='font-medium text-sm leading-none'>{user?.name}</p>
										<p className='text-muted-foreground text-xs leading-none'>{user?.email}</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link to='/profile'>Профиль</Link>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleLogout} className='text-red-600 focus:text-red-600'>
									<LogOut className='mr-2 w-4 h-4' />
									Выйти
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				{/* PAGE CONTENT */}
				<div className='mx-auto p-4 sm:p-8 w-full max-w-7xl'>
					<Outlet />
				</div>
			</main>
		</div>
	);
};

