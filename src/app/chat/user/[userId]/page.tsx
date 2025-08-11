
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, SendHorizonal, ArrowLeft } from "lucide-react"
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from "react";
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile } from "@/services/users";
import { getMessages, sendMessage, Message, getPersonalChatRoomId } from "@/services/chat";

export default function PersonalChatPage() {
  const params = useParams();
  const otherUserId = params.userId as string;
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);


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
    if (newMessage.trim() !== "" && currentUser && roomId) {
      await sendMessage(roomId, {
        user: { 
            id: currentUser.uid, 
            name: currentUser.username, 
            avatar: currentUser.avatar || 'https://placehold.co/40x40.png' 
        },
        text: newMessage,
      });
      setNewMessage("");
    }
  };
  
  if (!otherUser) {
      return <div>Loading...</div>;
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
              {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start gap-3 ${msg.user.id === currentUser?.uid ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
                      <Avatar className="mt-1">
                        <AvatarImage src={msg.user.avatar} data-ai-hint="person avatar" />
                        <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={`rounded-lg p-3 max-w-xs lg:max-w-md shadow-sm ${msg.user.id === currentUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                          {msg.user.id !== currentUser?.uid && <p className="font-semibold text-sm mb-1">{msg.user.name}</p>}
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-xs text-right mt-2 opacity-70">{msg.time}</p>
                      </div>
                  </div>
              ))}
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
                  <Button variant="ghost" size="icon" className="text-muted-foreground"><Paperclip className="w-5 h-5" /></Button>
                  <Button size="icon" onClick={handleSendMessage}><SendHorizonal className="w-5 h-5" /></Button>
              </div>
          </div>
      </div>
    </div>
  );
}
