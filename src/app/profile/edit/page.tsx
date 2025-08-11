"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditProfilePage() {
  return (
    <div className="p-4 bg-muted/20 min-h-screen">
      <Card>
        <CardHeader className="relative">
            <Link href="/profile" className="absolute left-4 top-1/2 -translate-y-1/2">
                <Button variant="ghost" size="icon">
                    <ArrowLeft />
                </Button>
            </Link>
          <CardTitle className="text-center">Edit Profile</CardTitle>
          <CardDescription className="text-center">Update your profile information below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john.doe@email.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" defaultValue="California" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" defaultValue="San Francisco" />
                </div>
            </div>
            <Button type="submit" className="w-full">Save Changes</Button>
            <Link href="/profile" passHref>
                <Button variant="outline" className="w-full">Cancel</Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
