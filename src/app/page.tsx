
"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IndianRupee } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"; // Import auth directly
import { sendSignInLink, isSignInWithEmailLink, signInWithEmailLink, getCurrentUser } from "@/services/auth"
import { useToast } from "@/hooks/use-toast"
import { getUserProfile } from "@/services/users"

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkSent, setIsLinkSent] = useState(false);

  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      // Ensure auth is initialized and function exists
      if (auth && isSignInWithEmailLink && isSignInWithEmailLink(auth, window.location.href)) {
        let emailFromStore = window.localStorage.getItem('emailForSignIn');
        if (!emailFromStore) {
          // If the email is not in local storage, prompt the user for it.
          emailFromStore = window.prompt('Please provide your email for confirmation');
          if (!emailFromStore) {
            toast({ title: "Login Failed", description: "Email is required to complete sign-in.", variant: "destructive" });
            return;
          }
        }
        
        setIsLoading(true);
        try {
          const user = await signInWithEmailLink(emailFromStore, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
          
          if(user) {
             const profile = await getUserProfile(user.uid);
             if (profile) {
                router.push('/chat');
             } else {
                // First time user, redirect to complete profile (which is signup page for now)
                router.push(`/signup?email=${encodeURIComponent(emailFromStore)}`);
             }
          }
        } catch (error: any) {
          toast({
            title: "Login Failed",
            description: "The sign-in link is invalid or has expired.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      } else {
         const checkUser = async () => {
             const user = await getCurrentUser();
             if (user) {
                 router.push('/chat');
             }
         }
         checkUser();
      }
    };
    // Wait for auth to be initialized before running the effect
    const unsubscribe = auth.onAuthStateChanged(user => {
        handleEmailLinkSignIn();
        unsubscribe(); // Unsubscribe to prevent multiple executions
    });
  }, [router, toast]);


  const handleLogin = async () => {
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await sendSignInLink(email);
      window.localStorage.setItem('emailForSignIn', email);
      setIsLinkSent(true);
      toast({
        title: "Check Your Email",
        description: `A sign-in link has been sent to ${email}.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Send Link",
        description: "Could not send sign-in link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
          <Card className="mx-auto w-full max-w-sm text-center">
             <CardContent className="p-6">
                <p>Signing you in... Please wait.</p>
             </CardContent>
          </Card>
       </div>
    );
  }
  
  if (isLinkSent) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
          <Card className="mx-auto w-full max-w-sm text-center">
            <CardHeader>
                <CardTitle>Email Sent</CardTitle>
            </CardHeader>
             <CardContent className="p-6 space-y-4">
                <p>A sign-in link has been sent to <strong>{email}</strong>.</p>
                <p>Please check your inbox and click the link to log in.</p>
             </CardContent>
          </Card>
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
            Sign in with a secure link sent to your email.
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
            <Button type="submit" className="w-full" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? 'Sending Link...' : 'Send Magic Link'}
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
