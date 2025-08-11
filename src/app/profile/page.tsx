
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allStates } from "@/lib/states";
import { Bell, ChevronRight, Globe, LogOut, Mail, MapPin, Phone, Shield, User, Pencil, X, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const ProfileInfoItem = ({ icon: Icon, label, value, isEditing, onValueChange }: { icon: React.ElementType, label: string, value: string, isEditing: boolean, onValueChange: (value: string) => void }) => (
    <div className="flex items-start gap-4">
        <div className="bg-muted rounded-full p-2 mt-1">
            <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
            <Label htmlFor={label} className="text-xs text-muted-foreground">{label}</Label>
            {isEditing ? (
                 label === "State" ? (
                    <Select value={value} onValueChange={onValueChange}>
                        <SelectTrigger id={label} className="h-9 mt-1">
                            <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                            {allStates.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 ) : (
                    <Input id={label} value={value} onChange={(e) => onValueChange(e.target.value)} className="h-9 mt-1" />
                 )
            ) : (
                <p className="font-medium pt-1">{label === "State" ? allStates.find(s => s.value === value)?.label || value : value}</p>
            )}
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
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    username: "johndoe",
    email: "john.doe@email.com",
    phone: "+1 (555) 123-4567",
    state: "california",
    city: "San Francisco"
  });

  const handleProfileChange = (field: keyof typeof profile) => (value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div className="bg-muted/20 min-h-screen pb-24">
      <div className="flex flex-col items-center text-center py-6 bg-background">
          <Avatar className="h-24 w-24 mb-4 bg-primary/10">
            <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="person avatar" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          <p className="text-muted-foreground">Indian Community Member</p>
      </div>

      <div className="space-y-6 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Profile Information</CardTitle>
            {isEditing ? (
              <div className="flex gap-2">
                 <Button variant="ghost" size="icon" className="text-primary" onClick={() => setIsEditing(false)}>
                    <X className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-primary" onClick={() => setIsEditing(false)}>
                    <Save className="w-5 h-5" />
                </Button>
              </div>
            ) : (
                 <Button variant="ghost" size="icon" className="text-primary" onClick={() => setIsEditing(true)}>
                    <Pencil className="w-5 h-5" />
                </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <ProfileInfoItem icon={User} label="Username" value={profile.username} isEditing={isEditing} onValueChange={handleProfileChange('username')} />
            <ProfileInfoItem icon={Mail} label="Email" value={profile.email} isEditing={isEditing} onValueChange={handleProfileChange('email')} />
            <ProfileInfoItem icon={Phone} label="Phone Number" value={profile.phone} isEditing={isEditing} onValueChange={handleProfileChange('phone')} />
            <ProfileInfoItem icon={MapPin} label="State" value={profile.state} isEditing={isEditing} onValueChange={handleProfileChange('state')} />
            <ProfileInfoItem icon={Globe} label="City" value={profile.city} isEditing={isEditing} onValueChange={handleProfileChange('city')} />
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
