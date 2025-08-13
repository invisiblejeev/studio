
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { getCurrentUser } from "@/services/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, collectionGroup, getDoc, doc } from "firebase/firestore";
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
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

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

        // This is a complex query. In a production app, this would be optimized.
        // We query all chat room collections to find ones involving the current user.
        const unsubscribe = onSnapshot(collection(db, "chats"), async (chatsSnapshot) => {
            const chatPromises: Promise<ChatContact | null>[] = [];

            for (const chatDoc of chatsSnapshot.docs) {
                const roomId = chatDoc.id;
                // Personal chats are identified by having an underscore in the room ID
                if (roomId.includes(currentUser.uid) && roomId.includes('_')) {
                    
                    const otherUserId = roomId.replace(currentUser.uid, '').replace('_', '');
                    if (!otherUserId) continue;

                    const promise = (async () => {
                        const otherUser = await getUserProfile(otherUserId);
                        if (!otherUser) return null;

                        const messagesCollection = collection(db, 'chats', roomId, 'messages');
                        const q = query(messagesCollection, orderBy("timestamp", "desc"), limit(1));
                        const messageSnapshot = await getDocs(q);

                        if (messageSnapshot.empty) {
                           return null;
                        }
                        
                        const lastMessageDoc = messageSnapshot.docs[0];
                        const lastMessage = lastMessageDoc.data() as Message;
                        const timestamp = lastMessage.timestamp?.toDate ? lastMessage.timestamp.toDate() : new Date();

                        // Placeholder for real unread logic
                        const unread = localStorage.getItem(`read_${roomId}`) === 'true' ? 0 : Math.floor(Math.random() * 3);

                        return {
                            user: otherUser,
                            lastMessage: lastMessage.text || (lastMessage.imageUrl ? "Image" : "No messages yet"),
                            time: timestamp ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                            unread: unread,
                            timestamp: timestamp,
                            roomId: roomId
                        };
                    })();
                    chatPromises.push(promise);
                }
            }

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
        if (currentUser) {
            const otherUserId = roomId.replace(currentUser.uid, '').replace('_', '');
            router.push(`/chat/user/${otherUserId}`);
        }
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
                 {chats.length === 0 && (
                    <div className="text-center text-muted-foreground p-8">
                        <p>No personal chats yet.</p>
                        <p className="text-xs mt-2">Start a conversation from a user's post on the Requirements page.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
