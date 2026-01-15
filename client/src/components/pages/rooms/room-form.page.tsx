import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, Trash2, ArrowLeft } from 'lucide-react';

import { useRoom, useCreateRoom, useUpdateRoom, useDeleteRoom, useUploadRoomImage } from '@/services/rooms';
import { AVAILABLE_AMENITIES } from '@/lib/amenities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
	name: z.string().min(2, 'Название обязательно'),
	description: z.string().optional(),
	capacity: z.coerce.number().min(1, 'Минимум 1 человек'),
	floor: z.coerce.number().min(0, 'Этаж не может быть отрицательным'),
	amenities: z.array(z.string()).default([]),
	isActive: z.boolean().default(true),
});

export const RoomFormPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const isEditMode = !!id;

	// API Hooks
	const { data: room, isLoading: isLoadingRoom } = useRoom(id as string);
	const createMutation = useCreateRoom();
	const updateMutation = useUpdateRoom();
	const deleteMutation = useDeleteRoom();
	const uploadImageMutation = useUploadRoomImage();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			description: '',
			capacity: 1,
			floor: 1,
			amenities: [],
			isActive: true,
		},
	});

	// Заполнение формы при редактировании
	useEffect(() => {
		if (room) {
			form.reset({
				name: room.name,
				description: room.description || '',
				capacity: room.capacity,
				floor: room.floor,
				amenities: room.amenities,
				isActive: room.isActive,
			});
		}
	}, [room, form]);

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			if (isEditMode && id) {
				await updateMutation.mutateAsync({ id, data: values });
			} else {
				await createMutation.mutateAsync(values);
				// Если это создание, можно предложить загрузить фото, или редирект
				// Для простоты редиректим на список
				navigate('/rooms');
			}
		} catch {
			// Ошибки обрабатываются в мутации
		}
	};

	const handleDelete = async () => {
		if (!confirm('Вы уверены? Это действие нельзя отменить.')) return;
		if (id) {
			await deleteMutation.mutateAsync(id);
			navigate('/rooms');
		}
	};

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && id) {
			uploadImageMutation.mutate({ id, file });
		}
	};

	if (isEditMode && isLoadingRoom) {
		return (
			<div className='flex justify-center p-12'>
				<Loader2 className='animate-spin' />
			</div>
		);
	}

	return (
		<div className='space-y-6 mx-auto max-w-3xl'>
			<div className='flex items-center gap-4'>
				<Button variant='ghost' size='icon' onClick={() => navigate('/rooms')}>
					<ArrowLeft className='w-5 h-5' />
				</Button>
				<h1 className='font-bold text-2xl'>{isEditMode ? 'Редактирование комнаты' : 'Новая комната'}</h1>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
					<Card>
						<CardHeader>
							<CardTitle>Основные данные</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<FormField
								control={form.control}
								name='name'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Название *</FormLabel>
										<FormControl>
											<Input placeholder='Переговорная А' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className='gap-4 grid grid-cols-2'>
								<FormField
									control={form.control}
									name='capacity'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Вместимость (чел) *</FormLabel>
											<FormControl>
												<Input type='number' {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='floor'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Этаж *</FormLabel>
											<FormControl>
												<Input type='number' {...field} />
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

							{isEditMode && (
								<FormField
									control={form.control}
									name='isActive'
									render={({ field }) => (
										<FormItem className='flex flex-row justify-between items-center shadow-sm p-3 border rounded-lg'>
											<div className='space-y-0.5'>
												<FormLabel>Активна</FormLabel>
												<FormDescription>Если выключить, комнату нельзя будет забронировать</FormDescription>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
										</FormItem>
									)}
								/>
							)}
						</CardContent>
					</Card>

					{/* Amenities */}
					<Card>
						<CardHeader>
							<CardTitle>Удобства и оборудование</CardTitle>
						</CardHeader>
						<CardContent>
							<FormField
								control={form.control}
								name='amenities'
								render={() => (
									<FormItem>
										<div className='gap-4 grid grid-cols-2 md:grid-cols-3'>
											{AVAILABLE_AMENITIES.map((item) => (
												<FormField
													key={item.value}
													control={form.control}
													name='amenities'
													render={({ field }) => {
														return (
															<FormItem key={item.value} className='flex flex-row items-start space-x-3 space-y-0'>
																<FormControl>
																	<Checkbox
																		checked={field.value?.includes(item.value)}
																		onCheckedChange={(checked) => {
																			return checked
																				? field.onChange([...field.value, item.value])
																				: field.onChange(field.value?.filter((value) => value !== item.value));
																		}}
																	/>
																</FormControl>
																<FormLabel className='flex items-center gap-2 font-normal cursor-pointer'>
																	<item.icon className='w-4 h-4 text-muted-foreground' />
																	{item.label}
																</FormLabel>
															</FormItem>
														);
													}}
												/>
											))}
										</div>
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{/* Image Upload (Только в режиме редактирования для простоты) */}
					{isEditMode && (
						<Card>
							<CardHeader>
								<CardTitle>Изображение</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='flex items-center gap-4'>
									{room?.imageUrl && (
										<img
											src={
												room.imageUrl.startsWith('http')
													? room.imageUrl
													: `${import.meta.env.VITE_API_URL.replace('/api', '')}${room.imageUrl}`
											}
											className='rounded-md w-24 h-24 object-cover'
											alt='Room'
										/>
									)}
									<div className='items-center gap-1.5 grid w-full max-w-sm'>
										<FormLabel htmlFor='picture'>Загрузить фото</FormLabel>
										<Input id='picture' type='file' onChange={handleImageUpload} accept='image/*' />
										{uploadImageMutation.isPending && <p className='text-muted-foreground text-xs'>Загрузка...</p>}
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					<div className='flex gap-4'>
						<Button type='submit' disabled={createMutation.isPending || updateMutation.isPending}>
							{(createMutation.isPending || updateMutation.isPending) && (
								<Loader2 className='mr-2 w-4 h-4 animate-spin' />
							)}
							<Save className='mr-2 w-4 h-4' />
							Сохранить
						</Button>

						{isEditMode && (
							<Button type='button' variant='destructive' onClick={handleDelete} disabled={deleteMutation.isPending}>
								<Trash2 className='mr-2 w-4 h-4' />
								Удалить комнату
							</Button>
						)}
					</div>
				</form>
			</Form>
		</div>
	);
};

