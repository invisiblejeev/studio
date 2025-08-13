
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Briefcase, Home, ShoppingCart, Calendar, FileQuestion, Wrench, Baby, Dog, Stethoscope, Scale, Trash2, Clock, MessageSquare, Pencil, LoaderCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { Message } from '@/services/chat';
import type { Category } from '@/ai/flows/categorize-message';
import { getUserProfile, UserProfile } from '@/services/users';
import { allStates } from '@/lib/states';
import { getCurrentUser } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, formatDistanceToNowStrict } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

const RequirementCard = ({ req, currentUser, onDelete, onEdit }: { req: Requirement, currentUser: UserProfile | null, onDelete: (req: Requirement) => void, onEdit: (req: Requirement) => void }) => {
    const { icon: Icon, color } = categoryConfig[req.category] || categoryConfig["Other"];
    const stateName = allStates.find(s => s.value === req.userInfo?.state)?.label || req.userInfo?.state || '';
    const router = useRouter();

    const getExpiryInfo = () => {
        if (!req.timestamp) return null;
        const daysOld = differenceInDays(new Date(), req.timestamp);
        const daysLeft = 7 - daysOld;
        if (daysLeft <= 1) {
            return "Expires soon";
        }
        return `Expires in ${daysLeft} days`;
    };
    
    const expiryInfo = getExpiryInfo();
    const isAuthor = currentUser?.uid === req.user.id;


    return (
        <Card className="overflow-hidden shadow-md relative group flex flex-col">
            <CardContent className="p-4 pb-2 flex-1">
                 {currentUser?.isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7 bg-white"
                            onClick={() => onEdit(req)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => onDelete(req)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
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
                         <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                            <span>{req.time}</span>
                            {expiryInfo && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3"/>
                                    {expiryInfo}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
            {!isAuthor && req.userInfo && (
                <CardFooter className="p-2 pt-0">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full" 
                        onClick={() => router.push(`/chat/user/${req.userInfo?.uid}`)}
                    >
                        <MessageSquare className="mr-2 h-4 w-4" /> Send Private Message
                    </Button>
                </CardFooter>
            )}
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

    // Edit State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
    const [isSaving, setIsSaving] = useState(false);

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
                        
                        if (timestamp && differenceInDays(new Date(), timestamp) > 7) {
                            return; 
                        }

                        if (data.category && categories.includes(data.category)) {
                            if (timestamp) {
                                 userIds.add(data.user.id);
                                 allReqs.push({
                                    id: doc.id,
                                    ...data,
                                    time: formatDistanceToNowStrict(timestamp, { addSuffix: true }),
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

    const openEditDialog = (req: Requirement) => {
        setEditingRequirement(req);
        setIsEditDialogOpen(true);
    };

    const handleSaveChanges = async () => {
        if (!editingRequirement || !editingRequirement.userInfo?.state) return;
        setIsSaving(true);
        try {
            const reqRef = doc(db, 'chats', editingRequirement.userInfo.state, 'messages', editingRequirement.id);
            await updateDoc(reqRef, {
                title: editingRequirement.title,
                text: editingRequirement.text,
            });

            // Update local state to reflect changes immediately
            const updateReqs = (reqs: Requirement[]) => reqs.map(r => r.id === editingRequirement.id ? editingRequirement : r);
            setAllRequirements(updateReqs);
            setFilteredRequirements(updateReqs);
            
            toast({ title: "Success", description: "Requirement updated successfully." });
            setIsEditDialogOpen(false);
            setEditingRequirement(null);

        } catch (error) {
            console.error("Error updating requirement:", error);
            toast({ title: "Error", description: "Failed to update requirement.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
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
                        {filteredRequirements.map(req => <RequirementCard key={req.id} req={req} currentUser={currentUser} onDelete={handleDeleteRequirement} onEdit={openEditDialog} />)}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <FileQuestion className="mx-auto w-12 h-12 mb-4" />
                        <h3 className="text-lg font-semibold">No Requirements Found</h3>
                        <p className="text-sm">There are currently no items in this category.</p>
                    </div>
                )
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Requirement</DialogTitle>
                        <DialogDescription>
                            Make changes to this requirement post. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    {editingRequirement && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-title">Title</Label>
                                <Input
                                    id="edit-title"
                                    value={editingRequirement.title}
                                    onChange={(e) => setEditingRequirement({ ...editingRequirement, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-text">Description</Label>
                                <Textarea
                                    id="edit-text"
                                    value={editingRequirement.text}
                                    onChange={(e) => setEditingRequirement({ ...editingRequirement, text: e.target.value })}
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? <LoaderCircle className="animate-spin" /> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
