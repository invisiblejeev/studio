
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
          avatar: currentUser.avatar || 'https://placehold.co/40x40.png' 
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
                    avatar: currentUser.avatar || 'https://placehold.co/40x40.png' 
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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background rounded-xl border">
      <header className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">{currentStateName} Community</h2>
          <Button variant="outline" onClick={() => router.push('/chat/personal')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Personal Chats
          </Button>
      </header>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-6">
              {messages.map((msg) => {
                const isYou = msg.user.id === currentUser?.uid;
                return (
                  <div key={msg.id} className={`flex items-start gap-3 ${isYou ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
                    <Avatar className="mt-1">
                      <AvatarImage src={msg.user.avatar} data-ai-hint="person avatar" />
                      <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={`rounded-lg p-3 max-w-xs lg:max-w-md shadow-sm ${isYou ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                        {!isYou && <p className="font-semibold text-sm mb-1">{msg.user.name}</p>}
                        {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                        {msg.imageUrl && (
                           <Link href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                              <div className="relative aspect-square mt-2 rounded-md overflow-hidden">
                                <Image src={msg.imageUrl} alt="Chat image" fill className="object-cover" />
                              </div>
                           </Link>
                        )}
                        <p className="text-xs text-right mt-2 opacity-70">{msg.time}</p>
                    </div>
                  </div>
                )
              })}
               {isUploading && (
                <div className="flex items-start gap-3 justify-end flex-row-reverse">
                    <Avatar className="mt-1">
                        <AvatarImage src={currentUser?.avatar} data-ai-hint="person avatar" />
                        <AvatarFallback>{currentUser?.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 max-w-xs lg:max-w-md shadow-sm bg-primary text-primary-foreground">
                        <div className="flex items-center justify-center h-24 w-24 bg-primary-foreground/20 rounded-md">
                           <LoaderCircle className="w-6 h-6 animate-spin" />
                        </div>
                    </div>
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
