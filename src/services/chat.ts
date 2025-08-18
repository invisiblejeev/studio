
'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, runTransaction, Timestamp, writeBatch } from 'firebase/firestore';
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
  timestamp: Timestamp | Date; // Allow both for client-side optimism
  isDeleted?: boolean;
}

export const sendMessage = async (roomId: string, message: Omit<Message, 'id' | 'timestamp' | 'time'>, isPersonal: boolean) => {
  const collectionName = isPersonal ? 'personalChats' : 'chats';
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

  const chatDocRef = doc(db, collectionName, roomId);
  const messagesCollectionRef = collection(db, collectionName, roomId, 'messages');
  
  const batch = writeBatch(db);

  // 1. Add the new message
  const newMessageRef = doc(messagesCollectionRef); // Create a ref with a new ID
  batch.set(newMessageRef, messagePayload);

  // 2. Update the main chat document's last message details
  const lastMessageContent = messagePayload.text || (messagePayload.imageUrl ? "Image" : "");
  batch.set(chatDocRef, { 
      lastMessageTimestamp: serverTimestamp(),
      lastMessage: lastMessageContent,
      lastMessageSenderId: message.user.id,
      members: isPersonal ? [chatDocRef.id.split('_')[0], chatDocRef.id.split('_')[1]] : [], // Add members for personal chat
  }, { merge: true });

  await batch.commit();
};


export const getPersonalChatRoomId = async (uid1: string, uid2: string): Promise<string> => {
    // This creates a consistent, canonical room ID for any two users.
    const roomId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    const chatRef = doc(db, 'personalChats', roomId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        const user1Profile = await getUserProfile(uid1);
        const user2Profile = await getUserProfile(uid2);

        if (!user1Profile || !user2Profile) {
            throw new Error("Could not find user profiles to create personal chat.");
        }
        
        const batch = writeBatch(db);

        // 1. Create the main chat room document in 'personalChats'
        batch.set(chatRef, { 
            members: [uid1, uid2],
            isPersonal: true,
            createdAt: serverTimestamp() 
        });

        // 2. Create the chat entry for user 1 (under users/{uid1}/personalChats/{uid2})
        const user1ChatRef = doc(db, `users/${uid1}/personalChats`, uid2);
        batch.set(user1ChatRef, { 
            withUser: { uid: user2Profile.uid, username: user2Profile.username, avatar: user2Profile.avatar || '' }, 
            roomId: roomId,
            unreadCount: 0,
            lastMessageTimestamp: serverTimestamp(),
        });
        
        // 3. Create the chat entry for user 2 (under users/{uid2}/personalChats/{uid1})
        const user2ChatRef = doc(db, `users/${uid2}/personalChats`, uid1);
        batch.set(user2ChatRef, { 
            withUser: { uid: user1Profile.uid, username: user1Profile.username, avatar: user1Profile.avatar || '' }, 
            roomId: roomId,
            unreadCount: 0,
            lastMessageTimestamp: serverTimestamp(),
        });

        await batch.commit();
    }

    return roomId;
}

export const ensurePublicChatRoomExists = async (state: string) => {
    const chatRef = doc(db, 'chats', state);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        await setDoc(chatRef, {
            isPersonal: false, // Explicitly mark as public
        });
    }
};

export const markAsRead = async (userId: string, otherUserId: string) => {
    if (!userId || !otherUserId) return;
    const chatRef = doc(db, `users/${userId}/personalChats`, otherUserId);
    try {
        await updateDoc(chatRef, { unreadCount: 0 });
    } catch(e) {
        // Can happen if doc doesn't exist, which is fine
        if ((e as any).code !== 'not-found') {
            console.error("Could not mark chat as read:", e);
        }
    }
};

export const updateMessage = async (roomId: string, messageId: string, isPersonal: boolean, newText: string) => {
    const collectionName = isPersonal ? 'personalChats' : 'chats';
    const messageRef = doc(db, collectionName, roomId, 'messages', messageId);
    await updateDoc(messageRef, {
        text: newText,
    });
};

export const deleteMessage = async (roomId: string, messageId: string, isPersonal: boolean) => {
    const collectionName = isPersonal ? 'personalChats' : 'chats';
    const messageRef = doc(db, collectionName, roomId, 'messages', messageId);
    // Soft delete: update the message to indicate it's deleted.
    await updateDoc(messageRef, {
        text: 'This message was deleted',
        isDeleted: true,
        imageUrl: null, // Remove image on delete
    });
};
