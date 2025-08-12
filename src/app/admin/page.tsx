
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { summarizeDailyActivity, SummarizeDailyActivityOutput } from '@/ai/flows/summarize-daily-activity';
import { db } from '@/lib/firebase';
import { collectionGroup, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import type { Message } from '@/services/chat';
import { ShieldCheck, MessageCircleWarning, ListTodo, LoaderCircle } from 'lucide-react';

interface SpamMessage extends Message {
  isSpam: boolean;
  reason?: string;
}

interface Requirement extends Message {
    category: string;
    title: string;
}

export default function AdminDashboardPage() {
    const [summary, setSummary] = useState<SummarizeDailyActivityOutput | null>(null);
    const [spamMessages, setSpamMessages] = useState<SpamMessage[]>([]);
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch AI Summary
                const activitySummary = await summarizeDailyActivity({});
                setSummary(activitySummary);

                // Query for spam messages across all chat rooms
                const spamQuery = query(
                    collectionGroup(db, 'messages'), 
                    where('isSpam', '==', true), 
                    orderBy('timestamp', 'desc'), 
                    limit(10)
                );
                const spamSnapshot = await getDocs(spamQuery);
                const spamData = spamSnapshot.docs.map(doc => {
                    const data = doc.data();
                    const timestamp = data.timestamp?.toDate();
                    return { 
                        id: doc.id,
                        ...data,
                        time: timestamp ? new Date(timestamp).toLocaleString() : 'N/A'
                    } as SpamMessage;
                });
                setSpamMessages(spamData);

                // Query for requirements across all chat rooms
                const reqQuery = query(
                    collectionGroup(db, 'messages'), 
                    where('category', '!=', 'General Chat'), 
                    where('category', '!=', null),
                    orderBy('category'),
                    orderBy('timestamp', 'desc'), 
                    limit(10)
                );
                const reqSnapshot = await getDocs(reqQuery);
                const reqData = reqSnapshot.docs.map(doc => {
                     const data = doc.data();
                     const timestamp = data.timestamp?.toDate();
                     return { 
                        id: doc.id,
                        ...data,
                        time: timestamp ? new Date(timestamp).toLocaleString() : 'N/A'
                    } as Requirement;
                });
                setRequirements(reqData);

            } catch (error) {
                console.error("Failed to fetch admin dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoaderCircle className="w-8 h-8 animate-spin" />
                <p className="ml-2">Loading Admin Dashboard...</p>
            </div>
        )
    }

    return (
      <div className="space-y-8 p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                Monitoring panel for community activity and AI systems.
                </p>
            </div>
            <ShieldCheck className="h-8 w-8 text-primary" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daily AI Summary</CardTitle>
            <CardDescription>An AI-generated overview of today's activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{summary?.summary || "No summary available."}</p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
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
                                <TableHead>User</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {spamMessages.map(msg => (
                                <TableRow key={msg.id}>
                                    <TableCell className="max-w-[200px] truncate">{msg.text}</TableCell>
                                    <TableCell><Badge variant="destructive">{msg.reason || 'Keyword'}</Badge></TableCell>
                                    <TableCell>{msg.user.name}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {spamMessages.length === 0 && <p className="text-center text-sm text-muted-foreground pt-4">No spam detected recently.</p>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ListTodo className="text-blue-500" /> AI Classifications</CardTitle>
                    <CardDescription>Recently classified community requirements.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>User</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requirements.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium max-w-[200px] truncate">{req.title}</TableCell>
                                    <TableCell><Badge variant="secondary">{req.category}</Badge></TableCell>
                                    <TableCell>{req.user.name}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {requirements.length === 0 && <p className="text-center text-sm text-muted-foreground pt-4">No new requirements classified.</p>}
                </CardContent>
            </Card>
        </div>
      </div>
    )
}
