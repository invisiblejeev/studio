
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Briefcase, Home, ShoppingCart, Calendar, FileQuestion, Wrench, Baby, Dog, Stethoscope, Scale, Trash2, Pencil, LoaderCircle, Plus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc, onSnapshot, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { getUserProfile, UserProfile } from '@/services/users';
import { allStates } from '@/lib/states';
import { getCurrentUser } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';
import { subDays, formatDistanceToNowStrict } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Category = "Jobs" | "Housing" | "Marketplace" | "Events" | "Plumber" | "Babysitter" | "Pet Care" | "Doctor" | "Lawyer" | "General Chat" | "Other";

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

const categories: Category[] = ["Jobs", "Housing", "Marketplace", "Events", "Plumber", "Babysitter", "Pet Care", "Doctor", "Lawyer", "Other"];

interface Requirement {
    id: string;
    user: {
        id: string;
        name: string;
        avatar: string;
    };
    title: string;
    text: string;
    category: Category;
    state: string;
    time: string;
    timestamp: Date;
}


const initialNewRequirementState = {
    title: '',
    text: '',
    category: '' as Category
};

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

    // Add State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newRequirement, setNewRequirement] = useState(initialNewRequirementState);
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
        const sevenDaysAgo = subDays(new Date(), 7);
        const reqQuery = query(
            collection(db, 'requirements'),
            where('timestamp', '>=', sevenDaysAgo),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(reqQuery, (snapshot) => {
            const reqsData = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    const timestamp = data.timestamp?.toDate();
                    return {
                        id: doc.id,
                        user: data.user,
                        title: data.title,
                        text: data.text,
                        category: data.category,
                        state: data.state,
                        time: timestamp ? formatDistanceToNowStrict(timestamp, { addSuffix: true }) : '',
                        timestamp: timestamp,
                    } as Requirement;
                });

            setAllRequirements(reqsData);
            setIsLoading(false);
        }, (error) => {
             console.error("Error fetching requirements:", error);
             toast({ title: "Error fetching requirements", description: "There was an issue loading recent community needs. Please check Firestore security rules.", variant: "destructive" });
             setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    useEffect(() => {
        if (activeFilter === 'All') {
            setFilteredRequirements(allRequirements);
        } else {
            setFilteredRequirements(allRequirements.filter(r => r.category === activeFilter));
        }
    }, [activeFilter, allRequirements]);


    const handleFilter = (category: Category | 'All') => {
        setActiveFilter(category);
    };

    const handleDeleteRequirement = async (reqToDelete: Requirement) => {
        if (!currentUser?.isAdmin) return;

        try {
            const reqRef = doc(db, 'requirements', reqToDelete.id);
            await deleteDoc(reqRef);

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

    const handleAddRequirement = async () => {
        if (!newRequirement.title || !newRequirement.text || !newRequirement.category || !currentUser) {
            toast({ title: "Missing Fields", description: "Please fill out all fields.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const requirementData = {
                user: {
                    id: currentUser.uid,
                    name: currentUser.username,
                    avatar: currentUser.avatar || ''
                },
                title: newRequirement.title,
                text: newRequirement.text,
                category: newRequirement.category,
                state: currentUser.state || 'unknown',
                timestamp: serverTimestamp(),
            };
            await addDoc(collection(db, 'requirements'), requirementData);
            toast({ title: "Success", description: "Your requirement has been posted." });
            setIsAddDialogOpen(false);
            setNewRequirement(initialNewRequirementState);
        } catch (error) {
            console.error("Error adding requirement:", error);
            toast({ title: "Error", description: "Failed to post requirement.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }

    const handleSaveChanges = async () => {
        if (!editingRequirement) return;
        setIsSaving(true);
        try {
            const reqRef = doc(db, 'requirements', editingRequirement.id);
            const updateData = {
                title: editingRequirement.title,
                text: editingRequirement.text,
                category: editingRequirement.category,
            };
            await updateDoc(reqRef, updateData);

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
        <div className="space-y-6 p-4 bg-gray-50 min-h-screen pb-24 relative">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Community Requirements</h1>
              <p className="text-muted-foreground">
                  Community-posted needs and opportunities from the last 7 days.
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
                     <div className="border rounded-md bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>State</TableHead>
                                    <TableHead>Posted</TableHead>
                                    {(currentUser?.isAdmin) && <TableHead className="text-right">Actions</TableHead>}
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
                                                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                                                                <Link href={`/chat/user/${req.user.id}`}>
                                                                    Send Message
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{stateName}</TableCell>
                                            <TableCell>{req.time}</TableCell>
                                             {(currentUser?.isAdmin) && (
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
                    <div className="text-center text-muted-foreground py-10 border rounded-md bg-white">
                        <FileQuestion className="mx-auto w-12 h-12 mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold">No Requirements Found</h3>
                        <p className="text-sm">There have been no community needs posted in the last 7 days.</p>
                    </div>
                )
            )}

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-30 md:bottom-8 md:right-8">
                        <Plus className="h-6 w-6" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Post a Requirement</DialogTitle>
                        <DialogDescription>
                            Share a need with the community. Select a category, give it a title, and describe it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="add-category">Category</Label>
                            <Select onValueChange={(value: Category) => setNewRequirement(prev => ({...prev, category: value}))}>
                                <SelectTrigger id="add-category">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-title">Title</Label>
                            <Input
                                id="add-title"
                                value={newRequirement.title}
                                onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                                placeholder="e.g., 'Looking for a 2BR apartment'"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-text">Description</Label>
                            <Textarea
                                id="add-text"
                                value={newRequirement.text}
                                onChange={(e) => setNewRequirement({ ...newRequirement, text: e.target.value })}
                                placeholder="Provide more details about your requirement..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleAddRequirement} disabled={isSaving}>
                            {isSaving ? <LoaderCircle className="animate-spin" /> : "Post Requirement"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                <Label htmlFor="edit-category">Category</Label>
                                <Select onValueChange={(value: Category) => setEditingRequirement(prev => prev ? ({...prev, category: value}) : null)} value={editingRequirement.category}>
                                    <SelectTrigger id="edit-category">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-title">Title</Label>
                                <Input
                                    id="edit-title"
                                    value={editingRequirement.title}
                                    onChange={(e) => setEditingRequirement(prev => prev ? { ...prev, title: e.target.value } : null)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-text">Description</Label>
                                <Textarea
                                    id="edit-text"
                                    value={editingRequirement.text || ''}
                                     onChange={(e) => setEditingRequirement(prev => prev ? { ...prev, text: e.target.value } : null)}
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

    