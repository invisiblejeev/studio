
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, setDoc, writeBatch } from "firebase/firestore";
import type { UserProfile } from "@/services/users";
import { Database, PartyPopper, AlertTriangle } from "lucide-react";

const sampleUsers: Omit<UserProfile, 'uid'>[] = [
  {
    firstName: "Amit",
    lastName: "Patel",
    username: "amitp",
    email: "amit.patel@example.com",
    state: "california",
    city: "San Francisco",
    phone: "123-456-7890",
    avatar: "https://i.pravatar.cc/150?u=amitp"
  },
  {
    firstName: "Priya",
    lastName: "Sharma",
    username: "priyas",
    email: "priya.sharma@example.com",
    state: "new-york",
    city: "New York City",
    phone: "234-567-8901",
    avatar: "https://i.pravatar.cc/150?u=priyas"
  },
  {
    firstName: "Rajesh",
    lastName: "Kumar",
    username: "rajk",
    email: "raj.kumar@example.com",
    state: "texas",
    city: "Houston",
    phone: "345-678-9012",
    avatar: "https://i.pravatar.cc/150?u=rajk"
  },
  {
    firstName: "Sunita",
    lastName: "Gupta",
    username: "sunitag",
    email: "sunita.gupta@example.com",
    state: "illinois",
    city: "Chicago",
    phone: "456-789-0123",
    avatar: "https://i.pravatar.cc/150?u=sunitag"
  },
  {
    firstName: "Vikram",
    lastName: "Singh",
    username: "viksingh",
    email: "vikram.singh@example.com",
    state: "florida",
    city: "Miami",
    phone: "567-890-1234",
    avatar: "https://i.pravatar.cc/150?u=viksingh"
  },
  {
    firstName: "jeevitesh",
    lastName: "reddy",
    username: "invisiblejeev",
    email: "jeevitesh.reddy@example.com",
    state: "virginia",
    city: "Chantilly",
    phone: "703-703-5959",
    avatar: "https://i.pravatar.cc/150?u=invisiblejeev"
  }
];


export default function SeedDataPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSeedDatabase = async () => {
        setIsLoading(true);
        try {
            const batch = writeBatch(db);
            
            sampleUsers.forEach((user, index) => {
                // NOTE: These UIDs are placeholders. For real users, Firebase Auth generates these.
                const uid = `sampleuser${index + 1}`; 
                const userRef = doc(db, "users", uid);
                batch.set(userRef, { ...user, uid });
            });
            
            await batch.commit();

            toast({
                title: "Database Seeded!",
                description: `${sampleUsers.length} sample users have been added to the 'users' collection.`,
                action: <PartyPopper className="w-5 h-5 text-green-500" />,
            });
        } catch (error) {
            console.error("Error seeding database:", error);
            toast({
                title: "Error Seeding Database",
                description: "Could not add sample users. Check the console for more details.",
                variant: "destructive",
                action: <AlertTriangle className="w-5 h-5" />,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database />
                        Seed Sample Data
                    </CardTitle>
                    <CardDescription>
                        Click the button below to add {sampleUsers.length} sample user profiles to your Firestore database. This is useful for testing and development.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={handleSeedDatabase} 
                        disabled={isLoading} 
                        className="w-full"
                    >
                        {isLoading ? "Seeding..." : `Add ${sampleUsers.length} Sample Users`}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                        <strong>Note:</strong> This action will create documents in the 'users' collection. If documents with the same IDs exist, they will be overwritten.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
