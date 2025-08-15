
"use client";

import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, doc } from 'firebase/firestore';
import type { Message } from '@/services/chat';

export const getMessages = (roomId: string, callback: (messages: Message[]) => void, onInitialLoad?: (messages: Message[]) => void) => {
  const q = query(collection(db, 'chats', roomId, 'messages'), orderBy('timestamp', 'asc'));

  let initialLoad = true;

  // The unsubscribe function for the messages listener
  const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate();
      return {
        id: doc.id,
        user: data.user,
        text: data.text,
        imageUrl: data.imageUrl,
        time: timestamp ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        timestamp: timestamp,
        isDeleted: data.isDeleted || false,
      } as Message
    });
    
    if (initialLoad && onInitialLoad) {
      onInitialLoad(messages);
      initialLoad = false;
    }
    
    callback(messages);
  },
  (error) => {
    console.error(`[ChatClient] Error fetching messages for room ${roomId}:`, error);
    // If there's an error (like permission-denied), we'll get an empty array.
    // This prevents the app from crashing and shows an empty chat, which is better than a broken page.
    callback([]);
  });
  
  // Return a function that unsubscribes from the messages listener
  return () => {
    unsubscribeMessages();
  };
};
