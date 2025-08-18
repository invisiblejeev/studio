
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef, useCallback } from "react";
import { getCurrentUser } from "@/services/auth";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc, where, Unsubscribe, Timestamp } from "firebase/firestore";
import { getUserProfile, UserProfile } from "@/services/users";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

interface ChatContact {
    otherUser: {
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
    const unsubscribers = useRef<Unsubscribe[]>([]);
    
    const cleanupSubscriptions = useCallback(() => {
        unsubscribers.current.forEach(unsub => unsub());
        unsubscribers.current = [];
    }, []);

    useEffect(() => {
        const fetchUserAndChats = async () => {
            setIsLoading(true);
            cleanupSubscriptions();
            
            const user = await getCurrentUser();
            if (!user) {
                router.push('/');
                return;
            }

            const profile = await getUserProfile(user.uid);
            setCurrentUser(profile);

            if (profile) {
                const userChatsMetadataRef = collection(db, `users/${profile.uid}/personalChats`);
                const metadataUnsub = onSnapshot(userChatsMetadataRef, (snapshot) => {
                    const contacts: ChatContact[] = snapshot.docs.map(docSnap => {
                        const data = docSnap.data();
                        const timestamp = (data.lastMessageTimestamp as Timestamp)?.toDate() || new Date();
                        return {
                            otherUser: {
                                uid: data.withUser.uid,
                                username: data.withUser.username,
                                avatar: data.withUser.avatar || '',
                            },
                            lastMessage: data.lastMessage || 'No messages yet',
                            time: formatDistanceToNowStrict(timestamp, { addSuffix: true }),
                            unreadCount: data.unreadCount || 0,
                            timestamp: timestamp,
                            roomId: data.roomId,
                        };
                    });

                    contacts.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
                    setChats(contacts);
                    setIsLoading(false);
                }, (error) => {
                    console.error("Error fetching personal chat metadata:", error);
                    toast({ title: "Error", description: "Could not load your chats.", variant: "destructive" });
                    setIsLoading(false);
                });

                unsubscribers.current.push(metadataUnsub);

            } else {
                setIsLoading(false);
            }
        };

        fetchUserAndChats();

        return () => {
            cleanupSubscriptions();
        }
    }, [router, toast, cleanupSubscriptions]);


    const handleChatClick = async (chat: ChatContact) => {
        if (!currentUser) return;
        if (chat.unreadCount > 0) {
            const chatRef = doc(db, `users/${currentUser.uid}/personalChats`, chat.otherUser.uid);
            try {
                // This is a "fire and forget" update. We don't need to await it to navigate.
                updateDoc(chatRef, { unreadCount: 0 });
            } catch(e) {
                // It's possible this doc doesn't exist if a chat was just created.
                // We can safely ignore not-found errors here.
                if ((e as any).code !== 'not-found') {
                    console.error("Could not reset unread count", e);
                }
            }
        }
        router.push(`/chat/user/${chat.otherUser.uid}`);
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
                                <AvatarImage src={chat.otherUser.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                                <AvatarFallback>{chat.otherUser.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="font-semibold">{chat.otherUser.username}</p>
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
