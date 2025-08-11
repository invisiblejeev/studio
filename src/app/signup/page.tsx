
"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast";
import { IndianRupee, CheckCircle2, XCircle, LoaderCircle, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createUserProfile, isIdentifierTaken } from "@/services/users";
import { useDebounce } from "use-debounce";
import { signUp } from "@/services/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allStates } from "@/lib/states";

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    state: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [debouncedUsername] = useDebounce(formData.username, 500);

  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [debouncedEmail] = useDebounce(formData.email, 500);

  const checkIdentifier = useCallback(async (field: 'username' | 'email', value: string, setStatus: (status: "idle" | "checking" | "available" | "taken") => void) => {
    if (value.length < 3) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    try {
      const taken = await isIdentifierTaken(field, value);
      setStatus(taken ? "taken" : "available");
    } catch (error) {
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    if (debouncedUsername) {
      checkIdentifier('username', debouncedUsername, setUsernameStatus);
    } else {
      setUsernameStatus("idle");
    }
  }, [debouncedUsername, checkIdentifier]);
  
  useEffect(() => {
    if (debouncedEmail) {
      checkIdentifier('email', debouncedEmail, setEmailStatus);
    } else {
      setEmailStatus("idle");
    }
  }, [debouncedEmail, checkIdentifier]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({...prev, [id]: value}));
    if (id === "username") {
      setUsernameStatus("checking");
    }
    if (id === "email") {
      setEmailStatus("checking");
    }
  }

  const handleSignUp = async () => {
    setIsLoading(true);

    if (!formData.firstName || !formData.lastName || !formData.username || !formData.email || !formData.password || !formData.phone || !formData.city || !formData.state) {
        toast({
            title: "Missing fields",
            description: "Please fill out all fields.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }
    
    if (usernameStatus !== 'available' || emailStatus !== 'available') {
      toast({
        title: "Username or Email unavailable",
        description: "Please choose a different username and make sure the email is not already registered.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    try {
        const user = await signUp(formData.email, formData.password);

        const profileData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
            email: formData.email,
            phone: formData.phone,
            state: formData.state,
            city: formData.city,
            avatar: `https://placehold.co/100x100.png`
        };

        await createUserProfile(user.uid, profileData);

        toast({
            title: "Signup Successful!",
            description: "Your account has been created. You can now login.",
        });
        router.push('/');

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
  
  const renderStatusIcon = (status: "idle" | "checking" | "available" | "taken") => {
    switch (status) {
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
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
             <div className="bg-primary text-primary-foreground rounded-full p-3">
              <IndianRupee className="h-8 w-8" />
             </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Enter your details below to create your account.
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
                    {renderStatusIcon(usernameStatus)}
                </div>
              </div>
            </div>
             <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="123-456-7890" required onChange={handleChange} value={formData.phone} disabled={isLoading} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="San Francisco" required onChange={handleChange} value={formData.city} disabled={isLoading} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Select onValueChange={(value) => setFormData(prev => ({...prev, state: value}))} value={formData.state} disabled={isLoading}>
                        <SelectTrigger id="state">
                            <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                            {allStates.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
               <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="pr-10"
                />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {renderStatusIcon(emailStatus)}
                </div>
              </div>
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
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" onClick={handleSignUp} disabled={isLoading || usernameStatus !== 'available' || emailStatus !== 'available'}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
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
