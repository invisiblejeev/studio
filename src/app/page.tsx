
"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IndianRupee } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { signIn } from "@/services/auth"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loginId, setLoginId] = useState("user@example.com");
  const [password, setPassword] = useState("password");

  const handleLogin = async () => {
    try {
      await signIn(loginId, password);
      router.push('/chat');
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
             <div className="bg-primary text-primary-foreground rounded-full p-3">
              <IndianRupee className="h-8 w-8" />
             </div>
          </div>
          <CardTitle className="text-2xl font-bold">Indian Community Chat</CardTitle>
          <CardDescription>
            Enter your email, phone, or username to login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="loginId">Email, Phone, or Username</Label>
              <Input
                id="loginId"
                type="text"
                placeholder="Your email, phone, or username"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
              <Button type="submit" className="w-full" onClick={handleLogin}>
                Login
              </Button>
            <Button variant="outline" className="w-full">
              Login with Phone
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
