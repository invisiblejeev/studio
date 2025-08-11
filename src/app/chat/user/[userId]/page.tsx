
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, SendHorizonal, ArrowLeft } from "lucide-react"
import { useParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { use, useState } from "react";

const users: Record<string, { name: string; avatar: string }> = {
    user1: { name: 'Rohan', avatar: 'https://placehold.co/40x40.png' },
    user2: { name: 'Priya', avatar: 'https://placehold.co/40x40.png' },
    user3: { name: 'Amit', avatar: 'https://placehold.co/40x40.png' },
};

export default function PersonalChatPage() {
  const params = useParams();
  const userId = use(params ? Promise.resolve(params.userId) : Promise.resolve(null)) as keyof typeof users | null;
  const router = useRouter();
  
  const otherUser = userId ? users[userId] : { name: 'Unknown User', avatar: 'https://placehold.co/40x40.png' };

  const [messages, setMessages] = useState([
    { id: 1, user: { name: otherUser.name, avatar: otherUser.avatar }, text: 'Anyone looking for a frontend developer role? My company is hiring.', time: '2:30 PM' },
    { id: 2, user: { name: 'You', avatar: 'https://placehold.co/40x40.png' }, text: 'I am!', time: '2:31 PM' },
  ]);

  const [newMessage, setNewMessage] = useState("");

  if (!userId) {
    return null; 
  }

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      const newId = messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1;
      setMessages([...messages, {
        id: newId,
        user: { name: 'You', avatar: 'https://placehold.co/40x40.png' },
        text: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setNewMessage("");
    }
  };


  return (
    <div className="flex flex-col h-full bg-background rounded-xl border">
      <header className="flex items-center justify-start p-4 border-b gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar>
                <AvatarImage src={otherUser.avatar} data-ai-hint="person avatar" />
                <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">{otherUser.name}</h2>
          </div>
      </header>
      <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
              {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start gap-3 ${msg.user.name === 'You' ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
                      <Avatar className="mt-1">
                        <AvatarImage src={msg.user.avatar} data-ai-hint="person avatar" />
                        <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={`rounded-lg p-3 max-w-xs lg:max-w-md shadow-sm ${msg.user.name === 'You' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                          {msg.user.name !== 'You' && <p className="font-semibold text-sm mb-1">{msg.user.name}</p>}
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
                placeholder={`Message ${otherUser.name}...`} 
                className="pr-28 min-h-[48px]"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
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
