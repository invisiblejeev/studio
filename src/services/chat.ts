
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { categorizeMessage } from '@/ai/flows/categorize-message';
import { moderateMessage } from '@/ai/flows/moderate-message';
import { getFlaggedContent } from '@/services/admin';

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
}

export const sendMessage = async (roomId: string, message: Omit<Message, 'id' | 'timestamp' | 'time'>) => {
  // Base payload with user and timestamp.
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
  
  // Moderation check before sending
  const isPersonalChat = roomId.includes('_');
  if (messagePayload.text && !isPersonalChat) {
      try {
          const flaggedContent = await getFlaggedContent();
          const examples = flaggedContent.map(item => item.text);

          const moderationResult = await moderateMessage({
              message: messagePayload.text,
              examples: examples,
          });

          if (moderationResult.is_inappropriate) {
              console.log("Message flagged as inappropriate and not sent:", messagePayload.text);
              // Log the inappropriate message for admin review
              await addDoc(collection(db, 'inappropriate_logs'), {
                  ...messagePayload,
                  reason: moderationResult.reason,
                  timestamp: serverTimestamp(),
              });
              // Optionally, inform the user their message was blocked
              return; // Stop the message from being sent
          }
      } catch (e) {
          console.error("Error during message moderation, sending message anyway.", e);
      }
  }


  // 1. Immediately add the message to the database for a fast user experience.
  const messageRef = await addDoc(collection(db, 'chats', roomId, 'messages'), messagePayload);

  // 2. For public channels (not personal chats), categorize in the background if there's text.
  if (messagePayload.text && !isPersonalChat) {
      // Don't await this, let it run in the background
      categorizeMessage({ text: messagePayload.text })
        .then(categorization => {
            if (categorization) {
                // 3. Update the message document with the category info.
                updateDoc(messageRef, {
                    category: categorization.category,
                    title: categorization.title,
                });
            }
        })
        .catch(e => {
            console.error("Failed to categorize message in the background.", e);
            // The message is already sent, so we just log the error.
        });
  }
};

export const getMessages = (roomId: string, callback: (messages: Message[]) => void) => {
  const q = query(collection(db, 'chats', roomId, 'messages'), orderBy('timestamp', 'asc'));

  return onSnapshot(q, (querySnapshot) => {
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
};

export const getPersonalChatRoomId = (uid1: string, uid2: string) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}
