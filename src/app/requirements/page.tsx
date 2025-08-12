
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Home, ShoppingCart, Calendar, FileQuestion, Wrench, Baby, Dog, Stethoscope, Scale } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { Message } from '@/services/chat';
import type { Category } from '@/ai/flows/categorize-message';
import { getUserProfile, UserProfile } from '@/services/users';

const categoryConfig: Record<Category, { icon: React.ElementType, color: string }> = {
    "Jobs": { icon: Briefcase, color: "bg-blue-100 text-blue-800" },
    "Housing": { icon: Home, color: "bg-green-100 text-green-800" },
    "Marketplace": { icon: ShoppingCart, color: "bg-yellow-100 text-yellow-800" },
    "Events": { icon: Calendar, color: "bg-purple-100 text-purple-800" },
    "Plumber": { icon: Wrench, color: "bg-cyan-100 text-cyan-800" },
    "Babysitter": { icon: Baby, color: "bg-pink-100 text-pink-800" },
    "Pet Care": { icon: Dog, color: "bg-orange-100 text-orange-800" },
    "Doctor": { icon: Stethoscope, color: "bg-red-100 text-red-800" },
    "Lawyer": { icon: Scale, color: "bg-indigo-100 text-indigo-800" },
    "General Chat": { icon: FileQuestion, color: "bg-gray-100 text-gray-800" }, 
    "Other": { icon: FileQuestion, color: "bg-gray-100 text-gray-800" }
};

const categories: Category[] = ["Jobs", "Housing", "Marketplace", "Events", "Plumber", "Babysitter", "Pet Care", "Doctor", "Lawyer"];

interface Requirement extends Message {
    category: Category;
    title: string;
    userInfo?: UserProfile;
}

const RequirementCard = ({ req }: { req: Requirement }) => {
    const { icon: Icon, color } = categoryConfig[req.category] || categoryConfig["Other"];

    return (
        <Card className="overflow-hidden shadow-md">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg">{req.title}</h3>
                        <p className="text-sm text-muted-foreground">
                            {req.userInfo?.firstName} {req.userInfo?.lastName} &middot; {req.userInfo?.state ? (req.userInfo.state.charAt(0).toUpperCase() + req.userInfo.state.slice(1)) : ''}
                        </p>
                        <p className="mt-2 text-foreground">{req.text}</p>
                        <p className="text-xs text-muted-foreground mt-3">{req.time}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function RequirementsPage() {
    const [allRequirements, setAllRequirements] = useState<Requirement[]>([]);
    const [filteredRequirements, setFilteredRequirements] = useState<Requirement[]>([]);
    const [activeFilter, setActiveFilter] = useState<Category | 'All'>('All');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRequirements = async () => {
            setIsLoading(true);
            try {
                // Fetch for each category separately to avoid composite index requirement
                const allReqs: Requirement[] = [];
                const userIds = new Set<string>();

                for (const category of categories) {
                    const q = query(
                        collection(db, "chats", "california", "messages"), 
                        where("category", "==", category),
                        orderBy("timestamp", "desc")
                    );
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach(doc => {
                        const data = doc.data();
                        const timestamp = data.timestamp?.toDate();
                        if (timestamp) {
                            userIds.add(data.user.id);
                            allReqs.push({
                                id: doc.id,
                                ...data,
                                time: timestamp ? timestamp.toLocaleTimeString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
                                timestamp: timestamp,
                            } as Requirement);
                        }
                    });
                }

                // Fetch user profiles for all unique users
                const userPromises = Array.from(userIds).map(uid => getUserProfile(uid));
                const users = (await Promise.all(userPromises)).filter(Boolean) as UserProfile[];
                const userMap = new Map(users.map(u => [u.uid, u]));

                // Add userInfo to requirements
                const reqsWithUsers = allReqs.map(req => ({
                    ...req,
                    userInfo: userMap.get(req.user.id)
                }));
                
                // Sort combined results by timestamp
                reqsWithUsers.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                
                setAllRequirements(reqsWithUsers);
                setFilteredRequirements(reqsWithUsers);
            } catch (error) {
                console.error("Error fetching requirements:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequirements();
    }, []);

    const handleFilter = (category: Category | 'All') => {
        setActiveFilter(category);
        if (category === 'All') {
            setFilteredRequirements(allRequirements);
        } else {
            setFilteredRequirements(allRequirements.filter(r => r.category === category));
        }
    };
    
    return (
        <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Community Requirements</h1>
              <p className="text-muted-foreground">
                  AI-detected needs and opportunities
              </p>
            </div>
            
            <div className="flex space-x-2 overflow-x-auto pb-2">
                <Button
                    variant={activeFilter === 'All' ? 'default' : 'outline'}
                    className={`rounded-full px-4 py-1 h-auto text-sm ${activeFilter === 'All' ? '' : 'bg-white'}`}
                    onClick={() => handleFilter('All')}
                >
                    All
                </Button>
                {categories.map(cat => (
                    <Button
                        key={cat}
                        variant={activeFilter === cat ? 'default' : 'outline'}
                        className={`rounded-full px-4 py-1 h-auto text-sm ${activeFilter === cat ? '' : 'bg-white'}`}
                        onClick={() => handleFilter(cat)}
                    >
                        {cat}
                    </Button>
                ))}
            </div>

            {isLoading ? (
                <p>Loading requirements...</p>
            ) : (
                filteredRequirements.length > 0 ? (
                    <div className="space-y-4">
                        {filteredRequirements.map(req => <RequirementCard key={req.id} req={req} />)}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <FileQuestion className="mx-auto w-12 h-12 mb-4" />
                        <h3 className="text-lg font-semibold">No Requirements Found</h3>
                        <p className="text-sm">There are currently no items in this category.</p>
                    </div>
                )
            )}
        </div>
    );
}
