
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const noBottomNavRoutes = ['/', '/signup', '/chat/personal'];

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

  // Simple check to hide nav on specific routes or route patterns.
  const showNav = isMounted && !noBottomNavRoutes.includes(pathname) && !pathname.startsWith('/chat/user/');

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
          <main className={cn("flex-1 bg-background overflow-y-auto no-scrollbar", showNav ? "pb-16" : "pb-0")}>
            {children}
          </main>
          {showNav && <BottomNav />}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
