
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { categorizeMessage } from '@/ai/flows/categorize-message';
import { moderateMessage } from '@/ai/flows/moderate-message';
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
  state?: string; // Added to know which state the message is from
  originalMessageId?: string; // To link back to the original message for edits/deletes
  originalRoomId?: string; // To link back to the original message for edits/deletes
}

export const sendMessage = async (roomId: string, message: Omit<Message, 'id' | 'timestamp' | 'time'>) => {
  // 1. Construct the basic message payload
  const messagePayload: any = {
    user: message.user,
    timestamp: serverTimestamp(),
  };

  const isPersonalChat = roomId.includes('_');
  if (!isPersonalChat) {
    messagePayload.state = roomId;
  }

  if (message.text && message.text.trim() !== '') {
    messagePayload.text = message.text;
  }

  if (message.imageUrl) {
    messagePayload.imageUrl = message.imageUrl;
  }

  // Abort if the message is empty
  if (!messagePayload.text && !messagePayload.imageUrl) {
    console.log("Attempted to send an empty message. Aborting.");
    return;
  }

  // 2. Save the message to Firestore immediately for a responsive user experience.
  const messageRef = await addDoc(collection(db, 'chats', roomId, 'messages'), messagePayload);

  // 3. Update the last message timestamp on the parent chat document for sorting chat lists.
  const chatDocRef = doc(db, 'chats', roomId);
  await setDoc(chatDocRef, { lastMessageTimestamp: serverTimestamp() }, { merge: true }).catch(e => console.error("Failed to update chat timestamp:", e));


  // 4. Run AI processes in the background without blocking the UI.
  if (messagePayload.text && !isPersonalChat) {
    // Intentionally not awaiting these promises so they run in the background
    (async () => {
        try {
            // Categorization check
            const categorization = await categorizeMessage({ text: messagePayload.text });
            if (categorization && categorization.category !== 'General Chat' && categorization.category !== 'Other') {
                const requirementData = {
                  ...messagePayload,
                  category: categorization.category,
                  title: categorization.title,
                  originalMessageId: messageRef.id,
                  originalRoomId: roomId
                };
                // Add to the new requirements collection
                await addDoc(collection(db, 'requirements'), requirementData);
                // Update the original message as well
                await updateDoc(messageRef, {
                  category: categorization.category,
                  title: categorization.title,
                });
            }
        } catch (err) {
            console.error("Error in background AI processing:", err);
        }
    })();
  }
};


export const getPersonalChatRoomId = async (uid1: string, uid2: string): Promise<string> => {
    const roomId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    const chatRef = doc(db, 'chats', roomId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        await setDoc(chatRef, { users: [uid1, uid2], lastMessageTimestamp: serverTimestamp() });
        
        const user1Profile = await getUserProfile(uid1);
        const user2Profile = await getUserProfile(uid2);

        if (user1Profile && user2Profile) {
            const user1ChatRef = doc(db, `users/${uid1}/personalChats`, uid2);
            await setDoc(user1ChatRef, { withUser: { uid: user2Profile.uid, username: user2Profile.username, avatar: user2Profile.avatar || '' }, roomId });
            
            const user2ChatRef = doc(db, `users/${uid2}/personalChats`, uid1);
            await setDoc(user2ChatRef, { withUser: { uid: user1Profile.uid, username: user1Profile.username, avatar: user1Profile.avatar || '' }, roomId });
        }
    }
    
    return roomId;
}
