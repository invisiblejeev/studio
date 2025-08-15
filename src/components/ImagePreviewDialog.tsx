
"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImagePreviewDialogProps {
  imageUrl: string | null;
  onOpenChange: (isOpen: boolean) => void;
}

export function ImagePreviewDialog({ imageUrl, onOpenChange }: ImagePreviewDialogProps) {

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={!!imageUrl} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl w-auto bg-transparent border-none shadow-none p-0">
           <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {imageUrl && (
             <div className="relative aspect-video">
                <Image 
                    src={imageUrl} 
                    alt="Image preview" 
                    fill
                    className="object-contain"
                />
            </div>
          )}
        </DialogContent>
    </Dialog>
  );
}
