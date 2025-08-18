
'use client';

import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { UserNav } from "@/components/UserNav";
import { MessageSquare, Tag, Bell, Shield } from 'lucide-react';
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile } from "@/services/users";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/requirements", icon: Tag, label: "Requirements" },
  { href: "/offers", icon: Bell, label: "Offers" },
];

const adminNavItem = { href: "/admin", icon: Shield, label: "Admin" };

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser();
            if (user) {
                const profile = await getUserProfile(user.uid);
                setCurrentUser(profile);
            }
        };
        fetchUser();
    }, []);

    const allNavItems = currentUser?.isAdmin ? [...navItems, adminNavItem] : navItems;
    
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader/>
                <SidebarContent>
                    <SidebarMenu>
                        {allNavItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <Link href={item.href} className="w-full">
                                    <SidebarMenuButton isActive={pathname.startsWith(item.href)}>
                                        <item.icon/>
                                        {item.label}
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                    <UserNav />
                </SidebarFooter>
            </Sidebar>
            <SidebarInset className="flex flex-col no-scrollbar">
                <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 shadow-sm md:justify-end">
                    <SidebarTrigger className="md:hidden" />
                    <div className="text-lg font-semibold">
                        {allNavItems.find(item => pathname.startsWith(item.href))?.label || "Indian Community Chat"}
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
