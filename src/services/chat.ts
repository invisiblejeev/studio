
'use client';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getUserProfile } from './users';

export interface Message {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  text?: string;
  time: string; 
  timestamp: any;
  isDeleted?: boolean;
}

export const sendMessage = async (roomId: string, message: Omit<Message, 'id' | 'timestamp' | 'time'>) => {
  const messagePayload: any = {
    user: message.user,
    timestamp: serverTimestamp(),
  };

  if (message.text && message.text.trim() !== '') {
    messagePayload.text = message.text;
  }

  if (!messagePayload.text) {
    console.log("Attempted to send an empty message. Aborting.");
    return;
  }

  // Add the message to the subcollection
  await addDoc(collection(db, 'chats', roomId, 'messages'), messagePayload);

  const chatDocRef = doc(db, 'chats', roomId);
  const lastMessageContent = messagePayload.text || "";
  
  // Update the main chat document's last message details for sorting and previews
  await setDoc(chatDocRef, { 
      lastMessageTimestamp: serverTimestamp(),
      lastMessage: lastMessageContent,
      lastMessageSenderId: message.user.id
  }, { merge: true }).catch(e => console.error("Failed to update chat timestamp:", e));

  // The logic to increment the unread count for the recipient is now handled by a Firestore trigger.
  // We still need to update the SENDER's own chat document for sorting purposes and UI consistency.
  const chatSnap = await getDoc(chatDocRef);
  if (chatSnap.exists() && chatSnap.data().isPersonal) {
      const users = chatSnap.data().users;
      const recipientId = users.find((uid: string) => uid !== message.user.id);

      if (recipientId) {
        const senderChatRef = doc(db, `users/${message.user.id}/personalChats`, recipientId);
        // We update the sender's document to reflect the new last message immediately.
        await updateDoc(senderChatRef, {
            lastMessage: lastMessageContent,
            lastMessageTimestamp: serverTimestamp(),
            lastMessageSenderId: message.user.id
        }).catch(e => {
             // This can happen if the doc doesn't exist yet, which is fine.
             // The trigger will create it if needed.
             if (e.code !== 'not-found') {
                console.log("Sender personal chat doc may not exist yet, which is okay.", e.code)
             }
        });
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

export const deleteMessage = async (roomId: string, messageId: string) => {
    const messageRef = doc(db, 'chats', roomId, 'messages', messageId);
    // Soft delete: update the message to indicate it's deleted.
    await updateDoc(messageRef, {
        text: 'This message was deleted',
        imageUrl: null,
        isDeleted: true,
    });
};
