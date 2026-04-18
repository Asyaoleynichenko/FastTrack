import { Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router';
import { TopNav } from './components/TopNav';

function PageFallback() {
  return (
    <div className="flex flex-1 min-h-[40vh] items-center justify-center gap-2 text-sm text-mid bg-bg">
      <span
        className="inline-block size-4 shrink-0 rounded-full border-2 border-line border-t-mid animate-spin"
        aria-hidden
      />
      Loading…
    </div>
  );
}

function Root() {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <TopNav />
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
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
        {
          index: true,
          lazy: () =>
            import('./components/ObjectsListPage').then((m) => ({ Component: m.ObjectsListPage })),
        },
        {
          path: 'server/:id',
          lazy: () =>
            import('./components/ServerDetailsPage').then((m) => ({ Component: m.ServerDetailsPage })),
        },
        {
          path: 'racks',
          lazy: () => import('./components/RacksPage').then((m) => ({ Component: m.RacksPage })),
        },
        {
          path: 'network',
          lazy: () => import('./components/NetworkPage').then((m) => ({ Component: m.NetworkPage })),
        },
        {
          path: 'notifications',
          lazy: () =>
            import('./components/NotificationsPage').then((m) => ({ Component: m.NotificationsPage })),
        },
        { path: '*', Component: NotFound },
      ],
    },
  ],
  {
    basename: __ROUTER_BASENAME__ || undefined,
  },
);