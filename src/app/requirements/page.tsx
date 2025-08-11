
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Home, ShoppingCart, Calendar } from 'lucide-react';
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
    "General Chat": { icon: Briefcase, color: "bg-gray-100 text-gray-800" }, // Should not be shown
    "Other": { icon: Briefcase, color: "bg-gray-100 text-gray-800" } // Should not be shown
};

const categories: Category[] = ["Jobs", "Housing", "Marketplace", "Events"];

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
                const q = query(
                    collection(db, "chats", "california", "messages"), 
                    where("category", "in", categories), 
                    orderBy("timestamp", "desc")
                );

                const querySnapshot = await getDocs(q);
                const reqs: Requirement[] = [];

                const userPromises = querySnapshot.docs.map(doc => getUserProfile(doc.data().user.id));
                const users = await Promise.all(userPromises);
                const userMap = new Map(users.map(u => [u?.uid, u]));

                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    const timestamp = data.timestamp?.toDate();
                    reqs.push({
                        id: doc.id,
                        user: data.user,
                        text: data.text,
                        time: timestamp ? timestamp.toLocaleTimeString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
                        timestamp: timestamp,
                        category: data.category,
                        title: data.title,
                        userInfo: userMap.get(data.user.id) || undefined
                    } as Requirement);
                });
                
                setAllRequirements(reqs);
                setFilteredRequirements(reqs);
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
                <div className="space-y-4">
                    {filteredRequirements.map(req => <RequirementCard key={req.id} req={req} />)}
                </div>
            )}
        </div>
    );
}
