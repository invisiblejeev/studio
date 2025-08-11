
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { allStates } from "@/lib/states";
import { Paperclip, SendHorizonal } from "lucide-react"
import { useParams } from 'next/navigation';
import Link from "next/link";
import { use, useState } from "react";


export default function ChatPage() {
  const params = useParams();
  const state = use(params ? Promise.resolve(params.state) : Promise.resolve('')) as string;

  const [messages, setMessages] = useState([
    { id: 1, user: { id: 'user1', name: 'Rohan', avatar: 'https://placehold.co/40x40.png' }, text: 'Anyone looking for a frontend developer role? My company is hiring.', time: '2:30 PM' },
    { id: 2, user: { id: 'user2', name: 'Priya', avatar: 'https://placehold.co/40x40.png' }, text: 'I am! Can you share the details?', time: '2:31 PM' },
    { id: 3, user: { id: 'you', name: 'You', avatar: 'https://placehold.co/40x40.png' }, text: 'There is a great Diwali event happening this weekend in the Bay Area. Anyone interested?', time: '2:35 PM' },
    { id: 4, user: { id: 'user3', name: 'Amit', avatar: 'https://placehold.co/40x40.png' }, text: 'I\'m selling my old couch, it\'s in great condition. DM for price.', time: '2:40 PM' },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      const newId = messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1;
      setMessages([...messages, {
        id: newId,
        user: { id: 'you', name: 'You', avatar: 'https://placehold.co/40x40.png' },
        text: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setNewMessage("");
    }
  };

  const currentStateName = allStates.find(s => s.value === state)?.label || "Select State";

  const renderMessage = (msg: (typeof messages)[0]) => {
    const isYou = msg.user.name === 'You';
    const messageContent = (
      <>
        <Avatar className="mt-1">
          <AvatarImage src={msg.user.avatar} data-ai-hint="person avatar" />
          <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className={`rounded-lg p-3 max-w-xs lg:max-w-md shadow-sm ${isYou ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
            {!isYou && <p className="font-semibold text-sm mb-1">{msg.user.name}</p>}
            <p className="text-sm">{msg.text}</p>
            <p className="text-xs text-right mt-2 opacity-70">{msg.time}</p>
        </div>
      </>
    );

    return (
      <div key={msg.id} className={`flex items-start gap-3 ${isYou ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
          {isYou ? (
            messageContent
          ) : (
            <Link href={`/chat/user/${msg.user.id}`} className="flex items-start gap-3">
              {messageContent}
            </Link>
          )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border">
      <header className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">{currentStateName} Community</h2>
      </header>
      <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
              {messages.map(renderMessage)}
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
