
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/services/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { getUserProfile, UserProfile } from "@/services/users";


interface ChatContact {
    user: UserProfile;
    lastMessage: string;
    time: string;
    unread: number;
}

export default function PersonalChatsListPage() {
    const router = useRouter();
    const [chats, setChats] = useState<ChatContact[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser();
            setCurrentUser(user);
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const fetchChats = async () => {
            // This is a simplified version. A real implementation would involve a more complex data model
            // to efficiently query all chat rooms a user is part of.
            // For this demo, we'll just show some recent users.
            const usersSnapshot = await getDocs(query(collection(db, "users"), where("uid", "!=", currentUser.uid), limit(10)));
            const chatContacts: ChatContact[] = [];

            for (const userDoc of usersSnapshot.docs) {
                const otherUser = userDoc.data() as UserProfile;
                const roomId = currentUser.uid < otherUser.uid ? `${currentUser.uid}_${otherUser.uid}` : `${otherUser.uid}_${currentUser.uid}`;
                
                const lastMessageQuery = query(collection(db, "chats", roomId, "messages"), orderBy("timestamp", "desc"), limit(1));
                const lastMessageSnapshot = await getDocs(lastMessageQuery);
                
                let lastMessage = "No messages yet";
                let time = "";

                if (!lastMessageSnapshot.empty) {
                    const msg = lastMessageSnapshot.docs[0].data();
                    lastMessage = msg.text;
                    const timestamp = msg.timestamp?.toDate();
                    time = timestamp ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                }

                chatContacts.push({
                    user: otherUser,
                    lastMessage,
                    time,
                    unread: 0, // Unread count logic would need more implementation
                });
            }
            setChats(chatContacts);
        };

        fetchChats();
    }, [currentUser]);


    return (
        <div className="flex flex-col h-full bg-background rounded-xl border">
            <header className="flex items-center justify-start p-4 border-b gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-xl font-bold">Personal Chats</h2>
            </header>
            <div className="flex-1">
                {chats.map(chat => (
                    <Link href={`/chat/user/${chat.user.uid}`} key={chat.user.uid}>
                        <div className="flex items-center gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={chat.user.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                                <AvatarFallback>{chat.user.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <p className="font-semibold">{chat.user.username}</p>
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
