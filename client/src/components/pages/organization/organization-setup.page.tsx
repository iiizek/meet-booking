import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Building2, UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';

import { useCreateOrganization, useJoinOrganization, useCheckInvite } from '@/services/organization';
import { useAuthStore } from '@/store/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Схема для создания
const createSchema = z.object({
	name: z.string().min(3, 'Минимум 3 символа'),
	description: z.string().optional(),
});

// Схема для входа
const joinSchema = z.object({
	code: z.string().min(6, 'Код должен содержать минимум 6 символов'),
});

export const OrganizationSetupPage = () => {
	const { user } = useAuthStore();
	const [activeTab, setActiveTab] = useState('create');

	// Мутации
	const createMutation = useCreateOrganization();
	const checkInviteMutation = useCheckInvite();
	const joinMutation = useJoinOrganization();

	// Форма создания
	const createForm = useForm<z.infer<typeof createSchema>>({
		resolver: zodResolver(createSchema),
		defaultValues: { name: '', description: '' },
	});

	// Форма входа
	const joinForm = useForm<z.infer<typeof joinSchema>>({
		resolver: zodResolver(joinSchema),
		defaultValues: { code: '' },
	});

	// Обработчики
	const onCreateSubmit = (values: z.infer<typeof createSchema>) => {
		createMutation.mutate(values);
	};

	const onCheckInvite = async (values: z.infer<typeof joinSchema>) => {
		checkInviteMutation.mutate(values.code);
	};

	const onJoinConfirm = () => {
		const code = joinForm.getValues('code');
		joinMutation.mutate({ code });
	};

	return (
		<div className='flex flex-col justify-center items-center bg-gray-50 p-4 min-h-screen'>
			<div className='space-y-6 w-full max-w-lg'>
				<div className='space-y-2 text-center'>
					<h1 className='font-bold text-3xl tracking-tight'>Добро пожаловать, {user?.name}!</h1>
					<p className='text-muted-foreground'>
						Для начала работы необходимо создать новую организацию или присоединиться к существующей.
					</p>
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
					<TabsList className='grid grid-cols-2 w-full'>
						<TabsTrigger value='create'>Создать организацию</TabsTrigger>
						<TabsTrigger value='join'>Присоединиться</TabsTrigger>
					</TabsList>

					{/* ТАБ: СОЗДАНИЕ */}
					<TabsContent value='create'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Building2 className='w-5 h-5' />
									Новое пространство
								</CardTitle>
								<CardDescription>Вы станете администратором новой организации.</CardDescription>
							</CardHeader>
							<CardContent>
								<Form {...createForm}>
									<form onSubmit={createForm.handleSubmit(onCreateSubmit)} className='space-y-4'>
										<FormField
											control={createForm.control}
											name='name'
											render={({ field }) => (
												<FormItem>
													<FormLabel>Название организации</FormLabel>
													<FormControl>
														<Input placeholder='Например: Рога и Копыта' {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={createForm.control}
											name='description'
											render={({ field }) => (
												<FormItem>
													<FormLabel>Описание (опционально)</FormLabel>
													<FormControl>
														<Textarea placeholder='Коротко о вашей компании...' className='resize-none' {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Button type='submit' className='w-full' disabled={createMutation.isPending}>
											{createMutation.isPending && <Loader2 className='mr-2 w-4 h-4 animate-spin' />}
											Создать и продолжить
										</Button>
									</form>
								</Form>
							</CardContent>
						</Card>
					</TabsContent>

					{/* ТАБ: ПРИСОЕДИНЕНИЕ */}
					<TabsContent value='join'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<UserPlus className='w-5 h-5' />
									Вход по приглашению
								</CardTitle>
								<CardDescription>Введите код, полученный от администратора.</CardDescription>
							</CardHeader>
							<CardContent>
								<Form {...joinForm}>
									<form onSubmit={joinForm.handleSubmit(onCheckInvite)} className='space-y-4'>
										<FormField
											control={joinForm.control}
											name='code'
											render={({ field }) => (
												<FormItem>
													<FormLabel>Инвайт-код</FormLabel>
													<FormControl>
														<Input
															placeholder='A1B2C3...'
															className='font-mono uppercase tracking-widest'
															maxLength={12}
															{...field}
															onChange={(e) => field.onChange(e.target.value.toUpperCase())}
															// Сбрасываем результат проверки при изменении кода
															onInput={() => checkInviteMutation.reset()}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										{/* Если инвайт успешно проверен, показываем информацию */}
										{checkInviteMutation.isSuccess && checkInviteMutation.data && (
											<div className='space-y-3 bg-green-50 slide-in-from-top-2 p-4 border border-green-200 rounded-lg animate-in fade-in'>
												<div className='flex items-start gap-3'>
													<CheckCircle2 className='mt-0.5 w-5 h-5 text-green-600' />
													<div>
														<h4 className='font-medium text-green-900'>Организация найдена!</h4>
														<p className='mt-1 text-green-800 text-sm'>
															{checkInviteMutation.data.data.organization.name}
														</p>
														<p className='mt-1 text-green-700 text-xs'>
															Участников: {checkInviteMutation.data.data.organization._count?.users || 0}
														</p>
													</div>
												</div>
												<Button
													type='button'
													variant='default'
													className='bg-green-600 hover:bg-green-700 w-full text-white'
													onClick={onJoinConfirm}
													disabled={joinMutation.isPending}
												>
													{joinMutation.isPending ? (
														<Loader2 className='mr-2 w-4 h-4 animate-spin' />
													) : (
														<ArrowRight className='mr-2 w-4 h-4' />
													)}
													Присоединиться
												</Button>
											</div>
										)}

										{/* Кнопка "Проверить", если еще не проверено */}
										{!checkInviteMutation.isSuccess && (
											<Button
												type='submit'
												variant='secondary'
												className='w-full'
												disabled={checkInviteMutation.isPending}
											>
												{checkInviteMutation.isPending && <Loader2 className='mr-2 w-4 h-4 animate-spin' />}
												Проверить код
											</Button>
										)}
									</form>
								</Form>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
};

