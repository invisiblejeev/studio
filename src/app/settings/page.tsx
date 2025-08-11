import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="bg-muted/20 p-4">
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your application settings here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Notifications</h3>
            <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <Switch id="push-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch id="email-notifications" />
            </div>
        </div>
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Privacy</h3>
            <div className="flex items-center justify-between">
                <Label htmlFor="show-online">Show my online status</Label>
                <Switch id="show-online" defaultChecked />
            </div>
        </div>
        <Button>Save Changes</Button>
      </CardContent>
    </Card>
    </div>
  )
}
