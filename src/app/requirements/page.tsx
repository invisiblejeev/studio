
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Briefcase, Home, ShoppingCart, Calendar, FileQuestion, Wrench, Baby, Dog, Stethoscope, Scale, Trash2, Clock, MessageSquare, Pencil, LoaderCircle, Flag } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit, doc, deleteDoc, updateDoc, onSnapshot, where } from 'firebase/firestore';
import type { Message } from '@/services/chat';
import type { Category } from '@/ai/flows/categorize-message';
import { getUserProfile, UserProfile } from '@/services/users';
import { allStates } from '@/lib/states';
import { getCurrentUser } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, formatDistanceToNowStrict, isAfter } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { flagContent } from '@/services/admin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';


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
    state: string;
}

export default function RequirementsPage() {
    const [allRequirements, setAllRequirements] = useState<Requirement[]>([]);
    const [filteredRequirements, setFilteredRequirements] = useState<Requirement[]>([]);
    const [activeFilter, setActiveFilter] = useState<Category | 'All'>('All');
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    // Edit State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
    const [isSaving, setIsSaving] = useState(false);

     useEffect(() => {
        const fetchUser = async () => {
            const user = await getCurrentUser();
            if (user) {
                const profile = await getUserProfile(user.uid);
                setCurrentUser(profile);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        setIsLoading(true);
        // Simplified query to avoid needing a composite index.
        const reqQuery = query(collection(db, 'requirements'), orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(reqQuery, (snapshot) => {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const reqsData = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    const timestamp = data.timestamp?.toDate();
                    return {
                        id: doc.id,
                        ...data,
                        time: timestamp ? formatDistanceToNowStrict(timestamp, { addSuffix: true }) : '',
                        timestamp: timestamp,
                    } as Requirement;
                })
                .filter(req => req.timestamp && isAfter(req.timestamp, sevenDaysAgo)); // Filter client-side

            setAllRequirements(reqsData);
            // We need to re-apply the active filter to the newly fetched data
            if (activeFilter === 'All') {
                setFilteredRequirements(reqsData);
            } else {
                setFilteredRequirements(reqsData.filter(r => r.category === activeFilter));
            }
            setIsLoading(false);
        }, (error) => {
             console.error("Error fetching requirements:", error);
             toast({ title: "Error", description: "Could not fetch requirements. " + error.message, variant: "destructive" });
             setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast, activeFilter]);


    const handleFilter = (category: Category | 'All') => {
        setActiveFilter(category);
        if (category === 'All') {
            setFilteredRequirements(allRequirements);
        } else {
            setFilteredRequirements(allRequirements.filter(r => r.category === category));
        }
    };
    
    const handleDeleteRequirement = async (reqToDelete: Requirement) => {
        if (!currentUser?.isAdmin) return;
        
        try {
            const reqRef = doc(db, 'requirements', reqToDelete.id);
            await deleteDoc(reqRef);

            // Also delete the original message if possible
            if (reqToDelete.originalMessageId && reqToDelete.originalRoomId) {
                const originalMsgRef = doc(db, 'chats', reqToDelete.originalRoomId, 'messages', reqToDelete.originalMessageId);
                await deleteDoc(originalMsgRef);
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

    const handleFlagRequirement = async (reqToFlag: Requirement) => {
        if (!currentUser?.isAdmin || !reqToFlag.text) return;
        try {
            await flagContent(reqToFlag.text, currentUser.uid);
            toast({
                title: 'Content Flagged',
                description: 'This content has been flagged for AI training.',
            });
        } catch (error) {
            console.error('Error flagging requirement:', error);
            toast({
                title: 'Error',
                description: 'Could not flag the content. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const openEditDialog = (req: Requirement) => {
        setEditingRequirement(req);
        setIsEditDialogOpen(true);
    };

    const handleSaveChanges = async () => {
        if (!editingRequirement) return;
        setIsSaving(true);
        try {
            const reqRef = doc(db, 'requirements', editingRequirement.id);
            const updateData = {
                title: editingRequirement.title,
                text: editingRequirement.text,
            };
            await updateDoc(reqRef, updateData);

            if (editingRequirement.originalMessageId && editingRequirement.originalRoomId) {
                 const originalMsgRef = doc(db, 'chats', editingRequirement.originalRoomId, 'messages', editingRequirement.originalMessageId);
                 await updateDoc(originalMsgRef, updateData);
            }
            
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
        <div className="space-y-6 p-4 bg-gray-50 min-h-screen pb-24">
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
                 <div className="flex justify-center items-center py-10">
                    <LoaderCircle className="w-8 h-8 animate-spin" />
                    <p className="ml-2">Loading requirements...</p>
                </div>
            ) : (
                filteredRequirements.length > 0 ? (
                     <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>State</TableHead>
                                    <TableHead>Posted</TableHead>
                                    {currentUser?.isAdmin && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRequirements.map(req => {
                                    const { icon: Icon } = categoryConfig[req.category] || categoryConfig["Other"];
                                    const stateName = allStates.find(s => s.value === req.state)?.label || req.state || '';
                                    const isAuthor = currentUser?.uid === req.user.id;
                                    
                                    return (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium max-w-xs truncate">
                                                <p className="font-semibold">{req.title}</p>
                                                <p className="text-xs text-muted-foreground truncate">{req.text}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {req.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={req.user.avatar} data-ai-hint="person avatar" />
                                                        <AvatarFallback>{req.user.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{req.user.name}</p>
                                                         {!isAuthor && (
                                                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => router.push(`/chat/user/${req.user.id}`)}>
                                                                Send Message
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{stateName}</TableCell>
                                            <TableCell>{req.time}</TableCell>
                                             {currentUser?.isAdmin && (
                                                <TableCell className="text-right">
                                                    <div className="flex gap-1 justify-end">
                                                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(req)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteRequirement(req)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10 border rounded-md">
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

    