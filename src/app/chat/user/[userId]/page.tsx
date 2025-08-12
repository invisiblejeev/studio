
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
import { uploadChatImage } from "@/services/storage";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";

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


  useEffect(() => {
    const fetchUsers = async () => {
      const user = await getCurrentUser() as any;
      if (user) {
        const profile = await getUserProfile(user.uid);
        setCurrentUser(profile);
        const otherProfile = await getUserProfile(otherUserId);
        setOtherUser(otherProfile);
        setRoomId(getPersonalChatRoomId(user.uid, otherUserId));
      } else {
        router.push('/');
      }
    };
    fetchUsers();
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
          avatar: currentUser.avatar || 'https://placehold.co/40x40.png' 
      },
      text: newMessage,
    });
    setNewMessage("");
  };

  const handleImageSend = async (file: File) => {
      if (!file || !currentUser || !roomId) return;
      setIsUploading(true);
      try {
          const imageUrl = await uploadChatImage(roomId, file);
          await sendMessage(roomId, {
             user: { 
                id: currentUser.uid, 
                name: currentUser.username, 
                avatar: currentUser.avatar || 'https://placehold.co/40x40.png' 
             },
             imageUrl,
          });
      } catch (error) {
          console.error("Error uploading image:", error);
          toast({
              title: "Upload Failed",
              description: "Could not upload the image. Please try again.",
              variant: "destructive"
          });
      } finally {
          setIsUploading(false);
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
    <div className="flex flex-col h-full bg-background rounded-xl border">
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
