
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback, useRef } from "react";
import { getCurrentUser } from "@/services/auth";
import { db } from "@/lib/firebase";
import { collection, query, doc, onSnapshot, Unsubscribe } from "firebase/firestore";
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
    unread: number;
    timestamp: Date | null;
    roomId: string;
}

export default function PersonalChatsListPage() {
    const router = useRouter();
    const [chats, setChats] = useState<ChatContact[]>([]);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const chatListeners = useRef<Record<string, Unsubscribe>>({});

    const updateAndSortChats = useCallback((newOrUpdatedChat: ChatContact) => {
        setChats(prevChats => {
            const existingChatIndex = prevChats.findIndex(c => c.roomId === newOrUpdatedChat.roomId);
            let newChats: ChatContact[];
            if (existingChatIndex > -1) {
                newChats = [...prevChats];
                newChats[existingChatIndex] = newOrUpdatedChat;
            } else {
                newChats = [...prevChats, newOrUpdatedChat];
            }
            newChats.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
            return newChats;
        });
    }, []);

    useEffect(() => {
        const fetchUserAndInitiateListeners = async () => {
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
                const q = query(personalChatsRef);

                const mainUnsubscribe = onSnapshot(q, (snapshot) => {
                    setIsLoading(false);
                    snapshot.docChanges().forEach((change) => {
                        const chatInfo = change.doc.data();
                        const roomId = chatInfo.roomId;

                        if (change.type === "added") {
                            if (!chatListeners.current[roomId]) {
                                const chatDocRef = doc(db, 'chats', roomId);
                                const chatUnsubscribe = onSnapshot(chatDocRef, (chatDocSnap) => {
                                    if (chatDocSnap.exists()) {
                                        const chatData = chatDocSnap.data();
                                        const lastMessageTimestamp = chatData.lastMessageTimestamp?.toDate() || new Date(0);
                                        const updatedContact: ChatContact = {
                                            user: chatInfo.withUser,
                                            lastMessage: chatData.lastMessage || (chatData.lastMessageSenderId ? "Image" : "No messages yet"),
                                            time: lastMessageTimestamp ? formatDistanceToNowStrict(lastMessageTimestamp) : '',
                                            unread: 0, // Placeholder
                                            timestamp: lastMessageTimestamp,
                                            roomId: roomId,
                                        };
                                        updateAndSortChats(updatedContact);
                                    }
                                });
                                chatListeners.current[roomId] = chatUnsubscribe;
                            }
                        }
                        if (change.type === "removed") {
                            const unsubscribe = chatListeners.current[roomId];
                            if (unsubscribe) {
                                unsubscribe();
                                delete chatListeners.current[roomId];
                            }
                            setChats(prev => prev.filter(c => c.roomId !== roomId));
                        }
                    });
                     if (snapshot.empty) {
                        setIsLoading(false);
                    }
                }, (error) => {
                    console.error("Error fetching personal chats list:", error);
                    toast({ title: "Error", description: "Could not fetch personal chats list.", variant: "destructive" });
                    setIsLoading(false);
                });

                return mainUnsubscribe;
            }
        };

        let unsubscribe: Unsubscribe | undefined;
        fetchUserAndInitiateListeners().then(unsub => { unsubscribe = unsub; });

        return () => {
            if (unsubscribe) unsubscribe();
            Object.values(chatListeners.current).forEach(unsub => unsub());
            chatListeners.current = {};
        };
    }, [router, toast, updateAndSortChats]);

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
                        <p className="text-xs mt-2">Start a conversation from a user's profile.</p>
                    </div>
                ) : (
                    chats.map(chat => (
                        <div key={chat.roomId} onClick={() => handleChatClick(chat.user.uid)} className="flex items-center gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer">
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
