
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  const handleSave = () => {
    // In a real app, you would save these settings to a user's profile in the database.
    // For this prototype, we'll just show a confirmation toast.
    toast({
      title: "Settings Saved",
      description: "Your notification and privacy settings have been updated.",
    });
  };

  return (
    <div className="bg-muted/40 p-4 md:p-6 h-full">
        <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage your application settings here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Notifications</h3>
                <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications" className="cursor-pointer">Push Notifications</Label>
                    <Switch 
                    id="push-notifications" 
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications" className="cursor-pointer">Email Notifications</Label>
                    <Switch 
                    id="email-notifications" 
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    />
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Privacy</h3>
                <div className="flex items-center justify-between">
                    <Label htmlFor="show-online" className="cursor-pointer">Show my online status</Label>
                    <Switch 
                    id="show-online" 
                    checked={showOnlineStatus}
                    onCheckedChange={setShowOnlineStatus}
                    />
                </div>
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
        </CardContent>
        </Card>
    </div>
  )
}
