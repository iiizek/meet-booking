import { useState } from 'react';
import { Views, type View } from 'react-big-calendar';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

import { useBookings } from '@/services/booking';
import { useRooms } from '@/services/rooms';
import { type Booking } from '@/types/booking';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/widgets/calendar';
import { BookingDialog } from '@/components/widgets/booking-dialog';
import { BookingDetailsDialog } from '@/components/widgets/booking-details-dialog';

export const DashboardPage = () => {
	// Состояние календаря
	const [date, setDate] = useState(new Date());
	const [view, setView] = useState<View>(Views.WEEK);

	// Состояние модалок
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date; resourceId?: string } | null>(null);

	const [detailsModalOpen, setDetailsModalOpen] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);

	// Подгрузка данных
	// Вычисляем диапазон дат для fetch
	// Для простоты берем +- месяц от текущей даты, но в идеале нужно считать точно по view
	const startDate = startOfWeek(startOfMonth(date)).toISOString();
	const endDate = endOfWeek(endOfMonth(date)).toISOString();

	const { data: bookings = [], isLoading: bookingsLoading } = useBookings({ startDate, endDate });
	const { data: rooms = [], isLoading: roomsLoading } = useRooms({ isActive: true });

	const handleSelectSlot = (slotInfo: { start: Date; end: Date; resourceId?: string }) => {
		setSelectedSlot(slotInfo);
		setCreateModalOpen(true);
	};

	const handleSelectEvent = (event: Booking) => {
		setSelectedEvent(event);
		setDetailsModalOpen(true);
	};

	return (
		<div className='flex flex-col space-y-4 h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='font-bold text-2xl'>Расписание бронирований</h1>
				<Button
					onClick={() => {
						setSelectedSlot(null);
						setCreateModalOpen(true);
					}}
				>
					+ Забронировать
				</Button>
			</div>

			{bookingsLoading || roomsLoading ? (
				<div className='flex flex-1 justify-center items-center h-96'>
					<Loader2 className='w-8 h-8 text-primary animate-spin' />
				</div>
			) : (
				<Calendar
					bookings={bookings}
					rooms={rooms} // Передаем комнаты для Resource View
					date={date}
					view={view}
					onNavigate={setDate}
					onView={setView}
					onSelectSlot={handleSelectSlot}
					onSelectEvent={handleSelectEvent}
				/>
			)}

			{/* Модалки */}
			<BookingDialog
				open={createModalOpen}
				onOpenChange={setCreateModalOpen}
				selectedSlot={selectedSlot}
				rooms={rooms}
			/>

			<BookingDetailsDialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen} booking={selectedEvent} />
		</div>
	);
};
