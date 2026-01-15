import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, Calendar as CalIcon, Clock, MapPin } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useCancelBooking } from '@/services/booking';
import { type Booking } from '@/types/booking';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface BookingDetailsDialogProps {
	booking: Booking | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const BookingDetailsDialog = ({ booking, open, onOpenChange }: BookingDetailsDialogProps) => {
	const { user } = useAuthStore();
	const cancelMutation = useCancelBooking();

	if (!booking) return null;

	const isOwner = user?.id === booking.userId;
	const isAdmin = user?.role === 'admin';
	const canCancel = (isOwner || isAdmin) && booking.status !== 'cancelled';

	const handleCancel = () => {
		if (confirm('Вы уверены, что хотите отменить эту встречу?')) {
			cancelMutation.mutate(booking.id, {
				onSuccess: () => onOpenChange(false),
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<div className='flex items-center gap-2'>
						<DialogTitle className='text-xl'>{booking.title}</DialogTitle>
						{booking.status === 'cancelled' && <Badge variant='destructive'>Отменено</Badge>}
						{booking.googleCalendarSynced && (
							<Badge variant='secondary' className='bg-blue-100 text-blue-800'>
								Google
							</Badge>
						)}
					</div>
					<DialogDescription>Создатель: {booking.user?.name || 'Неизвестно'}</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-4'>
					<div className='flex items-center gap-3'>
						<CalIcon className='w-5 h-5 text-muted-foreground' />
						<span>{format(new Date(booking.startTime), 'd MMMM yyyy (EEEE)', { locale: ru })}</span>
					</div>
					<div className='flex items-center gap-3'>
						<Clock className='w-5 h-5 text-muted-foreground' />
						<span>
							{format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
						</span>
					</div>
					<div className='flex items-center gap-3'>
						<MapPin className='w-5 h-5 text-muted-foreground' />
						<span>{booking.room?.name}</span>
					</div>

					{booking.description && <div className='bg-muted/50 mt-2 p-3 rounded-md text-sm'>{booking.description}</div>}
				</div>

				<DialogFooter className='sm:justify-between'>
					<div className='self-center text-muted-foreground text-xs'>ID: {booking.id.slice(0, 8)}</div>
					{canCancel && (
						<Button variant='destructive' onClick={handleCancel} disabled={cancelMutation.isPending}>
							{cancelMutation.isPending && <Loader2 className='mr-2 w-4 h-4 animate-spin' />}
							Отменить встречу
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
