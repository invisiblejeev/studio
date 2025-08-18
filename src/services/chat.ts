
'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, runTransaction, Timestamp } from 'firebase/firestore';
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

  // Add the message to the subcollection
  await addDoc(collection(db, collectionName, roomId, 'messages'), messagePayload);

  const chatDocRef = doc(db, collectionName, roomId);
  const lastMessageContent = messagePayload.text || (messagePayload.imageUrl ? "Image" : "");
  
  // Update the main chat document's last message details for sorting and previews
  await setDoc(chatDocRef, { 
      lastMessageTimestamp: serverTimestamp(),
      lastMessage: lastMessageContent,
      lastMessageSenderId: message.user.id
  }, { merge: true });
};


export const getPersonalChatRoomId = async (uid1: string, uid2: string): Promise<string> => {
    const roomId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    const chatRef = doc(db, 'personalChats', roomId);
    
    // Use a transaction to ensure atomic creation of chat and user-chat documents
    await runTransaction(db, async (transaction) => {
        const chatSnap = await transaction.get(chatRef);

        if (!chatSnap.exists()) {
            const user1Profile = await getUserProfile(uid1);
            const user2Profile = await getUserProfile(uid2);

            if (!user1Profile || !user2Profile) {
                throw new Error("Could not find user profiles to create personal chat.");
            }
            
            // 1. Create the main chat room document in 'personalChats'
            transaction.set(chatRef, { 
                users: [uid1, uid2], 
                lastMessageTimestamp: serverTimestamp() 
            });

            // 2. Create the chat entry for user 1
            const user1ChatRef = doc(db, `users/${uid1}/personalChats`, uid2);
            transaction.set(user1ChatRef, { 
                withUser: { uid: user2Profile.uid, username: user2Profile.username, avatar: user2Profile.avatar || '' }, 
                roomId: roomId,
                unreadCount: 0,
                lastMessageTimestamp: serverTimestamp(),
            });
            
            // 3. Create the chat entry for user 2
            const user2ChatRef = doc(db, `users/${uid2}/personalChats`, uid1);
            transaction.set(user2ChatRef, { 
                withUser: { uid: user1Profile.uid, username: user1Profile.username, avatar: user1Profile.avatar || '' }, 
                roomId: roomId,
                unreadCount: 0,
                lastMessageTimestamp: serverTimestamp(),
            });
        }
    });

    return roomId;
}

export const ensurePublicChatRoomExists = async (state: string) => {
    const chatRef = doc(db, 'chats', state);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        await setDoc(chatRef, {
            users: [], // Public chats don't have a defined user list
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
