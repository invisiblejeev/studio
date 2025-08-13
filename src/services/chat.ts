
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
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
  // Fields below are added by backend triggers, not set by client
  category?: string;
  title?: string;
  isSpam?: boolean;
  reason?: string;
  // Fields used for 'requirements' collection
  state?: string; 
  originalMessageId?: string;
  originalRoomId?: string;
}

export const sendMessage = async (roomId: string, message: Omit<Message, 'id' | 'timestamp' | 'time'>) => {
  // 1. Construct the basic message payload the client is allowed to send.
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

  // Abort if the message is empty (no text and no image)
  if (!messagePayload.text && !messagePayload.imageUrl) {
    console.log("Attempted to send an empty message. Aborting.");
    return;
  }

  // 2. Save the simple message to Firestore.
  // A backend trigger (`onMessageCreated`) will handle categorization/moderation.
  await addDoc(collection(db, 'chats', roomId, 'messages'), messagePayload);

  // 3. Update the last message info on the parent chat document for chat lists.
  const chatDocRef = doc(db, 'chats', roomId);
  const lastMessageContent = messagePayload.text || (messagePayload.imageUrl ? "Image" : "");
  await setDoc(chatDocRef, { 
      lastMessageTimestamp: serverTimestamp(),
      lastMessage: lastMessageContent,
      lastMessageSenderId: message.user.id
  }, { merge: true }).catch(e => console.error("Failed to update chat timestamp:", e));

};


export const getPersonalChatRoomId = async (uid1: string, uid2: string): Promise<string> => {
    const roomId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    const chatRef = doc(db, 'chats', roomId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        await setDoc(chatRef, { 
            users: [uid1, uid2], 
            lastMessageTimestamp: serverTimestamp() 
        });
        
        const user1Profile = await getUserProfile(uid1);
        const user2Profile = await getUserProfile(uid2);

        if (user1Profile && user2Profile) {
            const user1ChatRef = doc(db, `users/${uid1}/personalChats`, uid2);
            await setDoc(user1ChatRef, { 
                withUser: { uid: user2Profile.uid, username: user2Profile.username, avatar: user2Profile.avatar || '' }, 
                roomId: roomId,
            });
            
            const user2ChatRef = doc(db, `users/${uid2}/personalChats`, uid1);
            await setDoc(user2ChatRef, { 
                withUser: { uid: user1Profile.uid, username: user1Profile.username, avatar: user1Profile.avatar || '' }, 
                roomId: roomId,
            });
        }
    }
    
    return roomId;
}
