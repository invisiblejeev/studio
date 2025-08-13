
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, LoaderCircle } from "lucide-react";
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
    user: {
        uid: string;
        username: string;
        avatar: string;
    };
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
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        const fetchUserAndChats = async () => {
          setIsLoading(true);
          const user = await getCurrentUser();
          if (user) {
            const profile = await getUserProfile(user.uid);
            setCurrentUser(profile);
            
            if (profile) {
                const personalChatsRef = collection(db, `users/${profile.uid}/personalChats`);
                const q = query(personalChatsRef);

                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const chatPromises = snapshot.docs.map(docData => {
                        const chatInfo = docData.data();
                        const roomId = chatInfo.roomId;
                        
                        return new Promise<ChatContact>(async (resolve) => {
                            const messagesCollection = collection(db, 'chats', roomId, 'messages');
                            const q2 = query(messagesCollection, orderBy("timestamp", "desc"), limit(1));
                            
                            const messageSnapshot = await getDocs(q2);
                            let lastMessage: Message | null = null;
                            if (!messageSnapshot.empty) {
                                lastMessage = messageSnapshot.docs[0].data() as Message;
                            }

                            const timestamp = lastMessage?.timestamp?.toDate ? lastMessage.timestamp.toDate() : new Date(0);
                            
                            resolve({
                                user: chatInfo.withUser,
                                lastMessage: lastMessage?.text || (lastMessage?.imageUrl ? "Image" : "No messages yet"),
                                time: timestamp ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                                unread: 0, // Simplified for now
                                timestamp: timestamp,
                                roomId: roomId,
                            });
                        });
                    });

                    Promise.all(chatPromises).then(resolvedChats => {
                        resolvedChats.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
                        setChats(resolvedChats);
                        setIsLoading(false);
                    });
                });
                return unsubscribe;
            }
          } else {
            router.push('/');
            setIsLoading(false);
          }
        };

        const unsubscribePromise = fetchUserAndChats();
        
        return () => {
             unsubscribePromise.then(unsubscribe => {
                if(unsubscribe) {
                    unsubscribe();
                }
             });
        }

    }, [router]);


    const handleChatClick = (userId: string) => {
        router.push(`/chat/user/${userId}`);
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
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <LoaderCircle className="w-6 h-6 animate-spin" />
                        <p className="ml-2">Loading chats...</p>
                    </div>
                ) : chats.length === 0 ? (
                     <div className="text-center text-muted-foreground p-8">
                        <p>No personal chats yet.</p>
                        <p className="text-xs mt-2">Start a conversation from a user's post on the Requirements page.</p>
                    </div>
                ) : (
                    chats.map(chat => (
                        <div key={chat.user.uid} onClick={() => handleChatClick(chat.user.uid)} className="flex items-center gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={chat.user.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                                <AvatarFallback>{chat.user.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="font-semibold">{chat.user.username}</p>
                                    <p className={cn("text-sm text-muted-foreground truncate mt-1 max-w-[200px] md:max-w-xs", chat.unread > 0 && "font-bold text-foreground")}>
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
                    ))
                )}
            </div>
        </div>
    );
}
