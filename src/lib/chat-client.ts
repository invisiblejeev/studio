
"use client";

import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, doc } from 'firebase/firestore';
import type { Message } from '@/services/chat';

export const getMessages = (roomId: string, callback: (messages: Message[]) => void) => {
  const q = query(collection(db, 'chats', roomId, 'messages'), orderBy('timestamp', 'asc'));

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
        category: data.category,
        title: data.title
      } as Message
    });
    callback(messages);
  });
  
  // Also listen to the parent chat document to ensure rules are triggered correctly.
  // This is a workaround for a potential race condition in Firestore security rules.
  const unsubscribeChatDoc = onSnapshot(doc(db, 'chats', roomId), (doc) => {
    // We don't need to do anything with the data, just establish the listener.
  });

  // Return a function that unsubscribes from both listeners
  return () => {
    unsubscribeMessages();
    unsubscribeChatDoc();
  };
};
