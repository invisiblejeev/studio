
'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { getUserProfile } from './users';

export interface Message {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  text?: string;
  imageUrl?: string;
  time: string; 
  timestamp: any;
  category?: string;
  title?: string;
  isSpam?: boolean;
  reason?: string;
  state?: string; 
  originalMessageId?: string;
  originalRoomId?: string;
}

export const sendMessage = async (roomId: string, message: Omit<Message, 'id' | 'timestamp' | 'time'>) => {
  const messagePayload: any = {
    user: message.user,
    timestamp: serverTimestamp(),
  };

  if (message.text && message.text.trim() !== '') {
    messagePayload.text = message.text;
  }

  if (message.imageUrl) {
    messagePayload.imageUrl = message.imageUrl;
  }

  if (!messagePayload.text && !messagePayload.imageUrl) {
    console.log("Attempted to send an empty message. Aborting.");
    return;
  }

  await addDoc(collection(db, 'chats', roomId, 'messages'), messagePayload);

  const chatDocRef = doc(db, 'chats', roomId);
  const lastMessageContent = messagePayload.text || (messagePayload.imageUrl ? "Image" : "");
  
  await setDoc(chatDocRef, { 
      lastMessageTimestamp: serverTimestamp(),
      lastMessage: lastMessageContent,
      lastMessageSenderId: message.user.id
  }, { merge: true }).catch(e => console.error("Failed to update chat timestamp:", e));

  // If this is a personal chat, increment the unread count for the recipient.
  const chatSnap = await getDoc(chatDocRef);
  if (chatSnap.exists() && chatSnap.data().isPersonal) {
      const users = chatSnap.data().users;
      const recipientId = users.find((uid: string) => uid !== message.user.id);
      if (recipientId) {
          const recipientChatRef = doc(db, `users/${recipientId}/personalChats`, message.user.id);
          // Also update the last message info here so the personal chat list can be ordered by it
          await updateDoc(recipientChatRef, {
              unreadCount: increment(1),
              lastMessage: lastMessageContent,
              lastMessageTimestamp: serverTimestamp(),
              lastMessageSenderId: message.user.id
          }).catch(e => console.log("Recipient personal chat doc may not exist yet for unread count.", e));
      }
  }
};


export const getPersonalChatRoomId = async (uid1: string, uid2: string): Promise<string> => {
    const roomId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    const chatRef = doc(db, 'chats', roomId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        await setDoc(chatRef, { 
            users: [uid1, uid2], 
            isPersonal: true,
            lastMessageTimestamp: serverTimestamp() 
        });
        
        const user1Profile = await getUserProfile(uid1);
        const user2Profile = await getUserProfile(uid2);

        if (user1Profile && user2Profile) {
            const user1ChatRef = doc(db, `users/${uid1}/personalChats`, uid2);
            await setDoc(user1ChatRef, { 
                withUser: { uid: user2Profile.uid, username: user2Profile.username, avatar: user2Profile.avatar || '' }, 
                roomId: roomId,
                unreadCount: 0,
                lastMessageTimestamp: serverTimestamp(),
            });
            
            const user2ChatRef = doc(db, `users/${uid2}/personalChats`, uid1);
            await setDoc(user2ChatRef, { 
                withUser: { uid: user1Profile.uid, username: user1Profile.username, avatar: user1Profile.avatar || '' }, 
                roomId: roomId,
                unreadCount: 0,
                lastMessageTimestamp: serverTimestamp(),
            });
        }
    }
    
    return roomId;
}

export const ensurePublicChatRoomExists = async (state: string) => {
    const chatRef = doc(db, 'chats', state);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        await setDoc(chatRef, {
            isPersonal: false,
            users: [],
        });
    }
};
