
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChatRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chat/california');
  }, [router]);

  return null;
}
