
"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast";
import { IndianRupee } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "@/services/auth";
import { isIdentifierTaken, createUserProfile } from "@/services/users";

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: value}));
  }

  const handleSignUp = async () => {
    if (!formData.firstName || !formData.lastName || !formData.username || !formData.email || !formData.password) {
        toast({
            title: "Missing fields",
            description: "Please fill out all fields.",
            variant: "destructive",
        });
        return;
    }
    
    const usernameTaken = await isIdentifierTaken('username', formData.username);
    if (usernameTaken) {
      toast({
        title: "Username already taken",
        description: "Please choose a different username.",
        variant: "destructive",
      });
      return;
    }

    const emailTaken = await isIdentifierTaken('email', formData.email);
    if (emailTaken) {
      toast({
        title: "Email already in use",
        description: "This email is already associated with an account. Please log in or use a different email.",
        variant: "destructive",
      });
      return;
    }

    try {
      const user = await signUp(formData.email, formData.password);
      if (user) {
        await createUserProfile(user.uid, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
        });
        toast({
          title: "Signup Successful!",
          description: "You have successfully created an account.",
        });
        router.push('/chat');
      }
    } catch (error: any) {
       toast({
        title: "Signup Failed",
        description: "Could not create an account. The email might be invalid or the password too weak.",
        variant: "destructive",
      });
    }
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
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" required onChange={handleChange} value={formData.firstName} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" required onChange={handleChange} value={formData.lastName} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                required
                onChange={handleChange} 
                value={formData.username}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                onChange={handleChange} 
                value={formData.email}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required onChange={handleChange} value={formData.password} />
            </div>
            
            <Button type="submit" className="w-full" onClick={handleSignUp}>
              Sign Up
            </Button>
            
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
