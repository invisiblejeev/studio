
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { allStates } from "@/lib/states";
import { SendHorizonal, MessageSquare, LoaderCircle, Users } from "lucide-react"
import { useRouter } from 'next/navigation';
import Link from "next/link";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile, getUserCountByState } from "@/services/users";
import { sendMessage, Message, ensurePublicChatRoomExists, updateMessage, deleteMessage } from "@/services/chat";
import { getMessages } from "@/lib/chat-client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { MessageActionsDialog } from "@/components/MessageActionsDialog";


export default function ChatPage({ params }: { params: { state: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { state } = React.use(params);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const [activeMessage, setActiveMessage] = useState<Message | null>(null);


  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, []);

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
    if (!state || !currentUser) return;

    // Proactively ensure the public chat room document exists.
    ensurePublicChatRoomExists(state);
    
    getUserCountByState(state).then(setMemberCount);

    const unsubscribe = getMessages(state, (newMessages) => {
      setMessages(newMessages);
    });
    
    // Listen for total unread count
    if (currentUser.uid) {
        const personalChatsRef = collection(db, `users/${currentUser.uid}/personalChats`);
        const unreadQuery = query(personalChatsRef, where('unreadCount', '>', 0));
        const unsubscribeUnread = onSnapshot(unreadQuery, (snapshot) => {
            let total = 0;
            snapshot.docs.forEach(doc => {
                total += doc.data().unreadCount || 0;
            });
            setTotalUnread(total);
        });

        return () => {
            unsubscribe();
            unsubscribeUnread();
        };
    }


    return () => {
        unsubscribe();
    };
  }, [state, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);


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


  const handleSendMessage = useCallback(async () => {
    if (newMessage.trim() === "" || !currentUser) return;

    setIsSending(true);
    
    try {
        await sendMessage(state, {
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
            description: "Could not send the message. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsSending(false);
    }
  }, [newMessage, currentUser, state, toast]);

  const handleSaveEdit = async (messageId: string, newText: string) => {
    if (!currentUser) return;
    try {
        await updateMessage(state, messageId, newText);
        toast({ title: "Message Updated" });
    } catch (error) {
        toast({ title: "Error", description: "Could not update message.", variant: "destructive"});
        console.error(error);
    } finally {
        setActiveMessage(null);
    }
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser) return;
    try {
        await deleteMessage(state, messageId);
        toast({ title: "Message Deleted" });
    } catch (error) {
        toast({ title: "Error", description: "Could not delete message.", variant: "destructive"});
        console.error(error);
    } finally {
        setActiveMessage(null);
    }
  }

  const isMessageEditable = (timestamp: any) => {
    if (!timestamp?.toDate) return false;
    const messageDate = timestamp.toDate();
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  }

  const currentStateName = allStates.find(s => s.value === state)?.label || "Select State";
  const canSendMessage = !!currentUser && newMessage.trim() !== "" && !isSending;


  return (
    <>
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b shrink-0 bg-background">
          <div>
            <h2 className="text-xl font-bold">{currentStateName} Community</h2>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Users className="w-4 h-4 mr-1.5" />
                <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
            </div>
          </div>
          <Button variant="outline" asChild className="relative">
            <Link href="/chat/personal">
              <MessageSquare className="w-4 h-4 mr-2" />
              Personal Chats
              {totalUnread > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center p-0">{totalUnread}</Badge>
              )}
            </Link>
          </Button>
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
                  
                  const canEditOrDelete = isYou && !msg.isDeleted && isMessageEditable(msg.timestamp);

                  return (
                    <div key={msg.id} className={cn('flex items-end gap-2 group', isYou ? 'justify-end' : 'justify-start')}>
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
                          {!isYou && isFirstInSequence && (
                              <p className="text-xs text-muted-foreground mb-1 px-3 cursor-pointer hover:underline" onClick={() => handleShowProfile(msg.user.id)}>{msg.user.name}</p>
                          )}
                          
                          <div 
                            className={cn('p-3 rounded-lg shadow-sm', 
                              isYou ? 'bg-primary text-primary-foreground' : 'bg-card',
                              isFirstInSequence && !isLastInSequence && isYou ? 'rounded-br-none' :
                              isFirstInSequence && !isLastInSequence && !isYou ? 'rounded-bl-none' :
                              !isFirstInSequence && !isLastInSequence ? 'rounded-br-none rounded-bl-none' :
                              !isFirstInSequence && isLastInSequence && isYou ? 'rounded-tr-none' :
                              !isFirstInSequence && isLastInSequence && !isYou ? 'rounded-tl-none' :
                              'rounded-lg',
                              canEditOrDelete && 'cursor-pointer'
                            )}
                            onClick={() => canEditOrDelete && setActiveMessage(msg)}
                          >
                            <p className={cn("text-sm whitespace-pre-wrap", msg.isDeleted && "italic text-muted-foreground")}>{msg.text}</p>
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
                placeholder={currentUser ? "Type your message..." : "Loading chat..."}
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
    {activeMessage && (
      <MessageActionsDialog
        message={activeMessage}
        isOpen={!!activeMessage}
        onOpenChange={(isOpen) => !isOpen && setActiveMessage(null)}
        onEdit={handleSaveEdit}
        onDelete={handleDeleteMessage}
      />
    )}
    </>
  );
}
