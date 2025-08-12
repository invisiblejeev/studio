
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, query, orderBy, addDoc } from 'firebase/firestore';
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile } from "@/services/users";
import { Trash2, LoaderCircle, Plus, CalendarIcon, Tag, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";

interface Offer {
  id: string;
  title: string;
  description: string;
  image: string;
  hint: string;
  code?: string;
  validUntil?: string;
  type?: string;
}

const initialNewOfferState = {
    title: '',
    description: '',
    hint: '',
    code: '',
    type: ''
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  const [newOffer, setNewOffer] = useState(initialNewOfferState);
  const [validUntil, setValidUntil] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
        const user = await getCurrentUser();
        if (user) {
            const profile = await getUserProfile(user.uid);
            setCurrentUser(profile);
        }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const offersQuery = query(collection(db, 'offers'), orderBy('title'));
    const unsubscribe = onSnapshot(offersQuery, (snapshot) => {
        const offersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
        setOffers(offersData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching offers: ", error);
        toast({ title: "Error", description: "Could not fetch offers.", variant: "destructive" });
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const handleDeleteOffer = async (offerId: string) => {
    if (!currentUser?.isAdmin) {
        toast({ title: "Unauthorized", description: "You are not authorized to delete offers.", variant: "destructive" });
        return;
    }
    try {
        await deleteDoc(doc(db, 'offers', offerId));
        toast({ title: "Offer Deleted", description: "The offer has been removed." });
    } catch (error) {
        console.error("Error deleting offer: ", error);
        toast({ title: "Error", description: "Could not delete the offer. Please try again.", variant: "destructive" });
    }
  }

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

  return (
    <div className="space-y-8 p-4 md:p-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coupons &amp; Offers</h1>
        <p className="text-muted-foreground">
          Exclusive deals for our community members.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <LoaderCircle className="w-8 h-8 animate-spin" />
          <p className="ml-2">Loading offers...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          <h3 className="text-lg font-semibold">No Offers Available</h3>
          <p className="text-sm">Check back later for new deals!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map(offer => (
            <Card key={offer.id} className="overflow-hidden flex flex-col">
              <CardHeader className="p-0">
                <div className="aspect-video relative">
                  <Image src={offer.image} alt={offer.title} fill className="object-cover" data-ai-hint={offer.hint} />
                  {offer.type && <Badge className="absolute top-2 right-2">{offer.type}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <CardTitle>{offer.title}</CardTitle>
                <CardDescription className="mt-2">{offer.description}</CardDescription>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {offer.code && (
                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4"/>
                            <span>Code: <span className="font-semibold text-foreground">{offer.code}</span></span>
                        </div>
                    )}
                    {offer.validUntil && (
                         <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4"/>
                            <span>Valid Until: {format(new Date(offer.validUntil), "PPP")}</span>
                        </div>
                    )}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                {currentUser?.isAdmin ? (
                    <Button className="w-full" variant="destructive" onClick={() => handleDeleteOffer(offer.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Offer
                    </Button>
                ) : (
                    <Button className="w-full">
                       <Ticket className="mr-2 h-4 w-4" />
                       View Deal
                    </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {currentUser?.isAdmin && (
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
      )}
    </div>
  )
}
