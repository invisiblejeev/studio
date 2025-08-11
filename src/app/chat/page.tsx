import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, SendHorizonal } from "lucide-react"

export default function ChatPage() {
  const messages = [
    { id: 1, user: { name: 'Rohan', avatar: 'https://placehold.co/40x40.png' }, text: 'Anyone looking for a frontend developer role? My company is hiring.', time: '2:30 PM' },
    { id: 2, user: { name: 'Priya', avatar: 'https://placehold.co/40x40.png' }, text: 'I am! Can you share the details?', time: '2:31 PM' },
    { id: 3, user: { name: 'You', avatar: 'https://placehold.co/40x40.png' }, text: 'There is a great Diwali event happening this weekend in the Bay Area. Anyone interested?', time: '2:35 PM' },
    { id: 4, user: { name: 'Amit', avatar: 'https://placehold.co/40x40.png' }, text: 'I am selling my old couch, it\'s in great condition. DM for price.', time: '2:40 PM' },
  ];

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border">
      <header className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">California Community</h2>
          <Select defaultValue="california">
              <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Change State" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="california">California</SelectItem>
                  <SelectItem value="texas">Texas</SelectItem>
                  <SelectItem value="new-york">New York</SelectItem>
              </SelectContent>
          </Select>
      </header>
      <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
              {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start gap-3 ${msg.user.name === 'You' ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
                      <Avatar className="mt-1">
                        <AvatarImage src={msg.user.avatar} data-ai-hint="person avatar" />
                        <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={`rounded-lg p-3 max-w-xs lg:max-w-md shadow-sm ${msg.user.name === 'You' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                          {msg.user.name !== 'You' && <p className="font-semibold text-sm mb-1">{msg.user.name}</p>}
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-xs text-right mt-2 opacity-70">{msg.time}</p>
                      </div>
                  </div>
              ))}
          </div>
      </ScrollArea>
      <div className="p-4 border-t bg-card rounded-b-xl">
          <div className="relative">
              <Textarea placeholder="Type your message..." className="pr-28 min-h-[48px] " />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-muted-foreground"><Paperclip className="w-5 h-5" /></Button>
                  <Button size="icon"><SendHorizonal className="w-5 h-5" /></Button>
              </div>
          </div>
      </div>
    </div>
  );
}
