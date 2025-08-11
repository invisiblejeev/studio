
"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast";
import { IndianRupee, Eye, EyeOff, CheckCircle2, XCircle, LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { signUp } from "@/services/auth";
import { isIdentifierTaken, createUserProfile } from "@/services/users";
import { useDebounce } from "use-debounce";

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [debouncedUsername] = useDebounce(formData.username, 500);

  const checkUsername = useCallback(async (username: string) => {
    if (username.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const taken = await isIdentifierTaken('username', username);
      setUsernameStatus(taken ? "taken" : "available");
    } catch (error) {
      setUsernameStatus("idle"); // Reset on error
    }
  }, []);

  useEffect(() => {
    if (debouncedUsername) {
      checkUsername(debouncedUsername);
    } else {
      setUsernameStatus("idle");
    }
  }, [debouncedUsername, checkUsername]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: value}));
    if (id === "username") {
      setUsernameStatus("checking");
    }
  }

  const handleSignUp = async () => {
    setIsLoading(true);

    if (!formData.firstName || !formData.lastName || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
        toast({
            title: "Missing fields",
            description: "Please fill out all fields.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }
    
    if (formData.password !== formData.confirmPassword) {
        toast({
            title: "Passwords do not match",
            description: "Please ensure your passwords match.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    if (usernameStatus !== 'available') {
      toast({
        title: "Username unavailable",
        description: "Please choose a different username.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
        const emailTaken = await isIdentifierTaken('email', formData.email);
        if (emailTaken) {
            toast({
                title: "Email In Use",
                description: "This email is already registered. Please log in.",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        const userCredential = await signUp(formData.email, formData.password);
        const user = userCredential;

        const profileData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
            email: formData.email,
        };

        await createUserProfile(user.uid, profileData);

        toast({
            title: "Signup Successful!",
            description: "Your account has been created.",
        });
        router.push('/chat');

    } catch (error: any) {
       toast({
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const renderUsernameStatus = () => {
    switch (usernameStatus) {
      case "checking":
        return <LoaderCircle className="h-4 w-4 animate-spin" />;
      case "available":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "taken":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
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
                <Input id="firstName" placeholder="John" required onChange={handleChange} value={formData.firstName} disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" required onChange={handleChange} value={formData.lastName} disabled={isLoading} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  required
                  onChange={handleChange} 
                  value={formData.username}
                  disabled={isLoading}
                  className="pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {renderUsernameStatus()}
                </div>
              </div>
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
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  onChange={handleChange} 
                  value={formData.password} 
                  disabled={isLoading} 
                  className="pr-10"
                />
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
             <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
               <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  required 
                  onChange={handleChange} 
                  value={formData.confirmPassword} 
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" onClick={handleSignUp} disabled={isLoading || usernameStatus === 'checking' || usernameStatus === 'taken'}>
              {isLoading ? 'Signing Up...' : 'Sign Up'}
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

    