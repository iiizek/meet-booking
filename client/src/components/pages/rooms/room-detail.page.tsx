import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowLeft, Edit, Users, Layers, CalendarDays } from 'lucide-react';
import { type View, Views } from 'react-big-calendar';

import { useAuthStore } from '@/store/auth';
import { useRoom } from '@/services/rooms';
import { useBookings } from '@/services/booking';
import { getAmenityIcon, getAmenityLabel } from '@/lib/amenities';
import { type Booking } from '@/types/booking';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/widgets/calendar';
import { BookingDialog } from '@/components/widgets/booking-dialog';
import { BookingDetailsDialog } from '@/components/widgets/booking-details-dialog';

export const RoomDetailsPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user } = useAuthStore();

	// Состояние календаря
	const [date, setDate] = useState(new Date());
	const [view, setView] = useState<View>(Views.WEEK);

	// Модальные окна
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date; resourceId?: string } | null>(null);

	const [detailsModalOpen, setDetailsModalOpen] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);

	// 1. Получаем данные комнаты
	const { data: room, isLoading: isRoomLoading } = useRoom(id!);

	// 2. Получаем бронирования ТОЛЬКО для этой комнаты
	// Вычисляем диапазон для календаря
	const startDate = startOfWeek(startOfMonth(date)).toISOString();
	const endDate = endOfWeek(endOfMonth(date)).toISOString();

	const { data: bookings = [] } = useBookings({
		startDate,
		endDate,
		roomId: id,
	});

	// Обработчики календаря
	const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
		// При клике на слот мы точно знаем, что это текущая комната
		setSelectedSlot({ ...slotInfo, resourceId: id });
		setCreateModalOpen(true);
	};

	const handleSelectEvent = (event: Booking) => {
		setSelectedEvent(event);
		setDetailsModalOpen(true);
	};

	if (isRoomLoading) {
		return (
			<div className='space-y-6'>
				<Skeleton className='w-32 h-8' />
				<Skeleton className='rounded-xl w-full h-64' />
				<div className='gap-8 grid md:grid-cols-2'>
					<Skeleton className='w-full h-48' />
					<Skeleton className='w-full h-48' />
				</div>
			</div>
		);
	}

	if (!room) return <div>Комната не найдена</div>;

	// Формируем полный URL картинки
	const imageUrl = room.imageUrl
		? room.imageUrl.startsWith('http')
			? room.imageUrl
			: `${import.meta.env.VITE_API_URL.replace('/api', '')}${room.imageUrl}`
		: null;

	return (
		<div className='space-y-6 animate-in duration-500 fade-in'>
			{/* Навигация и заголовок */}
			<div className='flex justify-between items-center'>
				<Button
					variant='ghost'
					className='gap-2 hover:bg-transparent px-0 hover:text-primary'
					onClick={() => navigate('/rooms')}
				>
					<ArrowLeft className='w-4 h-4' />К списку комнат
				</Button>

				{user?.role === 'admin' && (
					<Button variant='outline' asChild>
						<Link to={`/rooms/${id}/edit`}>
							<Edit className='mr-2 w-4 h-4' />
							Редактировать
						</Link>
					</Button>
				)}
			</div>

			{/* Hero секция с информацией */}
			<div className='gap-6 grid md:grid-cols-[1fr_350px]'>
				{/* Левая колонка: Картинка и описание */}
				<div className='space-y-6'>
					<div className='relative bg-gray-100 border rounded-xl w-full h-75 overflow-hidden'>
						{imageUrl ? (
							<img src={imageUrl} alt={room.name} className='w-full h-full object-cover' />
						) : (
							<div className='flex flex-col justify-center items-center h-full text-muted-foreground'>
								<Layers className='opacity-20 mb-2 w-16 h-16' />
								<span>Нет изображения</span>
							</div>
						)}
						<div className='bottom-4 left-4 absolute flex gap-2'>
							{!room.isActive && <Badge variant='destructive'>Недоступна для бронирования</Badge>}
						</div>
					</div>

					<div>
						<h1 className='mb-2 font-bold text-3xl'>{room.name}</h1>
						<p className='text-muted-foreground text-lg leading-relaxed'>
							{room.description || 'Описание отсутствует.'}
						</p>
					</div>

					<Separator />

					<div>
						<h3 className='mb-4 font-semibold text-lg'>Удобства и оборудование</h3>
						<div className='flex flex-wrap gap-3'>
							{room.amenities.map((code) => {
								const Icon = getAmenityIcon(code);
								return (
									<div
										key={code}
										className='flex items-center gap-2 bg-secondary/50 px-3 py-2 border border-secondary rounded-md'
									>
										<Icon className='w-4 h-4 text-primary' />
										<span className='font-medium text-sm'>{getAmenityLabel(code)}</span>
									</div>
								);
							})}
							{room.amenities.length === 0 && (
								<span className='text-muted-foreground text-sm'>Нет данных об оборудовании</span>
							)}
						</div>
					</div>
				</div>

				{/* Правая колонка: Краткие характеристики */}
				<div className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>Характеристики</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='flex justify-between items-center'>
								<div className='flex items-center gap-2 text-muted-foreground'>
									<Users className='w-5 h-5' />
									<span>Вместимость</span>
								</div>
								<span className='font-semibold text-lg'>{room.capacity} чел.</span>
							</div>
							<Separator />
							<div className='flex justify-between items-center'>
								<div className='flex items-center gap-2 text-muted-foreground'>
									<Layers className='w-5 h-5' />
									<span>Этаж</span>
								</div>
								<span className='font-semibold text-lg'>{room.floor}</span>
							</div>
							<Separator />
							<div className='pt-4'>
								<Button
									className='w-full h-12 text-md'
									onClick={() => {
										setSelectedSlot(null);
										setCreateModalOpen(true);
									}}
									disabled={!room.isActive}
								>
									<CalendarDays className='mr-2 w-5 h-5' />
									Забронировать
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Секция Календаря */}
			<div className='pt-8'>
				<h2 className='mb-6 font-bold text-2xl'>Расписание занятости</h2>
				<div className='bg-white shadow-sm border rounded-lg'>
					{/* Передаем rooms=[room], чтобы календарь знал контекст, хотя view=resource мы тут, вероятно, не будем использовать */}
					<Calendar
						bookings={bookings}
						rooms={[room]}
						date={date}
						view={view}
						onNavigate={setDate}
						onView={setView}
						onSelectSlot={handleSelectSlot}
						onSelectEvent={handleSelectEvent}
					/>
				</div>
			</div>

			{/* Модальные окна */}
			<BookingDialog
				open={createModalOpen}
				onOpenChange={setCreateModalOpen}
				selectedSlot={selectedSlot}
				rooms={[room]} // Передаем только эту комнату, чтобы в селекте была только она
			/>

			<BookingDetailsDialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen} booking={selectedEvent} />
		</div>
	);
};
