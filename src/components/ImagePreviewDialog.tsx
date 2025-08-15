
"use client";

import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Trash2, Download, X } from "lucide-react";

interface ImagePreviewDialogProps {
  imageUrl: string | null;
  onOpenChange: (isOpen: boolean) => void;
  onDelete?: () => void;
}

export function ImagePreviewDialog({ imageUrl, onOpenChange, onDelete }: ImagePreviewDialogProps) {

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onOpenChange(false);
    }
  }

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      // To force download for data URIs or cross-origin images, a more complex setup is needed.
      // For same-origin images, this works. For others, it might open in a new tab.
      link.download = "chat-image.png"; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  return (
    <Dialog open={!!imageUrl} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen bg-black/90 border-none shadow-none p-4 flex flex-col">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground text-white z-50">
          <X className="h-8 w-8" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {imageUrl && (
          <div className="relative flex-1 w-full h-full my-auto">
            <Image 
              src={imageUrl} 
              alt="Image preview" 
              fill
              className="object-contain"
            />
          </div>
        )}

        <DialogFooter className="bg-transparent sm:justify-center pt-4">
          <Button variant="secondary" onClick={handleDownload} className="gap-2">
            <Download />
            Save to Gallery
          </Button>
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} className="gap-2">
              <Trash2 />
              Delete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
