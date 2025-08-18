
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/services/users";
import { Mail, MapPin, Globe, MessageSquare, ShieldBan, LoaderCircle } from "lucide-react";
import { allStates } from "@/lib/states";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getPersonalChatRoomId } from "@/services/chat";
import { useState } from "react";

interface UserProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: UserProfile | null;
  currentUser: UserProfile | null;
}

const ProfileInfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => (
    <div className="flex items-start gap-4">
        <div className="bg-muted rounded-full p-2 mt-1">
            <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium pt-1">{value || "Not provided"}</p>
        </div>
    </div>
);

export function UserProfileDialog({ isOpen, onOpenChange, user, currentUser }: UserProfileDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  if (!user || !currentUser) return null;

  const isOwnProfile = user.uid === currentUser?.uid;

  const handleStartConversation = async () => {
    if (isOwnProfile) return;
    setIsCreatingChat(true);
    try {
        // This function ensures the chat room exists, creating it if it doesn't.
        await getPersonalChatRoomId(currentUser.uid, user.uid);
        onOpenChange(false); // Close the dialog
        router.push(`/chat/user/${user.uid}`);
    } catch (error) {
        console.error("Failed to start conversation:", error);
        toast({
            title: "Error",
            description: "Could not start a conversation. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsCreatingChat(false);
    }
  }

  const handleBlockUser = () => {
    // In a real app, this would trigger a Firestore write to a 'blockedUsers' subcollection.
    // For this prototype, we'll just show a confirmation.
    onOpenChange(false);
    toast({
        title: "User Blocked",
        description: `You will no longer see messages from ${user.username}.`,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center pt-4">
            <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.avatar || "https://placehold.co/100x100.png"} data-ai-hint="person avatar" />
                <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
            </Avatar>
            <DialogTitle className="text-2xl">{user.firstName} {user.lastName}</DialogTitle>
            <DialogDescription>@{user.username}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 px-2">
            <ProfileInfoItem icon={Mail} label="Email" value={user.email} />
            <ProfileInfoItem icon={MapPin} label="State" value={allStates.find(s => s.value === user.state)?.label} />
            <ProfileInfoItem icon={Globe} label="City" value={user.city} />
        </div>
        {!isOwnProfile && (
            <DialogFooter className="grid grid-cols-2 gap-2">
                <Button className="w-full" onClick={handleStartConversation} disabled={isCreatingChat}>
                    {isCreatingChat ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <MessageSquare className="mr-2 h-4 w-4" />
                    )}
                    Send Message
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleBlockUser}>
                    <ShieldBan className="mr-2 h-4 w-4" />
                    Block User
                </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
