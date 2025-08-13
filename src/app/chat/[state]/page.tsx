
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { allStates } from "@/lib/states";
import { Paperclip, SendHorizonal, MessageSquare, LoaderCircle, X, Users } from "lucide-react"
import { useRouter, useParams } from 'next/navigation';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile, getUserCountByState } from "@/services/users";
import { sendMessage, Message } from "@/services/chat";
import { getMessages } from "@/lib/chat-client";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { UserProfileDialog } from "@/components/UserProfileDialog";

export default function ChatPage() {
  const router = useRouter();
  const { state } = useParams() as { state: string };
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [memberCount, setMemberCount] = useState(0);

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser() as any;
      if (user) {
        const profile = await getUserProfile(user.uid);
        setCurrentUser(profile);
      } else {
        router.push('/');
      }
    };
    fetchUser();
  }, [router]);
  
  useEffect(() => {
    if (!state) return;

    getUserCountByState(state).then(setMemberCount);

    const unsubscribe = getMessages(state, (newMessages) => {
      setMessages(newMessages);
      setTimeout(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
      }, 0);
    });
    return () => unsubscribe();
  }, [state]);

  const handleShowProfile = async (userId: string) => {
    if (userId === currentUser?.uid) {
        router.push('/profile');
        return;
    }
    const userProfile = await getUserProfile(userId);
    if (userProfile) {
        setSelectedUser(userProfile);
        setIsProfileDialogOpen(true);
    } else {
        toast({ title: "Error", description: "Could not fetch user profile.", variant: "destructive" });
    }
  }


  const handleSendMessage = async () => {
    if ((newMessage.trim() === "" && !imageFile) || !currentUser) return;

    if (imageFile) {
        setIsUploading(true);
    }
    
    let imageUrl: string | undefined = undefined;

    if (imageFile) {
        try {
            imageUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(imageFile);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
            });
        } catch (error) {
            console.error("Error processing image:", error);
            toast({
                title: "Image Upload Failed",
                description: "Could not process the image. Please try again.",
                variant: "destructive"
            });
            setIsUploading(false);
            return;
        }
    }

    await sendMessage(state, {
      user: {
          id: currentUser.uid,
          name: currentUser.username,
          avatar: currentUser.avatar || ''
      },
      text: newMessage,
      imageUrl: imageUrl,
    });
    
    setNewMessage("");
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsUploading(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 5) { // 5MB limit
      toast({
        title: "Image Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }
    
    setImageFile(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
    }
  };
  
  const clearImagePreview = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const currentStateName = allStates.find(s => s.value === state)?.label || "Select State";
  const canSendMessage = (newMessage.trim() !== "" || !!imageFile) && !isUploading;


  return (
    <>
    <div className="flex flex-col h-full bg-background rounded-xl border">
      <header className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">{currentStateName} Community</h2>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Users className="w-4 h-4 mr-1.5" />
                <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/chat/personal')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Personal Chats
          </Button>
      </header>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-1">
              {messages.map((msg, index) => {
                const isYou = msg.user.id === currentUser?.uid;
                const prevMessage = messages[index - 1];
                const nextMessage = messages[index + 1];

                const isFirstInSequence = !prevMessage || prevMessage.user.id !== msg.user.id;
                const isLastInSequence = !nextMessage || nextMessage.user.id !== msg.user.id;

                return (
                  <div key={msg.id} className={cn('flex items-end gap-2', isYou ? 'justify-end' : 'justify-start')}>
                     {!isYou && isLastInSequence && (
                        <button onClick={() => handleShowProfile(msg.user.id)}>
                            <Avatar className={cn('h-8 w-8')}>
                                <AvatarImage src={msg.user.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                                <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </button>
                     )}
                     {!isYou && !isLastInSequence && <div className='w-8 h-8 shrink-0'/>}

                     <div className={cn('flex flex-col max-w-xs lg:max-w-md', isYou ? 'items-end' : 'items-start')}>
                        {!isYou && isFirstInSequence && <p className="text-xs text-muted-foreground mb-1 px-3">{msg.user.name}</p>}
                        <div className={cn('p-3 rounded-lg shadow-sm', 
                            isYou ? 'bg-primary text-primary-foreground' : 'bg-card',
                            !msg.text && msg.imageUrl ? 'p-1' : 'p-3',
                             isFirstInSequence && !isLastInSequence && isYou ? 'rounded-br-none' :
                             isFirstInSequence && !isLastInSequence && !isYou ? 'rounded-bl-none' :
                             !isFirstInSequence && !isLastInSequence ? 'rounded-br-none rounded-bl-none' :
                             !isFirstInSequence && isLastInSequence && isYou ? 'rounded-tr-none' :
                             !isFirstInSequence && isLastInSequence && !isYou ? 'rounded-tl-none' :
                             'rounded-lg'
                        )}>
                            {msg.imageUrl && (
                               <Link href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                  <div className="relative aspect-square rounded-md overflow-hidden max-w-[300px]">
                                    <Image src={msg.imageUrl} alt="Chat image" fill className="object-cover" />
                                  </div>
                               </Link>
                            )}
                            {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                        </div>
                        {isLastInSequence && <p className="text-xs text-muted-foreground mt-1 px-3">{msg.time}</p>}
                     </div>
                     {isYou && isLastInSequence && (
                         <button onClick={() => router.push('/profile')}>
                             <Avatar className={cn('h-8 w-8')}>
                                <AvatarImage src={currentUser?.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                                <AvatarFallback>{currentUser?.username.charAt(0)}</AvatarFallback>
                             </Avatar>
                         </button>
                     )}
                     {isYou && !isLastInSequence && <div className='w-8 h-8 shrink-0'/>}

                  </div>
                )
              })}
               {isUploading && (
                <div className="flex items-end gap-2 justify-end">
                    <div className="flex flex-col items-end">
                      <div className={cn('rounded-lg shadow-sm bg-primary text-primary-foreground', 'rounded-br-none p-1' )}>
                          <div className="flex items-center justify-center h-24 w-24 bg-primary-foreground/20 rounded-md">
                             <LoaderCircle className="w-6 h-6 animate-spin" />
                          </div>
                      </div>
                    </div>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser?.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                        <AvatarFallback>{currentUser?.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            )}
          </div>
      </ScrollArea>
      <div className="p-4 border-t bg-card rounded-b-xl">
          {imagePreview && (
              <div className="mb-2 relative w-24 h-24">
                  <Image src={imagePreview} alt="Image preview" fill className="rounded-md object-cover" />
                  <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={clearImagePreview}>
                      <X className="h-4 w-4" />
                  </Button>
              </div>
          )}
          <div className="relative">
              <Textarea 
                placeholder="Type your message..." 
                className="pr-28 min-h-[48px]"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                maxRows={5}
                disabled={isUploading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                       <Paperclip className="w-5 h-5" />
                   </Button>
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                  <Button size="icon" onClick={handleSendMessage} disabled={!canSendMessage}>
                      {isUploading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <SendHorizonal className="w-5 h-5" />}
                  </Button>
              </div>
          </div>
      </div>
    </div>
    <UserProfileDialog 
        isOpen={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
        user={selectedUser}
        currentUser={currentUser}
    />
    </>
  );
}
