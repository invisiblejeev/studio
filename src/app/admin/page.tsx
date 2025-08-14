
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit, where, collectionGroup } from 'firebase/firestore';
import type { Message } from '@/services/chat';
import { ShieldCheck, MessageCircleWarning, LoaderCircle } from 'lucide-react';
import { allStates } from '@/lib/states';
import { useToast } from '@/hooks/use-toast';

interface SpamMessage extends Message {
  isSpam: boolean;
  reason?: string;
  state: string;
}

export default function AdminDashboardPage() {
    const [spamMessages, setSpamMessages] = useState<SpamMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Spam Messages using a collectionGroup query.
                const spamQuery = query(
                    collectionGroup(db, 'messages'), 
                    where('isSpam', '==', true), 
                    orderBy('timestamp', 'desc'),
                    limit(20)
                );
                
                const spamSnapshot = await getDocs(spamQuery);
                const spamData = spamSnapshot.docs.map(doc => {
                    const data = doc.data();
                    const parentPath = doc.ref.parent.parent?.path;
                    // The path is chats/{roomId}, so the roomId is the second segment.
                    const roomId = parentPath ? parentPath.split('/')[1] : 'unknown';

                    // For public chats, the room ID is the state name. For private chats, it's user IDs.
                    // We only want to show state for public chats.
                    const isPublicChat = allStates.some(s => s.value === roomId);
                    const state = isPublicChat ? roomId : 'Private Chat';

                    return {
                        id: doc.id,
                        ...data,
                        state: state, // Extract state from document path
                        time: data.timestamp?.toDate().toLocaleString() ?? '',
                    } as SpamMessage
                });
                setSpamMessages(spamData);


            } catch (error) {
                console.error("Failed to fetch admin dashboard data:", error);
                 toast({ title: "Error", description: "Could not fetch dashboard data. Check Firestore rules and indexes.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoaderCircle className="w-8 h-8 animate-spin" />
                <p className="ml-2">Loading Admin Dashboard...</p>
            </div>
        )
    }

    return (
      <div className="space-y-8 p-4 md:p-6 lg:p-8 relative pb-24">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                Monitoring panel for community activity.
                </p>
            </div>
            <ShieldCheck className="h-8 w-8 text-primary" />
        </div>

        <div className="grid gap-6 md:grid-cols-1">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageCircleWarning className="text-destructive"/> Spam Log</CardTitle>
                    <CardDescription>Recently detected spam messages.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Message</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Chat</TableHead>
                                <TableHead>User</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {spamMessages.map(msg => (
                                <TableRow key={msg.id}>
                                    <TableCell className="max-w-[150px] truncate">{msg.text}</TableCell>
                                    <TableCell><Badge variant="destructive">{msg.reason || 'Keyword'}</Badge></TableCell>
                                     <TableCell className="capitalize">{msg.state}</TableCell>
                                    <TableCell>{msg.user.name}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {spamMessages.length === 0 && <p className="text-center text-sm text-muted-foreground pt-4">No spam detected recently.</p>}
                </CardContent>
            </Card>
        </div>
      </div>
    )
}

    
