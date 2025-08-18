
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Tag, Bell, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile } from "@/services/users";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "./ui/badge";

const navItems = [
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/requirements", icon: Tag, label: "Requirements" },
  { href: "/offers", icon: Bell, label: "Offers" },
  { href: "/profile", icon: User, label: "Profile" },
];

const adminNavItem = { href: "/admin", icon: Shield, label: "Admin" };

export function BottomNav() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

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

  useEffect(() => {
    if (!currentUser?.uid) return;

    const personalChatsRef = collection(db, `users/${currentUser.uid}/personalChats`);
    const q = query(personalChatsRef, where('unreadCount', '>', 0));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        let total = 0;
        snapshot.docs.forEach(doc => {
            total += doc.data().unreadCount || 0;
        });
        setTotalUnread(total);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const allNavItems = currentUser?.isAdmin ? [...navItems, adminNavItem] : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="grid h-16 grid-cols-5 max-w-lg mx-auto">
        {allNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group inline-flex flex-col items-center justify-center px-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isActive && "text-primary"
              )}
            >
              <div className="relative">
                <item.icon className="w-6 h-6 mb-1" />
                {item.href === "/chat" && totalUnread > 0 && (
                    <Badge className="absolute -top-2 -right-3 h-5 w-5 rounded-full flex items-center justify-center p-0">{totalUnread}</Badge>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
