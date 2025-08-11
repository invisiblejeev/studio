
'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';

const showBottomNavRoutes = ['/chat', '/requirements', '/offers', '/profile', '/admin'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const showNav = showBottomNavRoutes.some(route => pathname.startsWith(route));

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
