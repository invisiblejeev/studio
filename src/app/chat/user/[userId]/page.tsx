
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, SendHorizonal, ArrowLeft, LoaderCircle } from "lucide-react"
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from "react";
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile } from "@/services/users";
import { getMessages, sendMessage, Message, getPersonalChatRoomId } from "@/services/chat";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PersonalChatPage() {
  const router = useRouter();
  const params = useParams();
  const otherUserId = params.userId as string;
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const fetchUsers = async () => {
      const user = await getCurrentUser() as any;
      if (user) {
        const profile = await getUserProfile(user.uid);
        setCurrentUser(profile);
        const otherProfile = await getUserProfile(otherUserId);
        setOtherUser(otherProfile);
        const personalRoomId = getPersonalChatRoomId(user.uid, otherUserId);
        setRoomId(personalRoomId);
        // Mark chat as read when opening
        localStorage.setItem(`read_${personalRoomId}`, 'true');
      } else {
        router.push('/');
      }
    };
    if (otherUserId) {
        fetchUsers();
    }
  }, [router, otherUserId]);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = getMessages(roomId, (newMessages) => {
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
  }, [roomId]);


  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !currentUser || !roomId) return;
    await sendMessage(roomId, {
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
      if (!file || !currentUser || !roomId) return;
      setIsUploading(true);
      try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
              const dataUrl = reader.result as string;
              await sendMessage(roomId, {
                 user: { 
                    id: currentUser.uid, 
                    name: currentUser.username, 
                    avatar: currentUser.avatar || '' 
                 },
                 imageUrl: dataUrl,
              });
              setIsUploading(false);
          };
          reader.onerror = (error) => {
              throw error;
          };
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
  
  if (!otherUser || !currentUser) {
      return (
         <div className="flex h-screen items-center justify-center">
              <p>Loading chat...</p>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-screen bg-background rounded-xl border">
      <header className="flex items-center justify-start p-4 border-b gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar>
                <AvatarImage src={otherUser.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                <AvatarFallback>{otherUser.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">{otherUser.username}</h2>
          </div>
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
                        <Avatar className={cn('h-8 w-8')}>
                            <AvatarImage src={msg.user.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                            <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                     )}
                     {!isYou && !isLastInSequence && <div className='w-8 h-8 shrink-0'/>}

                     <div className={cn('flex flex-col max-w-xs lg:max-w-md', isYou ? 'items-end' : 'items-start')}>
                        <div className={cn('p-3 rounded-lg shadow-sm', 
                            isYou ? 'bg-primary text-primary-foreground' : 'bg-card',
                            isFirstInSequence && !isLastInSequence && isYou ? 'rounded-br-none' :
                            isFirstInSequence && !isLastInSequence && !isYou ? 'rounded-bl-none' :
                            !isFirstInSequence && !isLastInSequence ? 'rounded-br-none rounded-bl-none' :
                            !isFirstInSequence && isLastInSequence && isYou ? 'rounded-tr-none' :
                            !isFirstInSequence && isLastInSequence && !isYou ? 'rounded-tl-none' :
                            'rounded-lg'
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

                     {isYou && isLastInSequence && (
                         <Avatar className={cn('h-8 w-8')}>
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
                placeholder={`Message ${otherUser.username}...`} 
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
                  <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={isUploading}><Paperclip className="w-5 h-5" /></Button>
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && handleImageSend(e.target.files[0])} />
                  <Button size="icon" onClick={handleSendMessage} disabled={newMessage.trim() === ''}><SendHorizonal className="w-5 h-5" /></Button>
              </div>
          </div>
      </div>
    </div>
  );
}
