
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { getCurrentUser } from "@/services/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, collectionGroup } from "firebase/firestore";
import { getUserProfile, UserProfile } from "@/services/users";
import { cn } from "@/lib/utils";
import type { Message } from "@/services/chat";


interface ChatContact {
    user: UserProfile;
    lastMessage: string;
    time: string;
    unread: number;
    timestamp: Date | null;
    roomId: string;
}

export default function PersonalChatsListPage() {
    const router = useRouter();
    const [chats, setChats] = useState<ChatContact[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser();
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
        if (!currentUser) return;

        // This is a complex query. In a production app, you'd likely store a user's chat rooms in their profile.
        // Here, we query all chat collections.
        const personalChatsQuery = query(collectionGroup(db, "messages"), orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(personalChatsQuery, async (snapshot) => {
            const chatRooms: { [key: string]: { lastMessage: Message, unread: number } } = {};
            const myRooms: Set<string> = new Set();
            
            snapshot.docs.forEach(doc => {
                const message = doc.data() as Message;
                const roomId = doc.ref.parent.parent?.id;

                if (roomId && roomId.includes(currentUser.uid)) {
                    myRooms.add(roomId);
                     if (!chatRooms[roomId]) { // Only process if it's a new room for this snapshot
                        const timestamp = message.timestamp?.toDate ? message.timestamp.toDate() : new Date();
                        chatRooms[roomId] = {
                            lastMessage: { ...message, id: doc.id, timestamp },
                            unread: 1 // Placeholder
                        };
                    }
                }
            });
            
            // This is a placeholder for real unread logic
            myRooms.forEach(roomId => {
                if (localStorage.getItem(`read_${roomId}`) === 'true') {
                    if (chatRooms[roomId]) chatRooms[roomId].unread = 0;
                } else {
                    // Simulate unread count
                    if(chatRooms[roomId]) chatRooms[roomId].unread = Math.floor(Math.random() * 3);
                }
            })


            const chatPromises = Array.from(myRooms).map(async (roomId) => {
                const otherUserId = roomId.replace(currentUser.uid, '').replace('_', '');
                const otherUser = await getUserProfile(otherUserId);

                if (otherUser && chatRooms[roomId]) {
                    const { lastMessage, unread } = chatRooms[roomId];
                    const timestamp = lastMessage.timestamp as Date;
                    
                    return {
                        user: otherUser,
                        lastMessage: lastMessage.text || (lastMessage.imageUrl ? "Image" : "No messages yet"),
                        time: timestamp ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                        unread: unread,
                        timestamp: timestamp,
                        roomId: roomId
                    };
                }
                return null;
            });
            
            const resolvedChats = (await Promise.all(chatPromises)).filter(Boolean) as ChatContact[];
            resolvedChats.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
            setChats(resolvedChats);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleChatClick = (roomId: string) => {
        // Simulate marking chat as read
        localStorage.setItem(`read_${roomId}`, 'true');
        const updatedChats = chats.map(c => c.roomId === roomId ? { ...c, unread: 0 } : c);
        setChats(updatedChats);
        router.push(`/chat/user/${roomId.replace(currentUser.uid, '').replace('_', '')}`);
    }


    return (
        <div className="flex flex-col h-screen bg-background rounded-xl border">
            <header className="flex items-center justify-start p-4 border-b gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-xl font-bold">Personal Chats</h2>
            </header>
            <div className="flex-1 overflow-y-auto">
                {chats.map(chat => (
                    <div key={chat.user.uid} onClick={() => handleChatClick(chat.roomId)} className="flex items-center gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={chat.user.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                            <AvatarFallback>{chat.user.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex justify-between items-start">
                            <div className="flex-1">
                                <p className="font-semibold">{chat.user.username}</p>
                                <p className={cn("text-sm text-muted-foreground truncate mt-1", chat.unread > 0 && "font-bold text-foreground")}>
                                    {chat.lastMessage}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <p className="text-xs text-muted-foreground">{chat.time}</p>
                                {chat.unread > 0 && (
                                    <div className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                                        {chat.unread}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
