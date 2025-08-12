
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Home, ShoppingCart, Calendar, FileQuestion, Wrench, Baby, Dog, Stethoscope, Scale, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit, doc, deleteDoc } from 'firebase/firestore';
import type { Message } from '@/services/chat';
import type { Category } from '@/ai/flows/categorize-message';
import { getUserProfile, UserProfile } from '@/services/users';
import { allStates } from '@/lib/states';
import { getCurrentUser } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays } from 'date-fns';

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

const RequirementCard = ({ req, currentUser, onDelete }: { req: Requirement, currentUser: UserProfile | null, onDelete: (req: Requirement) => void }) => {
    const { icon: Icon, color } = categoryConfig[req.category] || categoryConfig["Other"];
    const stateName = allStates.find(s => s.value === req.userInfo?.state)?.label || req.userInfo?.state || '';

    return (
        <Card className="overflow-hidden shadow-md relative group">
            <CardContent className="p-4">
                 {currentUser?.isAdmin && (
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onDelete(req)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg">{req.title}</h3>
                        <p className="text-sm text-muted-foreground">
                            {req.userInfo?.firstName} {req.userInfo?.lastName} &middot; {stateName}
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
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const { toast } = useToast();

     useEffect(() => {
        const fetchUserAndRequirements = async () => {
            setIsLoading(true);
            try {
                const user = await getCurrentUser();
                if (user) {
                    const profile = await getUserProfile(user.uid);
                    setCurrentUser(profile);
                }

                const userIds = new Set<string>();
                let allReqs: Requirement[] = [];

                const stateChatQueries = allStates.map(state => {
                    const messagesCollectionRef = collection(db, 'chats', state.value, 'messages');
                    return query(messagesCollectionRef, orderBy('timestamp', 'desc'), limit(50));
                });

                const querySnapshots = await Promise.all(stateChatQueries.map(q => getDocs(q)));

                querySnapshots.forEach(snapshot => {
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const timestamp = data.timestamp?.toDate();
                        
                        // Auto-delete (hide) requirements older than 7 days
                        if (timestamp && differenceInDays(new Date(), timestamp) > 7) {
                            return; 
                        }

                        if (data.category && categories.includes(data.category)) {
                            if (timestamp) {
                                 userIds.add(data.user.id);
                                 allReqs.push({
                                    id: doc.id,
                                    ...data,
                                    time: timestamp.toLocaleTimeString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                                    timestamp: timestamp,
                                } as Requirement);
                            }
                        }
                    });
                });
                
                if (userIds.size > 0) {
                    const userPromises = Array.from(userIds).map(uid => getUserProfile(uid));
                    const users = (await Promise.all(userPromises)).filter(Boolean) as UserProfile[];
                    const userMap = new Map(users.map(u => [u.uid, u]));
                    
                    const reqsWithUsers = allReqs.map(req => ({
                        ...req,
                        userInfo: userMap.get(req.user.id)
                    }));
                    
                    reqsWithUsers.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                    
                    setAllRequirements(reqsWithUsers);
                    setFilteredRequirements(reqsWithUsers);
                } else {
                    setAllRequirements([]);
                    setFilteredRequirements([]);
                }

            } catch (error) {
                console.error("Error fetching requirements:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserAndRequirements();
    }, []);

    const handleFilter = (category: Category | 'All') => {
        setActiveFilter(category);
        if (category === 'All') {
            setFilteredRequirements(allRequirements);
        } else {
            setFilteredRequirements(allRequirements.filter(r => r.category === category));
        }
    };
    
    const handleDeleteRequirement = async (reqToDelete: Requirement) => {
        if (!currentUser?.isAdmin || !reqToDelete.userInfo?.state) return;
        
        try {
            const messageRef = doc(db, 'chats', reqToDelete.userInfo.state, 'messages', reqToDelete.id);
            await deleteDoc(messageRef);

            // Optimistically update UI
            const updatedReqs = allRequirements.filter(r => r.id !== reqToDelete.id);
            setAllRequirements(updatedReqs);
            if (activeFilter === 'All') {
                setFilteredRequirements(updatedReqs);
            } else {
                setFilteredRequirements(updatedReqs.filter(r => r.category === activeFilter));
            }

            toast({
                title: 'Requirement Deleted',
                description: 'The post has been successfully removed.',
            });
        } catch (error) {
            console.error('Error deleting requirement:', error);
            toast({
                title: 'Error',
                description: 'Could not delete the requirement. Please try again.',
                variant: 'destructive',
            });
        }
    }
    
    return (
        <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Community Requirements</h1>
              <p className="text-muted-foreground">
                  AI-detected needs and opportunities from all state chats.
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
                <div className="text-center py-10">
                    <p>Loading requirements...</p>
                </div>
            ) : (
                filteredRequirements.length > 0 ? (
                    <div className="space-y-4">
                        {filteredRequirements.map(req => <RequirementCard key={req.id} req={req} currentUser={currentUser} onDelete={handleDeleteRequirement} />)}
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
