
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, query, orderBy, addDoc, updateDoc } from 'firebase/firestore';
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile } from "@/services/users";
import { Trash2, LoaderCircle, Plus, CalendarIcon, Ticket, Pencil, Upload, Image as ImageIcon, X, Megaphone, MapPin, Copy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { allStates } from "@/lib/states";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";


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

export default function OffersPage() {
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Add/Edit Dialogs
  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  const [newOffer, setNewOffer] = useState(initialNewOfferState);
  const [addValidUntil, setAddValidUntil] = useState<Date | undefined>();
  const [isEditOfferOpen, setIsEditOfferOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editValidUntil, setEditValidUntil] = useState<Date | undefined>();
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);

  // State for card flip
  const [flippedOffers, setFlippedOffers] = useState<Set<string>>(new Set());

  // State for Image Upload
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoplay = useRef(
      Autoplay({ delay: 3000, stopOnInteraction: true })
    );

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
        setAllOffers(offersData);
        // We set loading to false here so the next effect can run
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching offers: ", error);
        toast({ title: "Error", description: "Could not fetch offers.", variant: "destructive" });
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);
  
  useEffect(() => {
    if (isLoading) return;

    const userState = currentUser?.state;
    const visibleOffers = allOffers.filter(offer => {
        // If an offer has no state restrictions (old data), everyone sees it.
        if (!offer.states || offer.states.length === 0) {
            return true;
        }
        // If it's for 'all' states, everyone sees it.
        if (offer.states.includes('all')) {
            return true;
        }
        // If the user has a state, check if their state is in the offer's list.
        if (userState && offer.states.includes(userState)) {
            return true;
        }
        // Otherwise, hide it.
        return false;
    });
    setFilteredOffers(visibleOffers);

  }, [allOffers, currentUser, isLoading]);

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
  
  const removeImage = (index: number, isEditing: boolean = false) => {
    if (isEditing && editingOffer) {
        const updatedImages = [...(editingOffer.images || [])];
        updatedImages.splice(index, 1);
        setEditingOffer({...editingOffer, images: updatedImages });
    } else {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  }
  
  const removeUploadedImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }


  const resetDialogState = () => {
    setNewOffer(initialNewOfferState);
    setEditingOffer(null);
    setAddValidUntil(undefined);
    setEditValidUntil(undefined);
    setImageFiles([]);
    setImagePreviews([]);
  };

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

  const handleEditOffer = async () => {
    if (!editingOffer) return;
     if (!editingOffer.title || !editingOffer.description) {
          toast({ title: "Missing Fields", description: "Please fill out title and description.", variant: "destructive" });
          return;
      }
      setIsSaving(true);
      try {
          const offerRef = doc(db, 'offers', editingOffer.id);
          
          const newImageUrls = await uploadImages(imageFiles);
          const finalImages = [...(editingOffer.images || []), ...newImageUrls];

          const updateData: Partial<Offer> & { [key: string]: any } = {
            ...editingOffer,
            images: finalImages.length > 0 ? finalImages : ['https://placehold.co/600x400.png'],
            validUntil: editValidUntil ? format(editValidUntil, 'yyyy-MM-dd') : null,
          };
          delete updateData.id;

          await updateDoc(offerRef, updateData);
          toast({ title: "Offer Updated", description: "The offer has been successfully updated."});
          setIsEditOfferOpen(false);
          resetDialogState();
      } catch (error) {
          console.error("Error updating offer: ", error);
          toast({ title: "Error", description: "Could not update the offer. Please try again.", variant: "destructive" });
      } finally {
          setIsSaving(false);
      }
  }

  const openEditDialog = (offer: Offer) => {
    resetDialogState();
    setEditingOffer({ ...offer, images: offer.images || [], states: offer.states || ['all'] });
    setEditValidUntil(offer.validUntil ? parse(offer.validUntil, 'yyyy-MM-dd', new Date()) : undefined);
    setImagePreviews([]); // New previews for newly added files in edit mode
    setImageFiles([]);
    setIsEditOfferOpen(true);
  }

  const openAddDialog = () => {
    resetDialogState();
    setIsAddOfferOpen(true);
  }

  const handleStateSelection = (stateValue: string, isEditing: boolean) => {
    const currentStates = (isEditing ? editingOffer?.states : newOffer.states) || [];
    const setStateAction = isEditing
        ? (states: string[]) => setEditingOffer(prev => prev ? { ...prev, states } : null)
        : (states: string[]) => setNewOffer(prev => ({ ...prev, states }));

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

  const toggleCardFlip = (offerId: string) => {
    setFlippedOffers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(offerId)) {
            newSet.delete(offerId);
        } else {
            newSet.add(offerId);
        }
        return newSet;
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
        title: "Code Copied!",
        description: `Coupon code "${code}" has been copied to your clipboard.`,
    });
  }


  return (
    <div className="space-y-8 p-4 md:p-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Coupons &amp; Offers</h1>
            <p className="text-muted-foreground">
            Exclusive deals for our community members.
            </p>
        </div>
        {currentUser?.isAdmin && (
            <Dialog open={isAddOfferOpen} onOpenChange={setIsAddOfferOpen}>
                <DialogTrigger asChild>
                    <Button onClick={openAddDialog}>
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
                                                onCheckedChange={() => handleStateSelection('all', false)}
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
                                                        onCheckedChange={() => handleStateSelection(state.value, false)}
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
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <LoaderCircle className="w-8 h-8 animate-spin" />
          <p className="ml-2">Loading offers...</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          <h3 className="text-lg font-semibold">No Offers Available</h3>
          <p className="text-sm">Check back later for new deals or check if your profile state is set.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map(offer => (
            <div key={offer.id} className="perspective-1000">
              <div className={cn("relative h-full w-full transform-style-3d transition-transform duration-700", flippedOffers.has(offer.id) && "rotate-y-180")}>
                {/* Card Front */}
                <div className="backface-hidden w-full h-full">
                    <Card className="overflow-hidden flex flex-col h-full">
                    <CardHeader className="p-0 relative">
                        <Carousel className="w-full"
                            plugins={[autoplay.current]}
                            onMouseEnter={autoplay.current.stop}
                            onMouseLeave={autoplay.current.reset}
                        >
                            <CarouselContent>
                                {offer.images && offer.images.length > 0 ? (
                                    offer.images.map((image, index) => (
                                        <CarouselItem key={index}>
                                            <div className="aspect-video relative">
                                                <Image src={image} alt={`${offer.title} image ${index + 1}`} fill className="object-cover" />
                                            </div>
                                        </CarouselItem>
                                    ))
                                ) : (
                                    <CarouselItem>
                                        <div className="aspect-video relative">
                                            <Image src="https://placehold.co/600x400.png" data-ai-hint="deal offer" alt="Placeholder" fill className="object-cover" />
                                        </div>
                                    </CarouselItem>
                                )}
                            </CarouselContent>
                        </Carousel>
                        {offer.type && <Badge className="absolute top-2 right-2 z-10">{offer.type}</Badge>}
                        {offer.images && offer.images.length > 1 && <Badge variant="secondary" className="absolute top-2 left-2 z-10">{offer.images.length} photos</Badge>}

                    </CardHeader>
                    <CardContent className="p-4 flex-1">
                        <CardTitle className="text-lg">{offer.title}</CardTitle>
                        <CardDescription className="mt-1 text-sm">{offer.description}</CardDescription>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                            {offer.validUntil && (
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4"/>
                                    <span>Valid Until: {format(new Date(offer.validUntil), "PPP")}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 pt-1">
                                <MapPin className="w-4 h-4" />
                                {offer.states && offer.states.length > 0 && offer.states.includes('all') ? (
                                    <Badge variant="outline">Nationwide</Badge>
                                ) : (
                                    <span className="capitalize">
                                        {offer.states?.map(s => allStates.find(as => as.value === s)?.label || s).join(', ')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="p-2 pt-0">
                        {currentUser?.isAdmin ? (
                            <div className="w-full flex gap-2">
                                <Button className="w-full" variant="outline" size="sm" onClick={() => openEditDialog(offer)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                </Button>
                                <Button className="w-full" variant="destructive" size="sm" onClick={() => handleDeleteOffer(offer.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </Button>
                            </div>
                        ) : (
                            <Button className="w-full" size="sm" onClick={() => offer.code ? toggleCardFlip(offer.id) : null}>
                            <Ticket className="mr-2 h-4 w-4" />
                            {offer.code ? "View Deal" : "See Details"}
                            </Button>
                        )}
                    </CardFooter>
                    </Card>
                </div>
                {/* Card Back */}
                <div className="absolute top-0 left-0 w-full h-full backface-hidden rotate-y-180">
                     <Card className="flex flex-col h-full items-center justify-center bg-muted">
                        <CardHeader>
                            <CardTitle>Coupon Code</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <div className="border-2 border-dashed border-primary/50 bg-background rounded-md p-4 mb-4">
                                <p className="text-2xl font-bold tracking-widest text-primary">{offer.code}</p>
                            </div>
                             <Button onClick={() => handleCopyCode(offer.code || '')}>
                                <Copy className="mr-2 h-4 w-4"/>
                                Copy Code
                             </Button>
                        </CardContent>
                        <CardFooter>
                             <Button variant="outline" onClick={() => toggleCardFlip(offer.id)}>
                                <RotateCcw className="mr-2 h-4 w-4"/>
                                Flip Back
                             </Button>
                        </CardFooter>
                    </Card>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

        {!currentUser?.isAdmin && (
            <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
                <DialogTrigger asChild>
                     <Button className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-30 md:bottom-8 md:right-8 flex items-center justify-center">
                        <Megaphone className="h-6 w-6" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Promote Your Business</DialogTitle>
                        <DialogDescription>
                            Want to feature your coupon or offer here? Contact an administrator to get it listed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p>To have your offer or coupon added to the Indian Community Chat app, please send an email with the details of your offer to:</p>
                        <p className="font-semibold my-2 text-center text-lg">admin@indiancommunity.com</p>
                        <p>An administrator will review your submission and add it to the page if it's a good fit for our community.</p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsPromoteDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}

      {currentUser?.isAdmin && editingOffer && (
            <Dialog open={isEditOfferOpen} onOpenChange={setIsEditOfferOpen}>
              <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                      <DialogTitle>Edit Offer</DialogTitle>
                      <DialogDescription>Update the details for this offer.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                      <div className="grid gap-2">
                          <Label htmlFor="title-edit">Title</Label>
                          <Input id="title-edit" value={editingOffer.title} onChange={(e) => setEditingOffer({...editingOffer, title: e.target.value})} />
                      </div>
                      <div className="grid gap-2">
                          <Label htmlFor="description-edit">Description</Label>
                          <Textarea id="description-edit" value={editingOffer.description} onChange={(e) => setEditingOffer({...editingOffer, description: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                              <Label htmlFor="code-edit">Coupon Code</Label>
                              <Input id="code-edit" placeholder="e.g., DIWALI20" value={editingOffer.code || ''} onChange={(e) => setEditingOffer({...editingOffer, code: e.target.value})} />
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="type-edit">Offer Type</Label>
                              <Select onValueChange={(value) => setEditingOffer({...editingOffer, type: value})} value={editingOffer.type || ''}>
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
                                  !editValidUntil && "text-muted-foreground"
                                  )}
                              >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {editValidUntil ? format(editValidUntil, "PPP") : <span>Pick a date</span>}
                              </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                  <Calendar
                                      mode="single"
                                      selected={editValidUntil}
                                      onSelect={setEditValidUntil}
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
                                    {editingOffer.states?.includes('all') ? 'All States' : `${editingOffer.states?.length || 0} states selected`}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                     <div className="p-4">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Checkbox
                                                id="all-states-edit"
                                                checked={editingOffer.states?.includes('all')}
                                                onCheckedChange={() => handleStateSelection('all', true)}
                                            />
                                            <Label htmlFor="all-states-edit" className="font-semibold">All States</Label>
                                        </div>
                                        <hr className="my-2" />
                                        <ScrollArea className="h-40">
                                            {allStates.map(state => (
                                                <div key={state.value} className="flex items-center space-x-2 mt-1">
                                                    <Checkbox
                                                        id={`edit-${state.value}`}
                                                        checked={editingOffer.states?.includes(state.value) || editingOffer.states?.includes('all')}
                                                        disabled={editingOffer.states?.includes('all')}
                                                        onCheckedChange={() => handleStateSelection(state.value, true)}
                                                    />
                                                    <Label htmlFor={`edit-${state.value}`}>{state.label}</Label>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </div>
                                </PopoverContent>
                           </Popover>
                        </div>
                      <div className="grid gap-2">
                          <Label>Offer Images</Label>
                          <div className="flex flex-wrap gap-2">
                              {(editingOffer.images || []).map((image, index) => (
                                  <div key={`existing-${index}`} className="relative w-20 h-20">
                                      <Image src={image} alt={`existing offer image ${index}`} layout="fill" className="rounded-md object-cover" />
                                      <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeImage(index, true)}>
                                          <X className="h-4 w-4" />
                                      </Button>
                                  </div>
                              ))}
                              {imagePreviews.map((preview, index) => (
                                  <div key={`new-${index}`} className="relative w-20 h-20">
                                      <Image src={preview} alt={`new preview ${index}`} layout="fill" className="rounded-md object-cover" />
                                      <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeUploadedImage(index)}>
                                          <X className="h-4 w-4" />
                                      </Button>
                                  </div>
                              ))}
                          </div>
                          <Button variant="outline" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                              <Upload className="mr-2 h-4 w-4" /> Add More Images
                          </Button>
                          <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleImageFileChange} accept="image/*" />
                      </div>
                  </div>
                  <DialogFooter>
                      <Button variant="outline" onClick={() => { setIsEditOfferOpen(false); resetDialogState(); }} disabled={isSaving}>Cancel</Button>
                      <Button onClick={handleEditOffer} disabled={isSaving}>
                          {isSaving ? <LoaderCircle className="animate-spin" /> : "Save Changes"}
                      </Button>
                  </DialogFooter>
              </DialogContent>
            </Dialog>
        )}
    </div>
  )
}

    