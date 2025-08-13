
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { summarizeDailyActivity, SummarizeDailyActivityOutput } from '@/ai/flows/summarize-daily-activity';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit, addDoc, where, collectionGroup } from 'firebase/firestore';
import type { Message } from '@/services/chat';
import { ShieldCheck, MessageCircleWarning, ListTodo, LoaderCircle, Plus, Upload, CalendarIcon, Image as ImageIcon, X } from 'lucide-react';
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
import Image from 'next/image';

interface SpamMessage extends Message {
  isSpam: boolean;
  reason?: string;
  state: string;
}

interface Requirement extends Message {
    category: string;
    title: string;
    state: string;
}

const initialNewOfferState = {
    title: '',
    description: '',
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
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch AI Summary
                const activitySummary = await summarizeDailyActivity({});
                setSummary(activitySummary);

                // Fetch Requirements directly
                const reqQuery = query(collection(db, 'requirements'), orderBy('timestamp', 'desc'), limit(10));
                const reqSnapshot = await getDocs(reqQuery);
                const reqData = reqSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        time: data.timestamp?.toDate().toLocaleString() ?? '',
                    } as Requirement;
                });
                setRequirements(reqData);

                // Fetch Spam Messages using a collectionGroup query.
                // This requires a composite index on (isSpam, timestamp) in Firestore.
                // The console will prompt you to create this index automatically.
                const spamQuery = query(
                    collectionGroup(db, 'messages'), 
                    where('isSpam', '==', true), 
                    orderBy('timestamp', 'desc'), 
                    limit(10)
                );
                
                const spamSnapshot = await getDocs(spamQuery);
                const spamData = spamSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        time: data.timestamp?.toDate().toLocaleString() ?? '',
                    } as SpamMessage
                });
                setSpamMessages(spamData);


            } catch (error) {
                console.error("Failed to fetch admin dashboard data:", error);
                 toast({ title: "Error", description: "Could not fetch dashboard data. You may need to create Firestore indexes.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles = Array.from(files);
            setImageFiles(prev => [...prev, ...newFiles]);

            newFiles.forEach(file => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    setImagePreviews(prev => [...prev, reader.result as string]);
                };
            });
        }
    }

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
    
    const handleAddOffer = async () => {
        if (!newOffer.title || !newOffer.description) {
            toast({ title: "Missing Fields", description: "Please fill out title and description.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const uploadPromises = imageFiles.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = (error) => reject(error);
                });
            });

            let imageUrls = await Promise.all(uploadPromises);

            if (imageUrls.length === 0) {
                 imageUrls.push(`https://placehold.co/600x400.png`);
            }

            await addDoc(collection(db, 'offers'), {
                ...newOffer,
                validUntil: validUntil ? format(validUntil, 'yyyy-MM-dd') : null,
                images: imageUrls
            });

            toast({ title: "Offer Added", description: "The new offer has been successfully created." });
            setNewOffer(initialNewOfferState);
            setValidUntil(undefined);
            setImageFiles([]);
            setImagePreviews([]);
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
                                <TableHead>State</TableHead>
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
                                <TableHead>State</TableHead>
                                <TableHead>User</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requirements.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium max-w-[150px] truncate">{req.title}</TableCell>
                                    <TableCell><Badge variant="secondary">{req.category}</Badge></TableCell>
                                     <TableCell className="capitalize">{req.state}</TableCell>
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
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
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
                        <Label>Offer Images</Label>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" /> Upload
                            </Button>
                            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleImageFileChange} accept="image/*" />
                        </div>
                         <div className="flex flex-wrap gap-2 mt-2">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative w-20 h-20">
                                    <Image src={preview} alt={`preview ${index}`} layout="fill" className="rounded-md object-cover" />
                                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeImage(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
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
