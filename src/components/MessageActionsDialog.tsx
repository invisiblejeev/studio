
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Message } from '@/services/chat';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface MessageActionsDialogProps {
    message: Message;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onEdit: (messageId: string, newText: string) => Promise<void>;
    onDelete: (messageId: string) => Promise<void>;
}

export function MessageActionsDialog({ message, isOpen, onOpenChange, onEdit, onDelete }: MessageActionsDialogProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message.text || '');

    const handleSave = () => {
        onEdit(message.id, editText);
        setIsEditing(false);
    };

    const handleClose = () => {
        onOpenChange(false);
        // Delay resetting edit state to avoid visual glitch while dialog closes
        setTimeout(() => {
            setIsEditing(false);
            setEditText(message.text || '');
        }, 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Message' : 'Message Actions'}</DialogTitle>
                </DialogHeader>
                {isEditing ? (
                    <div className="py-4 space-y-4">
                        <Textarea 
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={4}
                            autoFocus
                        />
                         <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save Changes</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="grid gap-2 py-4">
                        <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Message</Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Delete Message</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your message.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(message.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
