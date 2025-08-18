
'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Settings, User, LogOut } from 'lucide-react';
import { useSidebar } from './ui/sidebar';
import { useState, useEffect } from 'react';
import { getCurrentUser, logOut } from '@/services/auth';
import { getUserProfile, UserProfile } from '@/services/users';
import { useRouter } from 'next/navigation';

export function UserNav() {
  const { state } = useSidebar();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
        const user = await getCurrentUser() as any;
        if(user) {
            const userProfile = await getUserProfile(user.uid);
            setProfile(userProfile);
        } else {
            router.push('/');
        }
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await logOut();
    router.push('/');
  }

  if (!profile) {
      return null;
  }

  const userInitial = profile.firstName ? profile.firstName.charAt(0) + (profile.lastName ? profile.lastName.charAt(0) : '') : 'U';

  const userMenuContent = (
      <>
        <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile.firstName} {profile.lastName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {profile.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href="/profile" passHref legacyBehavior><DropdownMenuItem><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem></Link>
            <Link href="/settings" passHref legacyBehavior><DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem></Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
      </>
  );

  if (state === 'collapsed') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile.avatar || undefined} alt={profile.username} data-ai-hint="user avatar" />
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          {userMenuContent}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-full justify-start gap-3 px-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar || undefined} alt={profile.username} data-ai-hint="user avatar"/>
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 items-start text-left">
            <p className="text-sm font-medium leading-none text-sidebar-foreground">{profile.firstName} {profile.lastName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {userMenuContent}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
