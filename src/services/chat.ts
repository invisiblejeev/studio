
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
  const messagePayload: any = {
      ...message,
      timestamp: serverTimestamp(),
  };

  // Do not categorize personal messages, just send them.
  if (roomId.includes('_')) {
    await addDoc(collection(db, 'chats', roomId, 'messages'), messagePayload);
    return;
  }

  // For public channels, categorize if there's text.
  if (message.text) {
    try {
        const { category, title } = await categorizeMessage({ text: message.text });
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
