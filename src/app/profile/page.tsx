
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allStates } from "@/lib/states";
import { Bell, ChevronRight, Globe, LogOut, Mail, MapPin, Phone, Shield, User, Pencil, X, Save, Upload, Trash2, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, logOut, deleteCurrentUser } from "@/services/auth";
import { getUserProfile, updateUserProfile, isIdentifierTaken, UserProfile, deleteUserProfile } from "@/services/users";
import { uploadProfilePicture } from "@/services/storage";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";


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

const SettingsItem = ({ icon: Icon, label, href, isDestructive = false, onClick }: { icon: React.ElementType, label: string, href?: string, isDestructive?: boolean, onClick?: () => void }) => {
    const content = (
      <div className="flex items-center justify-between py-3" onClick={onClick}>
          <div className="flex items-center gap-4">
              <Icon className={`w-5 h-5 ${isDestructive ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className={`font-medium ${isDestructive ? 'text-destructive' : ''}`}>{label}</span>
          </div>
          {!isDestructive && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
      </div>
    );

    return href ? <Link href={href}>{content}</Link> : <div className="cursor-pointer">{content}</div>;
};


export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);


  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
        const user = await getCurrentUser() as any;
        if(user) {
            const userProfile = await getUserProfile(user.uid);
            setProfile(userProfile);
            setInitialProfile(userProfile);
        } else {
            router.push('/');
        }
    };
    fetchUser();
  }, [router]);

  const handleProfileChange = (field: keyof UserProfile) => (value: string) => {
    if (profile) {
        setProfile(prev => ({ ...prev!, [field]: value }));
    }
  }

  const handleSave = async () => {
    if (!profile || !initialProfile) return;

    if (profile.username !== initialProfile.username && await isIdentifierTaken('username', profile.username)) {
        toast({
            title: "Username taken",
            description: "This username is already in use. Please choose another one.",
            variant: "destructive"
        });
        return;
    }

    try {
        await updateUserProfile(profile.uid, profile);
        setInitialProfile(profile);
        setIsEditing(false);
        toast({
            title: "Profile Saved",
            description: "Your profile information has been updated successfully.",
        });
    } catch(error: any) {
        toast({
            title: "Error",
            description: "Failed to update profile.",
            variant: "destructive"
        });
    }
  }

  const handleCancel = () => {
    setProfile(initialProfile);
    setIsEditing(false);
  }

  const handleLogout = async () => {
    await logOut();
    router.push('/');
  }
  
  const handleDeleteAccount = async () => {
      if (!profile) return;
      
      try {
        await deleteCurrentUser();
        await deleteUserProfile(profile.uid);

        toast({
            title: "Account Deleted",
            description: "Your account has been successfully and permanently deleted.",
        });
        setIsDeleteDialogOpen(false);
        await logOut(); // This will handle redirecting the user
      } catch (error: any) {
          console.error("Error deleting account: ", error);
          toast({
              title: "Deletion Failed",
              description: "Could not delete account. You may need to sign in again for this operation. " + error.message,
              variant: "destructive",
          })
      }
  }
  
  const handleDeleteImage = async () => {
      if (!profile || !profile.avatar) {
          toast({
              title: "No Image to Delete",
              description: "You do not have a profile picture to delete.",
          });
          return;
      }

      try {
          await updateUserProfile(profile.uid, { avatar: "" });
          const updatedProfile = { ...profile, avatar: "" };
          setProfile(updatedProfile);
          setInitialProfile(updatedProfile);
          setIsImageDialogOpen(false);
          toast({
              title: "Profile Picture Deleted",
              description: "Your profile picture has been removed.",
          });
      } catch (error) {
          toast({
              title: "Error",
              description: "Failed to delete profile picture.",
              variant: "destructive"
          });
      }
  }
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setIsUploading(true);
    try {
        const downloadURL = await uploadProfilePicture(profile.uid, file);
        await updateUserProfile(profile.uid, { avatar: downloadURL });

        const updatedProfile = { ...profile, avatar: downloadURL };
        setProfile(updatedProfile);
        setInitialProfile(updatedProfile);

        toast({
            title: "Success",
            description: "Profile picture uploaded successfully.",
        });
    } catch (error) {
        console.error("Failed to upload image: ", error);
        toast({
            title: "Upload Failed",
            description: "Could not upload the new profile picture. Please check the file type or try again later.",
            variant: "destructive"
        });
    } finally {
        setIsUploading(false);
        setIsImageDialogOpen(false);
        // Reset file input value
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };


  if (!profile) {
      return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
      );
  }

  return (
    <div className="bg-muted/20 min-h-screen pb-24">
       <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <div className="flex flex-col items-center text-center py-6 bg-background">
            <DialogTrigger asChild>
                <Avatar className="h-24 w-24 mb-4 bg-primary/10 cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarImage src={profile.avatar || "https://placehold.co/100x100.png"} data-ai-hint="person avatar" />
                    <AvatarFallback>{profile.firstName.charAt(0)}{profile.lastName.charAt(0)}</AvatarFallback>
                </Avatar>
            </DialogTrigger>
            <h1 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
        </div>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center my-4">
              <Avatar className="h-48 w-48">
                <AvatarImage src={profile.avatar || "https://images.unsplash.com/photo-1621327708553-f6d70636f961?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxubyUyMGRwfGVufDB8fHx8MTc1NDkyOTc1MXww&ixlib=rb-4.1.0&q=80&w=1080"} data-ai-hint="person avatar" />
                <AvatarFallback>{profile.firstName.charAt(0)}{profile.lastName.charAt(0)}</AvatarFallback>
              </Avatar>
          </div>
          <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <LoaderCircle className="mr-2 animate-spin" /> : <Upload className="mr-2" />}
                {isUploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <Button variant="destructive" onClick={handleDeleteImage} disabled={!profile.avatar || isUploading}><Trash2 className="mr-2" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <div className="space-y-6 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Profile Information</CardTitle>
            {isEditing ? (
              <div className="flex gap-2">
                 <Button variant="ghost" size="icon" className="text-primary" onClick={handleCancel}>
                    <X className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-primary" onClick={handleSave}>
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
            <ProfileInfoItem icon={User} label="First Name" value={profile.firstName} isEditing={isEditing} onValueChange={handleProfileChange('firstName')} />
            <ProfileInfoItem icon={User} label="Last Name" value={profile.lastName} isEditing={isEditing} onValueChange={handleProfileChange('lastName')} />
            <ProfileInfoItem icon={User} label="Username" value={profile.username} isEditing={isEditing} onValueChange={handleProfileChange('username')} />
            <ProfileInfoItem icon={Mail} label="Email" value={profile.email} isEditing={false} onValueChange={() => {}} />
            <ProfileInfoItem icon={Phone} label="Phone Number" value={profile.phone || ''} isEditing={isEditing} onValueChange={handleProfileChange('phone')} />
            <ProfileInfoItem icon={MapPin} label="State" value={profile.state || ''} isEditing={isEditing} onValueChange={handleProfileChange('state')} />
            <ProfileInfoItem icon={Globe} label="City" value={profile.city || ''} isEditing={isEditing} onValueChange={handleProfileChange('city')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
             <SettingsItem icon={Bell} label="Notifications" href="/settings" />
             <SettingsItem icon={Shield} label="Privacy & Security" href="/settings" />
             <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                    <div>
                        <SettingsItem icon={Trash2} label="Delete Account" isDestructive={true} />
                    </div>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDeleteAccount}>Confirm Delete</Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>
             <SettingsItem icon={LogOut} label="Logout" isDestructive={true} onClick={handleLogout} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

