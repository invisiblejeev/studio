
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

const offers = [
  { id: 1, title: "20% off at Bombay House", description: "Enjoy 20% off your entire meal. Valid for dine-in only.", image: "https://placehold.co/600x400.png", hint: "indian food" },
  { id: 2, title: "Free Samosas at Delhi Delights", description: "Get a free plate of samosas with any order over $25.", image: "https://placehold.co/600x400.png", hint: "samosas food" },
  { id: 3, title: "$5 off Movie Tickets", description: "Get $5 off your next movie ticket for any Bollywood film.", image: "https://placehold.co/600x400.png", hint: "cinema movie" },
  { id: 4, title: "15% off at India Grocers", description: "Stock up on your favorite Indian groceries and save 15%.", image: "https://placehold.co/600x400.png", hint: "groceries market" },
  { id: 5, title: "Buy 1 Get 1 Free Lassi", description: "At 'The Lassi Corner', buy any lassi and get another one for free.", image: "https://placehold.co/600x400.png", hint: "lassi drink" },
  { id: 6, title: "Early Bird Discount on Event Tickets", description: "10% off on all tickets for the upcoming Holi festival event.", image: "https://placehold.co/600x400.png", hint: "holi festival" },
];

export default function OffersPage() {
  return (
    <div className="space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coupons &amp; Offers</h1>
        <p className="text-muted-foreground">
          Exclusive deals for our community members.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {offers.map(offer => (
          <Card key={offer.id} className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="aspect-video relative">
                <Image src={offer.image} alt={offer.title} fill className="object-cover" data-ai-hint={offer.hint} />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle>{offer.title}</CardTitle>
              <CardDescription className="mt-2">{offer.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button className="w-full">View Deal</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
