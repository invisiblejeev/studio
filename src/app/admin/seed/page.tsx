
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, setDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import type { UserProfile } from "@/services/users";
import { Bot, Database, PartyPopper, AlertTriangle } from "lucide-react";

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
];

const sampleSpamReports = [
    { 
        status: "HIDDEN",
        message: "Get rich quick! Make $5000 per day working from home!", 
        user: "spam.user@email.com",
        state: "California",
        keywords: ["get rich quick", "make money"]
    },
    { 
        status: "HIDDEN",
        message: "Buy cheap medications online without prescription", 
        user: "suspicious.account@email.com",
        state: "Texas",
        keywords: ["medications", "without prescription"]
    },
    { 
        status: "PENDING",
        message: "Free iPhone giveaway! Click this link now!", 
        user: "fake.giveaway@email.com",
        state: "New York",
        keywords: []
    },
];

const sampleDailySummary = {
    summary: "Today, we saw a total of 1018 messages. 209 messages were flagged as spam, primarily due to keywords like 'FREE' and 'make money'. The AI successfully categorized 186 job-related queries, 305 event discussions, and 237 buy/sell requests, helping to keep our community channels organized."
}


export default function SeedDataPage() {
    const [isUserLoading, setIsUserLoading] = useState(false);
    const [isAdminLoading, setIsAdminLoading] = useState(false);
    const { toast } = useToast();

    const handleSeedUsers = async () => {
        setIsUserLoading(true);
        try {
            const batch = writeBatch(db);
            
            sampleUsers.forEach((user, index) => {
                const uid = `sampleuser${index + 1}`; 
                const userRef = doc(db, "users", uid);
                batch.set(userRef, { ...user, uid });
            });
            
            await batch.commit();

            toast({
                title: "Database Seeded!",
                description: `${sampleUsers.length} sample users have been added.`,
                action: <PartyPopper className="w-5 h-5 text-green-500" />,
            });
        } catch (error: any) {
            console.error("Error seeding users:", error);
             let description = "Could not add sample users. Check the console.";
            if (error.code === 'permission-denied') {
                description = "Permission Denied. Please check your Firestore security rules to allow writes to the 'users' collection.";
            }
            toast({
                title: "Error Seeding Users",
                description: description,
                variant: "destructive",
                action: <AlertTriangle className="w-5 h-5" />,
            });
        } finally {
            setIsUserLoading(false);
        }
    };

    const handleSeedAdminData = async () => {
        setIsAdminLoading(true);
        try {
            const batch = writeBatch(db);
            
            sampleSpamReports.forEach(report => {
                const reportRef = doc(db, "spam-reports", `sample-report-${Math.random()}`);
                batch.set(reportRef, { ...report, timestamp: serverTimestamp() });
            });

            const summaryRef = doc(db, "daily-summaries", "latest-summary");
            batch.set(summaryRef, { ...sampleDailySummary, timestamp: serverTimestamp() });
            
            await batch.commit();

            toast({
                title: "Admin Data Seeded!",
                description: `Added ${sampleSpamReports.length} spam reports and a daily summary.`,
                action: <PartyPopper className="w-5 h-5 text-green-500" />,
            });
        } catch (error: any) {
            console.error("Error seeding admin data:", error);
            let description = "Could not add sample data. Check the console.";
            if (error.code === 'permission-denied') {
                description = "Permission Denied. Please check your Firestore security rules to allow writes to the 'spam-reports' and 'daily-summaries' collections.";
            }
            toast({
                title: "Error Seeding Admin Data",
                description: description,
                variant: "destructive",
                action: <AlertTriangle className="w-5 h-5" />,
            });
        } finally {
            setIsAdminLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-8">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database />
                        Seed User Data
                    </CardTitle>
                    <CardDescription>
                        Click the button below to add {sampleUsers.length} sample user profiles to your Firestore database. This is useful for testing and development.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={handleSeedUsers} 
                        disabled={isUserLoading} 
                        className="w-full"
                    >
                        {isUserLoading ? "Seeding..." : `Add ${sampleUsers.length} Sample Users`}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                        <strong>Note:</strong> This action will create documents in the 'users' collection. If documents with the same IDs exist, they will be overwritten.
                    </p>
                </CardContent>
            </Card>

             <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot />
                        Seed Admin Dashboard Data
                    </CardTitle>
                    <CardDescription>
                        Click the button below to add sample spam reports and an AI daily summary to your Firestore database.
                    </Description>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={handleSeedAdminData} 
                        disabled={isAdminLoading} 
                        className="w-full"
                        variant="secondary"
                    >
                        {isAdminLoading ? "Seeding..." : `Add Sample Admin Data`}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                        <strong>Note:</strong> This will create documents in 'spam-reports' and 'daily-summaries' collections.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
