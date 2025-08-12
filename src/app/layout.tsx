
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const showBottomNavRoutes = ['/chat', '/requirements', '/offers', '/profile', '/admin'];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // A bit more complex logic to show nav for /chat, /chat/california, but not /chat/user/some-id or /chat/personal
  const showNav = isMounted && showBottomNavRoutes.some(route => {
    if (pathname.startsWith('/chat/user/') || pathname === '/chat/personal') {
        return false;
    }
    return pathname.startsWith(route)
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <div className="flex flex-col h-screen">
          <main className={cn("flex-1 overflow-y-auto", showNav && "pb-16")}>
            {children}
          </main>
          {showNav && <BottomNav />}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
