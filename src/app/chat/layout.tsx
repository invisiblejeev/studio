
'use client';

import { allStates } from "@/lib/states";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IndianRupee } from "lucide-react";
import { UserNav } from "@/components/UserNav";
import { Button } from "@/components/ui/button";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2 p-2">
                        <div className="bg-primary text-primary-foreground rounded-full p-2">
                            <IndianRupee className="h-6 w-6" />
                        </div>
                        <h1 className="text-xl font-bold">Community Chat</h1>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>State Chats</SidebarGroupLabel>
                        <SidebarMenu>
                            {allStates.map((state) => (
                                <SidebarMenuItem key={state.value}>
                                    <Link href={`/chat/${state.value}`} legacyBehavior passHref>
                                        <SidebarMenuButton isActive={pathname.endsWith(`/chat/${state.value}`)}>
                                            {state.label}
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <UserNav />
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <div className="p-4 md:p-6">
                 {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
