
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { summarizeDailyActivity, SummarizeDailyActivityOutput } from '@/ai/flows/summarize-daily-activity';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit, addDoc } from 'firebase/firestore';
import type { Message } from '@/services/chat';
import { ShieldCheck, MessageCircleWarning, ListTodo, LoaderCircle, Plus, Upload, CalendarIcon } from 'lucide-react';
import { allStates } from '@/lib/states';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SpamMessage extends Message {
  isSpam: boolean;
  reason?: string;
}

interface Requirement extends Message {
    category: string;
    title: string;
}

const initialNewOfferState = {
    title: '',
    description: '',
    hint: '',
    code: '',
    type: ''
};

export default function AdminDashboardPage() {
    const [summary, setSummary] = useState<SummarizeDailyActivityOutput | null>(null);
    const [spamMessages, setSpamMessages] = useState<SpamMessage[]>([]);
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
    const [newOffer, setNewOffer] = useState(initialNewOfferState);
    const [validUntil, setValidUntil] = useState<Date | undefined>();
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch AI Summary
                const activitySummary = await summarizeDailyActivity({});
                setSummary(activitySummary);

                let allMessages: Message[] = [];
                
                // Fetch recent messages from all state chats
                const stateChatQueries = allStates.map(state => {
                    const messagesCollectionRef = collection(db, 'chats', state.value, 'messages');
                    return query(messagesCollectionRef, orderBy('timestamp', 'desc'), limit(50));
                });

                const querySnapshots = await Promise.all(stateChatQueries.map(q => getDocs(q)));

                querySnapshots.forEach(snapshot => {
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const timestamp = data.timestamp?.toDate();
                        if (timestamp) {
                           allMessages.push({
                                id: doc.id,
                                ...data,
                                time: timestamp.toLocaleString(),
                                timestamp: timestamp,
                            } as Message);
                        }
                    });
                });

                // Client-side filtering for spam
                const spamData = allMessages
                    .filter(msg => (msg as SpamMessage).isSpam)
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .slice(0, 10) as SpamMessage[];
                setSpamMessages(spamData);

                // Client-side filtering for requirements
                const reqData = allMessages
                    .filter(msg => msg.category && msg.category !== 'General Chat' && msg.category !== null)
                     .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .slice(0, 10) as Requirement[];
                setRequirements(reqData);

            } catch (error) {
                console.error("Failed to fetch admin dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);
    
    const handleAddOffer = async () => {
        if (!newOffer.title || !newOffer.description || !newOffer.hint) {
            toast({ title: "Missing Fields", description: "Please fill out title, description, and hint for the offer.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(collection(db, 'offers'), {
                ...newOffer,
                validUntil: validUntil ? format(validUntil, 'yyyy-MM-dd') : null,
                image: `https://placehold.co/600x400.png`
            });
            toast({ title: "Offer Added", description: "The new offer has been successfully created." });
            setNewOffer(initialNewOfferState);
            setValidUntil(undefined);
            setIsAddOfferOpen(false);
        } catch (error) {
            console.error("Error adding offer: ", error);
            toast({ title: "Error", description: "Could not create the offer. Please try again.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }


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
        
        <Dialog open={isAddOfferOpen} onOpenChange={setIsAddOfferOpen}>
            <DialogTrigger asChild>
                <Button className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg md:bottom-8 md:right-8 z-30">
                    <Plus className="h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Add New Offer</DialogTitle>
                    <DialogDescription>Create a new coupon or offer for the community.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={newOffer.title} onChange={(e) => setNewOffer({...newOffer, title: e.target.value})} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={newOffer.description} onChange={(e) => setNewOffer({...newOffer, description: e.target.value})} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="code">Coupon Code</Label>
                            <Input id="code" placeholder="e.g., DIWALI20" value={newOffer.code} onChange={(e) => setNewOffer({...newOffer, code: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type">Offer Type</Label>
                            <Select onValueChange={(value) => setNewOffer({...newOffer, type: value})} value={newOffer.type}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Discount">Discount</SelectItem>
                                    <SelectItem value="Deal">Deal</SelectItem>
                                    <SelectItem value="Service">Service</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Valid Until</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "justify-start text-left font-normal",
                                    !validUntil && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {validUntil ? format(validUntil, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={validUntil}
                                        onSelect={setValidUntil}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="hint">Image Hint</Label>
                            <Input id="hint" placeholder="e.g., 'indian food'" value={newOffer.hint} onChange={(e) => setNewOffer({...newOffer, hint: e.target.value})} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddOfferOpen(false)} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleAddOffer} disabled={isSaving}>
                        {isSaving ? <LoaderCircle className="animate-spin" /> : "Save Offer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    )
}
