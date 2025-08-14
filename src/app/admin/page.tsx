
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit, where, collectionGroup, addDoc } from 'firebase/firestore';
import type { Message } from '@/services/chat';
import { ShieldCheck, MessageCircleWarning, LoaderCircle, Plus, CalendarIcon, Upload, X } from 'lucide-react';
import { allStates } from '@/lib/states';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface SpamMessage extends Message {
  isSpam: boolean;
  reason?: string;
  state: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  images: string[];
  code?: string;
  validUntil?: string;
  type?: string;
  states?: string[];
}

const initialNewOfferState: Omit<Offer, 'id'> = {
    title: '',
    description: '',
    images: [],
    code: '',
    type: '',
    states: ['all'],
};

export default function AdminDashboardPage() {
    const [spamMessages, setSpamMessages] = useState<SpamMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // State for Add Offer Dialog
    const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
    const [newOffer, setNewOffer] = useState(initialNewOfferState);
    const [addValidUntil, setAddValidUntil] = useState<Date | undefined>();
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);


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
    };

    const removeUploadedImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }

    const resetDialogState = () => {
        setNewOffer(initialNewOfferState);
        setAddValidUntil(undefined);
        setImageFiles([]);
        setImagePreviews([]);
    };

    const uploadImages = async (files: File[]): Promise<string[]> => {
      const uploadPromises = files.map(file => {
          return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = (error) => reject(error);
          });
      });
      return Promise.all(uploadPromises);
    }

    const handleAddOffer = async () => {
      if (!newOffer.title || !newOffer.description) {
          toast({ title: "Missing Fields", description: "Please fill out title and description.", variant: "destructive" });
          return;
      }
      setIsSaving(true);
      try {
          let imageUrls = await uploadImages(imageFiles);
          if (imageUrls.length === 0) {
              imageUrls.push(`https://placehold.co/600x400.png`);
          }

          await addDoc(collection(db, 'offers'), {
              ...newOffer,
              validUntil: addValidUntil ? format(addValidUntil, 'yyyy-MM-dd') : null,
              images: imageUrls,
          });

          toast({ title: "Offer Added", description: "The new offer has been successfully created." });
          resetDialogState();
          setIsAddOfferOpen(false);
      } catch (error) {
          console.error("Error adding offer: ", error);
          toast({ title: "Error", description: "Could not create the offer. Please try again.", variant: "destructive" });
      } finally {
          setIsSaving(false);
      }
  }

  const handleStateSelection = (stateValue: string) => {
    const currentStates = newOffer.states || [];
    const setStateAction = (states: string[]) => setNewOffer(prev => ({ ...prev, states }));
    
    let newStates: string[];

    if (stateValue === 'all') {
        newStates = currentStates.includes('all') ? [] : ['all'];
    } else {
        let filteredStates = currentStates.filter(s => s !== 'all');
        if (filteredStates.includes(stateValue)) {
            newStates = filteredStates.filter(s => s !== stateValue);
        } else {
            newStates = [...filteredStates, stateValue];
        }
    }
    
    if (newStates.length === allStates.length) {
        setStateAction(['all']);
    } else {
        setStateAction(newStates);
    }
  };

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
            <div className="flex items-center gap-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                    Monitoring panel for community activity.
                    </p>
                </div>
            </div>
             <Dialog open={isAddOfferOpen} onOpenChange={setIsAddOfferOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => { resetDialogState(); setIsAddOfferOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Offer
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Offer</DialogTitle>
                        <DialogDescription>Create a new coupon or offer for the community.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
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
                                    !addValidUntil && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {addValidUntil ? format(addValidUntil, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={addValidUntil}
                                        onSelect={setAddValidUntil}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="grid gap-2">
                            <Label>Available States</Label>
                             <Popover>
                                 <PopoverTrigger asChild>
                                  <Button variant="outline" className="justify-start w-full">
                                    {newOffer.states?.includes('all') ? 'All States' : `${newOffer.states?.length || 0} states selected`}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                     <div className="p-4">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Checkbox
                                                id="all-states-add"
                                                checked={newOffer.states?.includes('all')}
                                                onCheckedChange={() => handleStateSelection('all')}
                                            />
                                            <Label htmlFor="all-states-add" className="font-semibold">All States</Label>
                                        </div>
                                        <hr className="my-2" />
                                        <ScrollArea className="h-40">
                                            {allStates.map(state => (
                                                <div key={state.value} className="flex items-center space-x-2 mt-1">
                                                    <Checkbox
                                                        id={`add-${state.value}`}
                                                        checked={newOffer.states?.includes(state.value) || newOffer.states?.includes('all')}
                                                        disabled={newOffer.states?.includes('all')}
                                                        onCheckedChange={() => handleStateSelection(state.value)}
                                                    />
                                                    <Label htmlFor={`add-${state.value}`}>{state.label}</Label>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </div>
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
                                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeUploadedImage(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsAddOfferOpen(false); resetDialogState(); }} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleAddOffer} disabled={isSaving}>
                            {isSaving ? <LoaderCircle className="animate-spin" /> : "Save Offer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
