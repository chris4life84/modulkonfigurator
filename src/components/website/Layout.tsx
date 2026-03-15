import { Outlet, useLocation } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

export function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Footer nur auf Unterseiten und nach dem Konfigurator auf Home */}
      <SiteFooter />
    </div>
  );
}
