
"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IndianRupee } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { signIn, getCurrentUser } from "@/services/auth"
import { useToast } from "@/hooks/use-toast"
import { getUserProfile } from "@/services/users"

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Start as true to check for existing session

  useEffect(() => {
     const checkUser = async () => {
         try {
            const user = await getCurrentUser();
            if (user) {
                const profile = await getUserProfile(user.uid);
                if (profile) {
                   router.push('/chat');
                } else {
                   // User is authenticated but has no profile, might happen in edge cases
                   // Or they should be redirected to signup completion
                   setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
         } catch(e) {
            setIsLoading(false);
         }
     }
     checkUser();
  }, [router]);


  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: "Missing Fields", description: "Please enter both email and password.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const user = await signIn(email, password);
      const profile = await getUserProfile(user.uid);
      if (profile) {
          router.push('/chat');
      } else {
          toast({
            title: "Login Failed",
            description: "User profile not found. Please sign up again.",
            variant: "destructive"
          });
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <p>Loading...</p>
        </div>
      )
  }

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
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
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
