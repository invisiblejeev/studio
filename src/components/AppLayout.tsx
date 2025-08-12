
'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const showBottomNavRoutes = ['/chat', '/requirements', '/offers', '/profile', '/admin'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // A bit more complex logic to show nav for /chat, /chat/california, but not /chat/user/some-id or /chat/personal
  const showNav = showBottomNavRoutes.some(route => {
    if (pathname.startsWith('/chat/user/') || pathname === '/chat/personal') {
        return false;
    }
    return pathname.startsWith(route)
  });

  if (!isMounted) {
    return (
        <div className="flex flex-col h-screen">
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <main className={cn("flex-1 overflow-y-auto", showNav && "pb-16")}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
