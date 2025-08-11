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

export function UserNav() {
  const { state } = useSidebar();

  if (state === 'collapsed') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="user avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">User</p>
              <p className="text-xs leading-none text-muted-foreground">
                user@example.com
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
          <Link href="/profile" passHref legacyBehavior><DropdownMenuItem><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem></Link>
          <Link href="/settings" passHref legacyBehavior><DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem></Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <Link href="/" passHref legacyBehavior><DropdownMenuItem><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem></Link>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-full justify-start gap-3 px-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="user avatar"/>
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 items-start text-left">
            <p className="text-sm font-medium leading-none text-sidebar-foreground">User</p>
            <p className="text-xs leading-none text-muted-foreground">
              user@example.com
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">User</p>
            <p className="text-xs leading-none text-muted-foreground">
              user@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile" passHref legacyBehavior><DropdownMenuItem><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem></Link>
          <Link href="/settings" passHref legacyBehavior><DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem></Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <Link href="/" passHref legacyBehavior><DropdownMenuItem><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem></Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
