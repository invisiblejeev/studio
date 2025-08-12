
"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/services/auth';
import { getUserProfile } from '@/services/users';

export default function ChatRedirectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const determineChatRedirect = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await getUserProfile(user.uid);
          if (profile?.state) {
            router.replace(`/chat/${profile.state}`);
          } else {
            // Default to California if user has no state set
            router.replace('/chat/california');
          }
        } else {
          // If no user, redirect to login
          router.replace('/');
        }
      } catch (error) {
        console.error("Failed to get user profile for chat redirect:", error);
        // Fallback in case of error
        router.replace('/chat/california');
      } finally {
        setIsLoading(false);
      }
    };

    determineChatRedirect();
  }, [router]);

  if (isLoading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <p>Loading your chat...</p>
          </div>
      )
  }

  return null;
}
