
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile } from "@/services/users";
import { Trash2, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Offer {
  id: string;
  title: string;
  description: string;
  image: string;
  hint: string;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  return (
    <div className="space-y-8 p-4 md:p-6">
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
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <CardTitle>{offer.title}</CardTitle>
                <CardDescription className="mt-2">{offer.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                {currentUser?.isAdmin ? (
                    <Button className="w-full" variant="destructive" onClick={() => handleDeleteOffer(offer.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Offer
                    </Button>
                ) : (
                    <Button className="w-full">View Deal</Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
