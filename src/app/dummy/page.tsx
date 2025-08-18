
'use client';

import { ArrowLeft, MoreVertical, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DummyPage() {
  return (
    <div className="relative flex h-screen flex-col bg-muted/40">
      {/* This <header> acts as the AppBar */}
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Dummy Page Title</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="More options">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* This <main> area is like the RelativeLayout, holding the main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
        <div className="mx-auto max-w-4xl space-y-4">
          <h2 className="text-2xl font-bold">Scrollable Content</h2>
          <p className="text-muted-foreground">
            This area represents the main content of your screen, similar to what you&apos;d place inside a RelativeLayout in Android. It will scroll independently of the AppBar at the top.
          </p>
          {/* Adding a lot of placeholder cards to make the page scrollable */}
          {Array.from({ length: 15 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                  <CardTitle>Card Item {i + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
