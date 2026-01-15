import { createBrowserRouter } from 'react-router';

import { AuthGuard } from '@/components/layouts/auth-guard';
import { DashboardLayout } from '@/components/layouts/dashboard';
import { InvitesPage } from '@/components/pages/admin/invites.page';
import { UsersPage } from '@/components/pages/admin/users.page';
import { AuthCallbackPage } from '@/components/pages/auth/auth-callback.page';
import { LoginPage } from '@/components/pages/auth/login.page';
import { RegisterPage } from '@/components/pages/auth/register.page';
import { DashboardPage } from '@/components/pages/dashboard/dashboard.page';
import { OrganizationSetupPage } from '@/components/pages/organization/organization-setup.page';
import { ProfilePage } from '@/components/pages/profile/profile.page';
import { RoomDetailsPage } from '@/components/pages/rooms/room-detail.page';
import { RoomFormPage } from '@/components/pages/rooms/room-form.page';
import { RoomsPage } from '@/components/pages/rooms/rooms.page';

const router = createBrowserRouter([
	// Публичные маршруты
	{
		path: '/login',
		element: <LoginPage />,
	},
	{
		path: '/register',
		element: <RegisterPage />,
	},
	{
		path: '/auth/callback',
		element: <AuthCallbackPage />,
	},

	// Приватные маршруты
	{
		path: '/',
		element: (
			<AuthGuard>
				<DashboardLayout />
			</AuthGuard>
		),
		children: [
			{
				path: '/',
				element: <DashboardPage />,
			},
			{
				path: '/rooms',
				element: <RoomsPage />,
			},
			{
				path: '/rooms/new',
				element: <RoomFormPage />,
			},
			{
				path: '/rooms/:id/edit',
				element: <RoomFormPage />,
			},
			{
				path: '/rooms/:id',
				element: <RoomDetailsPage />,
			},
			{
				path: '/users',
				element: <UsersPage />,
			},
			{
				path: '/invites',
				element: <InvitesPage />,
			},
			{
				path: '/profile',
				element: <ProfilePage />,
			},
		],
	},

	{
		path: '/organization/setup',
		element: (
			<AuthGuard>
				<OrganizationSetupPage />
			</AuthGuard>
		),
	},
]);

export default router;

