import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

import { useCreateBooking } from '@/services/booking';
import { type Room } from '@/types/room';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Схема валидации
const formSchema = z
	.object({
		title: z.string().min(1, 'Укажите название встречи'),
		description: z.string().optional(),
		roomId: z.string().min(1, 'Выберите комнату'),
		date: z.string(), // YYYY-MM-DD
		startTime: z.string(), // HH:mm
		endTime: z.string(), // HH:mm
	})
	.refine(
		(data) => {
			return data.endTime > data.startTime;
		},
		{
			message: 'Конец встречи должен быть позже начала',
			path: ['endTime'],
		}
	);

interface BookingDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedSlot?: { start: Date; end: Date; resourceId?: string } | null;
	rooms: Room[];
}

export const BookingDialog = ({ open, onOpenChange, selectedSlot, rooms }: BookingDialogProps) => {
	const createMutation = useCreateBooking();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: '',
			description: '',
			roomId: '',
			date: format(new Date(), 'yyyy-MM-dd'),
			startTime: '10:00',
			endTime: '11:00',
		},
	});

	// При открытии слота заполняем форму
	useEffect(() => {
		if (selectedSlot && open) {
			form.reset({
				title: '',
				description: '',
				roomId: selectedSlot.resourceId || (rooms.length > 0 ? rooms[0].id : ''),
				date: format(selectedSlot.start, 'yyyy-MM-dd'),
				startTime: format(selectedSlot.start, 'HH:mm'),
				endTime: format(selectedSlot.end, 'HH:mm'),
			});
		}
	}, [selectedSlot, open, rooms, form]);

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		// Собираем ISO строки
		const startIso = new Date(`${values.date}T${values.startTime}:00`).toISOString();
		const endIso = new Date(`${values.date}T${values.endTime}:00`).toISOString();

		createMutation.mutate(
			{
				title: values.title,
				description: values.description,
				roomId: values.roomId,
				startTime: startIso,
				endTime: endIso,
			},
			{
				onSuccess: () => {
					onOpenChange(false);
					form.reset();
				},
			}
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-110'>
				<DialogHeader>
					<DialogTitle>Новое бронирование</DialogTitle>
					<DialogDescription>Заполните детали встречи.</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
						<FormField
							control={form.control}
							name='title'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Название *</FormLabel>
									<FormControl>
										<Input placeholder='Планёрка' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name='roomId'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Комната *</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder='Выберите комнату' />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{rooms.map((room) => (
												<SelectItem key={room.id} value={room.id}>
													{room.name} ({room.capacity} чел.)
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className='gap-4 grid grid-cols-2'>
							<FormField
								control={form.control}
								name='date'
								render={({ field }) => (
									<FormItem className='col-span-2'>
										<FormLabel>Дата</FormLabel>
										<FormControl>
											<Input type='date' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='startTime'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Начало</FormLabel>
										<FormControl>
											<Input type='time' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='endTime'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Конец</FormLabel>
										<FormControl>
											<Input type='time' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name='description'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Описание</FormLabel>
									<FormControl>
										<Textarea placeholder='...' className='resize-none' {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type='submit' className='w-full' disabled={createMutation.isPending}>
							{createMutation.isPending && <Loader2 className='mr-2 w-4 h-4 animate-spin' />}
							Забронировать
						</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
