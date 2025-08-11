
'use client';

import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { MessageSquare, Tag, Shield, IndianRupee } from 'lucide-react';
import { UserNav } from './UserNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/') {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/chat" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <IndianRupee className="size-5" />
            </div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">Community Chat</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/chat" passHref legacyBehavior>
                <SidebarMenuButton isActive={pathname.startsWith('/chat')} tooltip="Chat">
                  <MessageSquare />
                  <span>Chat</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/requirements" passHref legacyBehavior>
                <SidebarMenuButton isActive={pathname.startsWith('/requirements')} tooltip="Requirements">
                  <Tag />
                  <span>Requirements</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/offers" passHref legacyBehavior>
                <SidebarMenuButton isActive={pathname.startsWith('/offers')} tooltip="Offers">
                  <IndianRupee />
                  <span>Offers</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin" passHref legacyBehavior>
                <SidebarMenuButton isActive={pathname.startsWith('/admin')} tooltip="Admin">
                  <Shield />
                  <span>Admin</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-muted/40">
        <div className="p-4 sm:p-6 lg:p-8 h-full">
            <div className="md:hidden pb-4">
                <SidebarTrigger />
            </div>
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
