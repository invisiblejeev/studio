
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback, useRef } from "react";
import { getCurrentUser } from "@/services/auth";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc, orderBy, Unsubscribe } from "firebase/firestore";
import { getUserProfile, UserProfile } from "@/services/users";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

interface ChatContact {
    user: {
        uid: string;
        username: string;
        avatar: string;
    };
    lastMessage: string;
    time: string;
    unreadCount: number;
    timestamp: Date | null;
    roomId: string;
}

export default function PersonalChatsListPage() {
    const router = useRouter();
    const [chats, setChats] = useState<ChatContact[]>([]);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const unsubscriberRef = useRef<Unsubscribe | null>(null);
    
    useEffect(() => {
        const fetchUserAndChats = async () => {
            setIsLoading(true);
            const user = await getCurrentUser();
            if (!user) {
                router.push('/');
                return;
            }

            const profile = await getUserProfile(user.uid);
            setCurrentUser(profile);

            if (profile) {
                const personalChatsRef = collection(db, `users/${profile.uid}/personalChats`);
                const q = query(personalChatsRef, orderBy("lastMessageTimestamp", "desc"));

                const unsubscribe = onSnapshot(q, async (snapshot) => {
                    const chatsData = snapshot.docs.map(docSnap => {
                        const chatInfo = docSnap.data();
                        const lastMessageTimestamp = chatInfo.lastMessageTimestamp?.toDate() || null;
                        
                        return {
                            user: chatInfo.withUser,
                            lastMessage: chatInfo.lastMessage || "No messages yet",
                            time: lastMessageTimestamp ? formatDistanceToNowStrict(lastMessageTimestamp) : '',
                            unreadCount: chatInfo.unreadCount || 0,
                            timestamp: lastMessageTimestamp,
                            roomId: chatInfo.roomId,
                        };
                    });

                    setChats(chatsData);
                    setIsLoading(false);
                }, (error) => {
                    console.error("Error fetching personal chats:", error);
                    toast({ title: "Error", description: "Could not fetch personal chats.", variant: "destructive" });
                    setIsLoading(false);
                });
                
                unsubscriberRef.current = unsubscribe;
            }
        };

        fetchUserAndChats();

        return () => {
            if (unsubscriberRef.current) {
                unsubscriberRef.current();
            }
        }

    }, [router, toast]);


    const handleChatClick = async (chat: ChatContact) => {
        if (!currentUser) return;
        // Reset unread count when user clicks on the chat
        if (chat.unreadCount > 0) {
            const chatRef = doc(db, `users/${currentUser.uid}/personalChats`, chat.user.uid);
            try {
                await updateDoc(chatRef, { unreadCount: 0 });
            } catch(e) {
                console.error("Could not reset unread count", e);
            }
        }
        router.push(`/chat/user/${chat.user.uid}`);
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
                        <p className="text-xs mt-2">Start a conversation from a user's profile.</p>
                    </div>
                ) : (
                    chats.map(chat => (
                        <div key={chat.roomId} onClick={() => handleChatClick(chat)} className="flex items-center gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={chat.user.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                                <AvatarFallback>{chat.user.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="font-semibold">{chat.user.username}</p>
                                    <p className={cn("text-sm text-muted-foreground truncate mt-1 max-w-[200px] md:max-w-xs", chat.unreadCount > 0 && "font-bold text-foreground")}>
                                        {chat.lastMessage}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <p className="text-xs text-muted-foreground">{chat.time}</p>
                                    {chat.unreadCount > 0 && (
                                        <div className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                                            {chat.unreadCount}
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
