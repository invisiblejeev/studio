
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { allStates } from "@/lib/states";
import { Paperclip, SendHorizonal, MessageSquare, LoaderCircle } from "lucide-react"
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { getCurrentUser } from "@/services/auth";
import { getUserProfile, UserProfile } from "@/services/users";
import { getMessages, sendMessage, Message } from "@/services/chat";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function ChatPage({ params }: { params: { state: string } }) {
  const router = useRouter();
  const state = params.state;
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser() as any;
      if (user) {
        const profile = await getUserProfile(user.uid);
        setCurrentUser(profile);
      } else {
        router.push('/');
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (!state) return;
    const unsubscribe = getMessages(state, (newMessages) => {
      setMessages(newMessages);
      setTimeout(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
      }, 0);
    });
    return () => unsubscribe();
  }, [state]);


  const handleSendMessage = async () => {
    if ((newMessage.trim() === "" && !imagePreview) || !currentUser) return;
    
    setIsUploading(true);
    await sendMessage(state, {
      user: { 
          id: currentUser.uid, 
          name: currentUser.username, 
          avatar: currentUser.avatar || ''
      },
      text: newMessage,
      imageUrl: imagePreview || undefined,
    });
    setNewMessage("");
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsUploading(false);
  };

  const handleFileSelect = async (file: File) => {
      if (!file) return;
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
          const dataUrl = reader.result as string;
          setImagePreview(dataUrl);
      }
      reader.onerror = (error) => {
          console.error("Error reading file:", error);
          toast({
              title: "File Read Failed",
              description: "Could not read the selected file. Please try again.",
              variant: "destructive"
          });
      }
  };

  const currentStateName = allStates.find(s => s.value === state)?.label || "Select State";
  const canSendMessage = (newMessage.trim() !== "" || !!imagePreview) && !isUploading;


  return (
    <div className="flex flex-col h-screen bg-background rounded-xl border">
      <header className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">{currentStateName} Community</h2>
          <Button variant="outline" onClick={() => router.push('/chat/personal')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Personal Chats
          </Button>
      </header>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-1">
              {messages.map((msg, index) => {
                const isYou = msg.user.id === currentUser?.uid;
                const prevMessage = messages[index - 1];
                const nextMessage = messages[index + 1];

                const isFirstInSequence = !prevMessage || prevMessage.user.id !== msg.user.id;
                const isLastInSequence = !nextMessage || nextMessage.user.id !== msg.user.id;

                return (
                  <div key={msg.id} className={cn('flex items-end gap-2', isYou ? 'justify-end' : 'justify-start')}>
                     {!isYou && isLastInSequence && (
                        <Avatar className={cn('h-8 w-8')}>
                            <AvatarImage src={msg.user.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                            <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                     )}
                     {!isYou && !isLastInSequence && <div className='w-8 h-8 shrink-0'/>}

                     <div className={cn('flex flex-col max-w-xs lg:max-w-md', isYou ? 'items-end' : 'items-start')}>
                        {!isYou && isFirstInSequence && <p className="text-xs text-muted-foreground mb-1 px-3">{msg.user.name}</p>}
                        <div className={cn('p-3 rounded-lg shadow-sm', 
                            isYou ? 'bg-primary text-primary-foreground' : 'bg-card',
                            !msg.text && msg.imageUrl ? 'p-1' : 'p-3',
                             isFirstInSequence && !isLastInSequence && isYou ? 'rounded-br-none' :
                             isFirstInSequence && !isLastInSequence && !isYou ? 'rounded-bl-none' :
                             !isFirstInSequence && !isLastInSequence ? 'rounded-br-none rounded-bl-none' :
                             !isFirstInSequence && isLastInSequence && isYou ? 'rounded-tr-none' :
                             !isFirstInSequence && isLastInSequence && !isYou ? 'rounded-tl-none' :
                             'rounded-lg'
                        )}>
                            {msg.imageUrl && (
                               <Link href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                  <div className="relative aspect-square rounded-md overflow-hidden max-w-[200px]">
                                    <Image src={msg.imageUrl} alt="Chat image" fill className="object-cover" />
                                  </div>
                               </Link>
                            )}
                            {msg.text && <p className="text-sm whitespace-pre-wrap mt-2">{msg.text}</p>}
                        </div>
                        {isLastInSequence && <p className="text-xs text-muted-foreground mt-1 px-3">{msg.time}</p>}
                     </div>
                     {isYou && isLastInSequence && (
                         <Avatar className={cn('h-8 w-8')}>
                            <AvatarImage src={currentUser?.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                            <AvatarFallback>{currentUser?.username.charAt(0)}</AvatarFallback>
                         </Avatar>
                     )}
                     {isYou && !isLastInSequence && <div className='w-8 h-8 shrink-0'/>}

                  </div>
                )
              })}
               {isUploading && (
                <div className="flex items-end gap-2 justify-end">
                    <div className="flex flex-col items-end">
                      <div className={cn('rounded-lg shadow-sm bg-primary text-primary-foreground', 'rounded-br-none p-1' )}>
                          <div className="flex items-center justify-center h-24 w-24 bg-primary-foreground/20 rounded-md">
                             <LoaderCircle className="w-6 h-6 animate-spin" />
                          </div>
                      </div>
                    </div>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser?.avatar || 'https://placehold.co/40x40.png'} data-ai-hint="person avatar" />
                        <AvatarFallback>{currentUser?.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            )}
          </div>
      </ScrollArea>
      <div className="p-4 border-t bg-card rounded-b-xl">
          {imagePreview && (
              <div className="mb-2 relative w-24 h-24">
                  <Image src={imagePreview} alt="Image preview" fill className="rounded-md object-cover" />
                  <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                      <X className="h-4 w-4" />
                  </Button>
              </div>
          )}
          <div className="relative">
              <Textarea 
                placeholder="Type your message..." 
                className="pr-28 min-h-[48px]"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                maxRows={5}
                disabled={isUploading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                       <Paperclip className="w-5 h-5" />
                   </Button>
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} disabled={isUploading} />
                  <Button size="icon" onClick={handleSendMessage} disabled={!canSendMessage}>
                      {isUploading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <SendHorizonal className="w-5 h-5" />}
                  </Button>
              </div>
          </div>
      </div>
    </div>
  );
}
