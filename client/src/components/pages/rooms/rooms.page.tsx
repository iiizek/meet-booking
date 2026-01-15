import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRooms } from '@/services/rooms';
import { getAmenityIcon, getAmenityLabel } from '@/lib/amenities';
import { Link } from 'react-router';
import { Plus, Users, Layers, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const RoomsPage = () => {
	const { user } = useAuthStore();
	const [minCapacity, setMinCapacity] = useState<number>(0);

	const {
		data: rooms,
		isLoading,
		isError,
		error,
	} = useRooms({
		minCapacity: minCapacity > 0 ? minCapacity : undefined,
	});

	return (
		<div className='space-y-6'>
			<div className='flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4'>
				<div>
					<h1 className='font-bold text-3xl tracking-tight'>Переговорные комнаты</h1>
					<p className='text-muted-foreground'>{rooms?.length || 0} доступных помещений для бронирования</p>
				</div>

				{user?.role === 'admin' && (
					<Button asChild>
						<Link to='/rooms/new'>
							<Plus className='mr-2 w-4 h-4' />
							Добавить комнату
						</Link>
					</Button>
				)}
			</div>

			{/* Фильтры */}
			<div className='flex items-center gap-4 bg-white p-4 border rounded-lg'>
				<div className='w-full max-w-xs'>
					<label className='block mb-1 font-medium text-sm'>Мин. вместимость</label>
					<Input
						type='number'
						min='0'
						placeholder='Кол-во человек'
						value={minCapacity || ''}
						onChange={(e) => setMinCapacity(Number(e.target.value))}
					/>
				</div>
				{/* Сюда можно добавить мультиселект amenities */}
			</div>

			{/* Список */}
			{isError && (
				<Alert variant='destructive'>
					<AlertCircle className='w-4 h-4' />
					<AlertTitle>Ошибка</AlertTitle>
					<AlertDescription>{error?.message || 'Не удалось загрузить список'}</AlertDescription>
				</Alert>
			)}

			{isLoading ? (
				<div className='gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
					{[1, 2, 3].map((i) => (
						<Card key={i} className='overflow-hidden'>
							<Skeleton className='w-full h-48' />
							<div className='space-y-2 p-6'>
								<Skeleton className='w-3/4 h-6' />
								<Skeleton className='w-1/2 h-4' />
							</div>
						</Card>
					))}
				</div>
			) : (
				<div className='gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
					{rooms?.map((room) => (
						<Card key={room.id} className='flex flex-col hover:shadow-lg overflow-hidden transition-shadow'>
							<div className='relative bg-gray-200 h-48'>
								{room.imageUrl ? (
									<img
										src={
											room.imageUrl.startsWith('http')
												? room.imageUrl
												: `${import.meta.env.VITE_API_URL.replace('/api', '')}${room.imageUrl}`
										}
										alt={room.name}
										className='w-full h-full object-cover'
									/>
								) : (
									<div className='flex justify-center items-center bg-gray-100 w-full h-full text-gray-400'>
										<Layers className='w-12 h-12' />
									</div>
								)}
								{!room.isActive && (
									<Badge variant='destructive' className='top-2 right-2 absolute'>
										Недоступна
									</Badge>
								)}
							</div>

							<CardHeader>
								<CardTitle className='flex justify-between items-start'>
									<span>{room.name}</span>
								</CardTitle>
								<div className='flex items-center gap-4 mt-2 text-muted-foreground text-sm'>
									<div className='flex items-center gap-1'>
										<Users className='w-4 h-4' />
										<span>до {room.capacity}</span>
									</div>
									<div className='flex items-center gap-1'>
										<Layers className='w-4 h-4' />
										<span>{room.floor} этаж</span>
									</div>
								</div>
							</CardHeader>

							<CardContent className='flex-1'>
								<div className='flex flex-wrap gap-2'>
									{room.amenities.slice(0, 5).map((code) => {
										const Icon = getAmenityIcon(code);
										return (
											<div
												key={code}
												className='bg-secondary p-1.5 rounded-md text-secondary-foreground'
												title={getAmenityLabel(code)}
											>
												<Icon className='w-4 h-4' />
											</div>
										);
									})}
									{room.amenities.length > 5 && <Badge variant='secondary'>+{room.amenities.length - 5}</Badge>}
								</div>
							</CardContent>

							<CardFooter className='pt-0'>
								<Button className='w-full' variant={user?.role === 'admin' ? 'outline' : 'default'} asChild>
									{/* Если админ - идем на редактирование, иначе - на бронь (пока заглушка на детали) */}
									<Link to={user?.role === 'admin' ? `/rooms/${room.id}/edit` : `/rooms/${room.id}`}>
										{user?.role === 'admin' ? 'Управление' : 'Подробнее'}
									</Link>
								</Button>
							</CardFooter>
						</Card>
					))}

					{rooms?.length === 0 && (
						<div className='col-span-full py-12 text-muted-foreground text-center'>Комнаты не найдены</div>
					)}
				</div>
			)}
		</div>
	);
};

