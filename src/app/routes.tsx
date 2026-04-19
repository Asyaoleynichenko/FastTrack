import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, useRouteError } from 'react-router';
import { TopNav } from './components/TopNav';

const ObjectsListPage = lazy(() =>
  import('./components/ObjectsListPage').then((m) => ({ default: m.ObjectsListPage })),
);
const ServerDetailsPage = lazy(() =>
  import('./components/ServerDetailsPage').then((m) => ({ default: m.ServerDetailsPage })),
);
const RacksPage = lazy(() => import('./components/RacksPage').then((m) => ({ default: m.RacksPage })));
const NetworkPage = lazy(() =>
  import('./components/NetworkPage').then((m) => ({ default: m.NetworkPage })),
);
const NotificationsPage = lazy(() =>
  import('./components/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-mid" aria-busy="true">
      <span
        className="inline-block w-8 h-8 rounded-full border-2 border-line border-t-[#2563eb] animate-spin"
        aria-hidden
      />
      <span className="text-sm">Loading…</span>
    </div>
  );
}

/** Shown when the route tree throws (e.g. stale chunk after deploy on GitHub Pages). */
function RouteError() {
  const err = useRouteError();
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error';
  const staleChunk = /Failed to fetch|Loading chunk|dynamically imported module/i.test(message);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg px-6 py-12 text-center">
      <p className="text-lg font-semibold text-hi">Не удалось загрузить страницу</p>
      <p className="max-w-md text-sm text-mid">
        {staleChunk
          ? 'Часто это устаревший кэш после обновления сайта. Сделайте полное обновление (Ctrl+Shift+R или Cmd+Shift+R) или нажмите кнопку ниже.'
          : message}
      </p>
      <button
        type="button"
        className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8]"
        onClick={() => window.location.reload()}
      >
        Перезагрузить
      </button>
    </div>
  );
}

function Root() {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <TopNav />
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
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
      errorElement: <RouteError />,
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
    basename: __ROUTER_BASENAME__ || undefined,
  },
);