
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const personalChats = [
  { userId: 'user1', name: 'Rohan', avatar: 'https://placehold.co/40x40.png', lastMessage: 'Sure, I can send them over.', time: '3:45 PM', unread: 2 },
  { userId: 'user2', name: 'Priya', avatar: 'https://placehold.co/40x40.png', lastMessage: 'Let me know if you are interested.', time: '1:20 PM', unread: 0 },
  { userId: 'user3', name: 'Amit', avatar: 'https://placehold.co/40x40.png', lastMessage: 'Yes, it is still available.', time: 'Yesterday', unread: 0 },
];

export default function PersonalChatsListPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col h-full bg-background rounded-xl border">
            <header className="flex items-center justify-start p-4 border-b gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-xl font-bold">Personal Chats</h2>
            </header>
            <div className="flex-1">
                {personalChats.map(chat => (
                    <Link href={`/chat/user/${chat.userId}`} key={chat.userId}>
                        <div className="flex items-center gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={chat.avatar} data-ai-hint="person avatar" />
                                <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <p className="font-semibold">{chat.name}</p>
                                    <p className="text-xs text-muted-foreground">{chat.time}</p>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                                    {chat.unread > 0 && (
                                        <div className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                            {chat.unread}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
