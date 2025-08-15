
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { SendHorizonal, ArrowLeft, LoaderCircle } from "lucide-react"
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile } from "@/services/users";
import { sendMessage, getPersonalChatRoomId, Message } from "@/services/chat";
import { getMessages } from "@/lib/chat-client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { UserProfileDialog } from "@/components/UserProfileDialog";

export default function PersonalChatPage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const userId = params.userId;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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
        const otherProfile = await getUserProfile(userId);
        setOtherUser(otherProfile);

        if (profile && otherProfile) {
            const personalRoomId = await getPersonalChatRoomId(user.uid, userId);
            setRoomId(personalRoomId);
        }
        
      } else {
        router.push('/');
      }
    };
    if (userId) {
        fetchUsersAndRoom();
    }
  }, [router, userId]);

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
    if (newMessage.trim() === "" || !currentUser || !roomId) return;
    
    setIsSending(true);

    try {
        await sendMessage(roomId, {
          user: { 
              id: currentUser.uid, 
              name: currentUser.username, 
              avatar: currentUser.avatar || '' 
          },
          text: newMessage,
        });

        setNewMessage("");
    } catch (error) {
        console.error("Error sending message:", error);
        toast({
            title: "Send Failed",
            description: "Could not send your message. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsSending(false);
    }
  }, [newMessage, currentUser, roomId, toast]);
  

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

  const canSendMessage = newMessage.trim() !== "" && !isSending;

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

                       <div className={cn('flex flex-col', 
                        isYou ? 'items-end' : 'items-start',
                        'max-w-xs lg:max-w-md'
                      )}>
                          <div className={cn('rounded-lg shadow-sm', 
                              isYou ? 'bg-primary text-primary-foreground' : 'bg-card',
                              'p-3',
                              isFirstInSequence && !isLastInSequence && isYou ? 'rounded-br-none' :
                              isFirstInSequence && !isLastInSequence && !isYou ? 'rounded-bl-none' :
                              !isFirstInSequence && !isLastInSequence ? 'rounded-br-none rounded-bl-none' :
                              !isFirstInSequence && isLastInSequence && isYou ? 'rounded-tr-none' :
                              !isFirstInSequence && isLastInSequence && !isYou ? 'rounded-tl-none' :
                              'rounded-lg'
                          )}>
                              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          </div>
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
                 {isSending && (
                  <div className="flex items-end gap-2 justify-end">
                      <div className="flex flex-col items-end">
                        <div className={cn('rounded-lg shadow-sm bg-primary text-primary-foreground', 'rounded-br-none p-3' )}>
                            <div className="flex items-center gap-2">
                              <LoaderCircle className="w-4 h-4 animate-spin" />
                              <p className="text-sm">Sending...</p>
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
          <div className="relative">
              <Textarea 
                placeholder={currentUser ? `Message ${otherUser.username}...` : "Loading chat..."}
                className="pr-20 min-h-[48px]"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                maxRows={5}
                disabled={isSending || !currentUser}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Button size="icon" onClick={handleSendMessage} disabled={!canSendMessage}>
                    {isSending ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <SendHorizonal className="w-5 h-5" />}
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
