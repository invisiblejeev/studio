
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { allStates } from "@/lib/states";
import { Paperclip, SendHorizonal, MessageSquare, LoaderCircle } from "lucide-react"
import { useRouter, useParams } from 'next/navigation';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile } from "@/services/users";
import { getMessages, sendMessage, Message } from "@/services/chat";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const state = params.state as string;
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const unsubscribe = getMessages(state, (newMessages) => {
      setMessages(newMessages);
      setTimeout(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
      }, 0);
    });
    return () => unsubscribe();
  }, [state]);


  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !currentUser) return;
    
    await sendMessage(state, {
      user: { 
          id: currentUser.uid, 
          name: currentUser.username, 
          avatar: currentUser.avatar || ''
      },
      text: newMessage,
    });
    setNewMessage("");
  };

  const handleImageSend = async (file: File) => {
      if (!file || !currentUser) return;
      setIsUploading(true);
      try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
              const dataUrl = reader.result as string;
              await sendMessage(state, {
                 user: { 
                    id: currentUser.uid, 
                    name: currentUser.username, 
                    avatar: currentUser.avatar || ''
                 },
                 imageUrl: dataUrl,
              });
              setIsUploading(false);
          }
          reader.onerror = (error) => {
              throw error;
          }
      } catch (error) {
          console.error("Error uploading image:", error);
          toast({
              title: "Upload Failed",
              description: "Could not upload the image. Please try again.",
              variant: "destructive"
          });
          setIsUploading(false);
      } finally {
          if (fileInputRef.current) {
              fileInputRef.current.value = "";
          }
      }
  };

  const currentStateName = allStates.find(s => s.value === state)?.label || "Select State";

  return (
    <div className="flex flex-col h-screen bg-background rounded-xl border">
      <header className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">{currentStateName} Community</h2>
          <Button variant="outline" onClick={() => router.push('/chat/personal')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Personal Chats
          </Button>
      </header>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-2">
              {messages.map((msg, index) => {
                const isYou = msg.user.id === currentUser?.uid;
                const prevMessage = messages[index - 1];
                const nextMessage = messages[index + 1];

                const isFirstInSequence = !prevMessage || prevMessage.user.id !== msg.user.id;
                const isLastInSequence = !nextMessage || nextMessage.user.id !== msg.user.id;

                return (
                  <div key={msg.id} className={cn('flex items-end gap-2', isYou ? 'justify-end' : 'justify-start')}>
                     {!isYou && (
                        <Avatar className={cn('h-8 w-8', !isLastInSequence && 'invisible')}>
                            <AvatarImage src={msg.user.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                            <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                     )}
                     <div className={cn('flex flex-col max-w-xs lg:max-w-md', isYou ? 'items-end' : 'items-start')}>
                        {!isYou && isFirstInSequence && <p className="text-xs text-muted-foreground mb-1 px-3">{msg.user.name}</p>}
                        <div className={cn('p-3 rounded-lg shadow-sm', 
                            isYou ? 'bg-primary text-primary-foreground' : 'bg-card',
                            isFirstInSequence && !isLastInSequence ? (isYou ? 'rounded-br-none' : 'rounded-bl-none')
                            : !isFirstInSequence && !isLastInSequence ? 'rounded-none'
                            : !isFirstInSequence && isLastInSequence ? (isYou ? 'rounded-tr-none' : 'rounded-tl-none')
                            : 'rounded-lg' // Default case for single messages
                        )}>
                            {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                            {msg.imageUrl && (
                               <Link href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                  <div className="relative aspect-square mt-2 rounded-md overflow-hidden">
                                    <Image src={msg.imageUrl} alt="Chat image" fill className="object-cover" />
                                  </div>
                               </Link>
                            )}
                        </div>
                        {isLastInSequence && <p className="text-xs text-muted-foreground mt-1 px-3">{msg.time}</p>}
                     </div>
                     {isYou && (
                         <Avatar className={cn('h-8 w-8', !isLastInSequence && 'invisible')}>
                            <AvatarImage src={currentUser?.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                            <AvatarFallback>{currentUser?.username.charAt(0)}</AvatarFallback>
                         </Avatar>
                     )}
                  </div>
                )
              })}
               {isUploading && (
                <div className="flex items-end gap-2 justify-end">
                    <div className="flex flex-col items-end">
                      <div className="p-3 rounded-lg shadow-sm bg-primary text-primary-foreground rounded-br-none">
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
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                       <Paperclip className="w-5 h-5" />
                   </Button>
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && handleImageSend(e.target.files[0])} />
                  <Button size="icon" onClick={handleSendMessage} disabled={newMessage.trim() === ''}><SendHorizonal className="w-5 h-5" /></Button>
              </div>
          </div>
      </div>
    </div>
  );
}
