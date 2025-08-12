
'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

// Routes that should not show the bottom nav
const noBottomNavRoutes = [
    '/',
    '/signup'
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showNav = isMounted && !noBottomNavRoutes.includes(pathname) && !pathname.startsWith('/chat/user/');
  
  if (!isMounted) {
    // Return a placeholder or null on the server to avoid hydration mismatches
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
