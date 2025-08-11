"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, ChevronRight, CreditCard, Globe, LogOut, Mail, MapPin, Phone, Shield, User } from "lucide-react";
import Link from "next/link";

const ProfileInfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-center gap-4">
        <div className="bg-muted rounded-full p-2">
            <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    </div>
);

const SettingsItem = ({ icon: Icon, label, href, isLogout = false }: { icon: React.ElementType, label: string, href: string, isLogout?: boolean }) => (
    <Link href={href}>
      <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
              <Icon className={`w-5 h-5 ${isLogout ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className={`font-medium ${isLogout ? 'text-destructive' : ''}`}>{label}</span>
          </div>
          {!isLogout && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
      </div>
    </Link>
);


export default function ProfilePage() {
  return (
    <div className="bg-muted/20 min-h-screen pb-24">
      <div className="flex flex-col items-center text-center py-6 bg-background">
          <Avatar className="h-24 w-24 mb-4 bg-primary/10">
            <User className="w-12 h-12 text-primary" />
          </Avatar>
          <h1 className="text-2xl font-bold">John Doe</h1>
          <p className="text-muted-foreground">Indian Community Member</p>
      </div>

      <div className="space-y-6 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Profile Information</CardTitle>
            <Button variant="ghost" size="icon" className="text-primary">
              <CreditCard className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProfileInfoItem icon={User} label="Full Name" value="John Doe" />
            <ProfileInfoItem icon={Mail} label="Email" value="john.doe@email.com" />
            <ProfileInfoItem icon={Phone} label="Phone Number" value="+1 (555) 123-4567" />
            <ProfileInfoItem icon={MapPin} label="State" value="California" />
            <ProfileInfoItem icon={Globe} label="City" value="San Francisco" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
             <SettingsItem icon={Bell} label="Notifications" href="/settings" />
             <SettingsItem icon={Shield} label="Privacy & Security" href="/settings" />
             <SettingsItem icon={LogOut} label="Logout" href="/" isLogout={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
