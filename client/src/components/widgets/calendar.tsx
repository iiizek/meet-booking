import { useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { type Booking } from '@/types/booking';
import { type Room } from '@/types/room';

// Настройка локализации
const locales = {
	ru: ru,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
});

interface CalendarProps {
	bookings: Booking[];
	rooms?: Room[]; // Если нужно разделение по ресурсам (комнатам)
	date: Date;
	view: View;
	onNavigate: (date: Date) => void;
	onView: (view: View) => void;
	onSelectSlot: (slotInfo: { start: Date; end: Date; resourceId?: string }) => void;
	onSelectEvent: (event: Booking) => void;
}

export const Calendar = ({
	bookings,
	rooms,
	date,
	view,
	onNavigate,
	onView,
	onSelectSlot,
	onSelectEvent,
}: CalendarProps) => {
	// Преобразуем данные для календаря
	const events = useMemo(() => {
		return bookings.map((b) => ({
			...b,
			start: new Date(b.startTime),
			end: new Date(b.endTime),
			resourceId: b.roomId, // Важно для связки с ресурсами
			title: `${b.title} (${b.room?.name || 'Комната'})`,
		}));
	}, [bookings]);

	// Ресурсы (комнаты) для View "Day" (чтобы видеть колонки)
	const resources = useMemo(() => {
		if (!rooms) return undefined;
		return rooms.map((r) => ({ id: r.id, title: r.name }));
	}, [rooms]);

	return (
		<div className='bg-white shadow-sm p-4 border rounded-lg h-[calc(100vh-200px)] min-h-125'>
			<BigCalendar
				localizer={localizer}
				events={events}
				resources={resources}
				resourceIdAccessor='id'
				resourceTitleAccessor='title'
				startAccessor='start'
				endAccessor='end'
				date={date}
				view={view}
				onNavigate={onNavigate}
				onView={onView}
				selectable
				onSelectSlot={(slotInfo) => {
					// react-big-calendar в slotInfo.resourceId возвращает ID ресурса (строку или число)
					onSelectSlot({
						start: slotInfo.start as Date,
						end: slotInfo.end as Date,
						resourceId: slotInfo.resourceId as string,
					});
				}}
				onSelectEvent={(event) => onSelectEvent(event as unknown as Booking)}
				culture='ru'
				messages={{
					next: 'След.',
					previous: 'Пред.',
					today: 'Сегодня',
					month: 'Месяц',
					week: 'Неделя',
					day: 'День',
					agenda: 'Список',
					date: 'Дата',
					time: 'Время',
					event: 'Событие',
					noEventsInRange: 'Нет событий в этом диапазоне',
				}}
				min={new Date(0, 0, 0, 8, 0, 0)} // Начало дня в 08:00
				max={new Date(0, 0, 0, 22, 0, 0)} // Конец дня в 22:00
			/>
		</div>
	);
};

