import { createBrowserRouter, Outlet } from 'react-router';
import { TopNav } from './components/TopNav';
import { ObjectsListPage } from './components/ObjectsListPage';
import { ServerDetailsPage } from './components/ServerDetailsPage';
import { RacksPage } from './components/RacksPage';
import { NetworkPage } from './components/NetworkPage';
import { NotificationsPage } from './components/NotificationsPage';

function Root() {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <TopNav />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
      <div className="text-center">
        <p className="text-4xl font-bold text-slate-200 mb-3">404</p>
        <p className="text-lg text-slate-500">Page not found</p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      Component: Root,
      children: [
        { index: true, Component: ObjectsListPage },
        { path: 'server/:id', Component: ServerDetailsPage },
        { path: 'racks', Component: RacksPage },
        { path: 'network', Component: NetworkPage },
        { path: 'notifications', Component: NotificationsPage },
        { path: '*', Component: NotFound },
      ],
    },
  ],
  {
    basename:
      import.meta.env.BASE_URL.replace(/\/$/, '') || undefined,
  },
);