
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { categorizeMessage } from '@/ai/flows/categorize-message';

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

  // 1. Add text if it exists and is not empty.
  if (message.text && message.text.trim() !== '') {
    messagePayload.text = message.text;
  }

  // 2. Add image URL if it exists.
  if (message.imageUrl) {
    messagePayload.imageUrl = message.imageUrl;
  }
  
  // 3. If there is no text and no image, do not send an empty message.
  if (!messagePayload.text && !messagePayload.imageUrl) {
    console.log("Attempted to send an empty message. Aborting.");
    return;
  }

  // 4. For public channels (not personal chats), categorize if there's text.
  const isPersonalChat = roomId.includes('_');
  if (messagePayload.text && !isPersonalChat) {
    try {
        const { category, title } = await categorizeMessage({ text: messagePayload.text });
        messagePayload.category = category;
        messagePayload.title = title;
    } catch(e) {
        console.error("Failed to categorize message, sending without category.", e);
    }
  }
  
  await addDoc(collection(db, 'chats', roomId, 'messages'), messagePayload);
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
