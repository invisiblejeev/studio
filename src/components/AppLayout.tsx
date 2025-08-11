
'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';

const showBottomNavRoutes = ['/chat', '/requirements', '/offers', '/profile', '/admin'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // A bit more complex logic to show nav for /chat, /chat/california, but not /chat/user/some-id or /chat/personal
  const showNav = showBottomNavRoutes.some(route => {
    if (pathname.startsWith('/chat/user/') || pathname === '/chat/personal') {
        return false;
    }
    return pathname.startsWith(route)
  });


  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
