
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Tag, Shield, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile } from "@/services/users";

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
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-t-lg">
      <div className="flex justify-around items-center h-16">
        {allNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link href={item.href} key={item.href}>
              <div className="flex flex-col items-center justify-center gap-1">
                <item.icon
                  className={cn(
                    "w-6 h-6",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
