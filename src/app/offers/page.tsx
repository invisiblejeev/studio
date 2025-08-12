
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, query, orderBy, addDoc, updateDoc } from 'firebase/firestore';
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile } from "@/services/users";
import { Trash2, LoaderCircle, Plus, CalendarIcon, Tag, Ticket, Pencil, Upload, Image as ImageIcon, X } from "lucide-react";
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


interface Offer {
  id: string;
  title: string;
  description: string;
  images: string[];
  code?: string;
  validUntil?: string;
  type?: string;
}

const initialNewOfferState = {
    title: '',
    description: '',
    code: '',
    type: ''
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Add/Edit Dialogs
  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  const [newOffer, setNewOffer] = useState(initialNewOfferState);
  const [addValidUntil, setAddValidUntil] = useState<Date | undefined>();
  const [isEditOfferOpen, setIsEditOfferOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editValidUntil, setEditValidUntil] = useState<Date | undefined>();

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
        setOffers(offersData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching offers: ", error);
        toast({ title: "Error", description: "Could not fetch offers.", variant: "destructive" });
        setIsLoading(false);
    });
    return () => unsubscribe();
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
    setEditingOffer({ ...offer, images: offer.images || [] });
    setEditValidUntil(offer.validUntil ? parse(offer.validUntil, 'yyyy-MM-dd', new Date()) : undefined);
    setImagePreviews([]); // New previews for newly added files in edit mode
    setImageFiles([]);
    setIsEditOfferOpen(true);
  }

  const openAddDialog = () => {
    resetDialogState();
    setIsAddOfferOpen(true);
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
                    <Button className="w-full" size="sm">
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
        <>
            {/* Add Offer Dialog */}
            <Dialog open={isAddOfferOpen} onOpenChange={setIsAddOfferOpen}>
                <DialogTrigger asChild>
                    <Button onClick={openAddDialog} className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-30 md:bottom-8 md:right-8">
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

            {/* Edit Offer Dialog */}
            {editingOffer && (
                 <Dialog open={isEditOfferOpen} onOpenChange={setIsEditOfferOpen}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Edit Offer</DialogTitle>
                            <DialogDescription>Update the details for this offer.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
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
        </>
      )}
    </div>
  )
}
