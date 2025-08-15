
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, SendHorizonal, ArrowLeft, LoaderCircle, X, Trash2 } from "lucide-react"
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile } from "@/services/users";
import { sendMessage, getPersonalChatRoomId, Message, deleteMessage } from "@/services/chat";
import { getMessages } from "@/lib/chat-client";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

export default function PersonalChatPage() {
  const router = useRouter();
  const { userId: otherUserId } = useParams() as { userId: string };
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, []);

  useEffect(() => {
    const fetchUsersAndRoom = async () => {
      const user = await getCurrentUser() as any;
      if (user) {
        const profile = await getUserProfile(user.uid);
        setCurrentUser(profile);
        const otherProfile = await getUserProfile(otherUserId);
        setOtherUser(otherProfile);

        if (profile && otherProfile) {
            const personalRoomId = await getPersonalChatRoomId(user.uid, otherUserId);
            setRoomId(personalRoomId);
        }
        
      } else {
        router.push('/');
      }
    };
    if (otherUserId) {
        fetchUsersAndRoom();
    }
  }, [router, otherUserId]);

  useEffect(() => {
    if (!roomId || !currentUser) return;
    const unsubscribe = getMessages(roomId, (newMessages) => {
      setMessages(newMessages);
    });
    return () => unsubscribe();
  }, [roomId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);


  const handleSendMessage = useCallback(async () => {
    if ((newMessage.trim() === "" && !imageFile) || !currentUser || !roomId) return;
    
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
            console.error("Error converting image to Data URI:", error);
            toast({
                title: "Image Upload Failed",
                description: "Could not process the image. Please try again.",
                variant: "destructive"
            });
            setIsUploading(false);
            return;
        }
    }
    
    sendMessage(roomId, {
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
  }, [newMessage, imageFile, currentUser, roomId, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 1024 * 1024) { // 1MB limit
        toast({
          title: "Image Too Large",
          description: "Please select an image smaller than 1MB.",
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

  const handleDelete = async (messageId: string) => {
    if (!roomId) return;
    try {
      await deleteMessage(roomId, messageId);
      toast({
        title: 'Message Deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete message.',
        variant: 'destructive',
      });
    }
  };

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

  if (!otherUser || !currentUser) {
      return (
         <div className="flex h-screen items-center justify-center">
              <LoaderCircle className="w-8 h-8 animate-spin" />
              <p className="ml-2">Loading Chat...</p>
          </div>
      )
  }

  const canSendMessage = (newMessage.trim() !== "" || !!imageFile) && !isUploading;

  return (
    <>
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-start p-4 border-b gap-4 shrink-0 bg-background">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div onClick={() => handleShowProfile(otherUser.uid)} className="flex items-center gap-3 cursor-pointer">
            <Avatar>
                <AvatarImage src={otherUser.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                <AvatarFallback>{otherUser.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">{otherUser.username}</h2>
          </div>
      </header>
       <div className="flex-1 overflow-y-auto bg-muted/20">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-4 space-y-1">
                {messages.map((msg, index) => {
                  const isYou = msg.user.id === currentUser?.uid;
                  const prevMessage = messages[index - 1];
                  const nextMessage = messages[index + 1];

                  const isFirstInSequence = !prevMessage || prevMessage.user.id !== msg.user.id;
                  const isLastInSequence = !nextMessage || nextMessage.user.id !== msg.user.id;

                  return (
                    <div key={msg.id} className={cn('flex items-end gap-2', isYou ? 'justify-end' : 'justify-start')}>
                      {!isYou && isLastInSequence && (
                          <Avatar className={cn('h-8 w-8 cursor-pointer')} onClick={() => handleShowProfile(msg.user.id)}>
                            <AvatarImage src={msg.user.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                            <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                      )}
                      {!isYou && !isLastInSequence && <div className='w-8 h-8 shrink-0'/>}

                       <div className={cn('flex flex-col max-w-xs lg:max-w-md', isYou ? 'items-end' : 'items-start')}>
                           <ContextMenu>
                            <ContextMenuTrigger>
                              <div className={cn('rounded-lg shadow-sm', 
                                  isYou ? 'bg-primary text-primary-foreground' : 'bg-card',
                                  msg.isDeleted ? 'bg-muted text-muted-foreground italic' : '',
                                   !msg.text && msg.imageUrl ? 'p-1 bg-transparent shadow-none' : 'p-3',
                                  isFirstInSequence && !isLastInSequence && isYou ? 'rounded-br-none' :
                                  isFirstInSequence && !isLastInSequence && !isYou ? 'rounded-bl-none' :
                                  !isFirstInSequence && !isLastInSequence ? 'rounded-br-none rounded-bl-none' :
                                  !isFirstInSequence && isLastInSequence && isYou ? 'rounded-tr-none' :
                                  !isFirstInSequence && isLastInSequence && !isYou ? 'rounded-tl-none' :
                                  'rounded-lg'
                              )}>
                                  {msg.imageUrl && !msg.isDeleted && (
                                    <Link href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                      <div className="relative aspect-video rounded-md overflow-hidden">
                                        <Image src={msg.imageUrl} alt="Chat image" fill className="object-cover" />
                                      </div>
                                    </Link>
                                  )}
                                  {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              {isYou && !msg.isDeleted && (
                                <ContextMenuItem onClick={() => handleDelete(msg.id)} className="text-destructive">
                                   <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </ContextMenuItem>
                              )}
                            </ContextMenuContent>
                          </ContextMenu>
                          {isLastInSequence && <p className="text-xs text-muted-foreground mt-1 px-3">{msg.time}</p>}
                      </div>


                      {isYou && isLastInSequence && (
                           <Avatar className={cn('h-8 w-8 cursor-pointer')} onClick={() => router.push('/profile')}>
                              <AvatarImage src={currentUser?.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                              <AvatarFallback>{currentUser?.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                      )}
                        {isYou && !isLastInSequence && <div className='w-8 h-8 shrink-0'/>}
                    </div>
                  )
                })}
                {isUploading && (
                  <div className="flex items-end gap-2 justify-end">
                      <div className="flex flex-col items-end">
                        <div className={cn('rounded-lg shadow-sm bg-primary text-primary-foreground', 'rounded-br-none p-1')}>
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
      </div>
      <div className="p-4 border-t bg-background shrink-0">
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
                placeholder={currentUser ? `Message ${otherUser.username}...` : "Loading chat..."}
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
                disabled={isUploading || !currentUser}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={isUploading || !currentUser}><Paperclip className="w-5 h-5" /></Button>
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading || !currentUser} />
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
