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
  
  // Do not categorize personal messages
  if (roomId.includes('_')) {
    await addDoc(collection(db, 'chats', roomId, 'messages'), {
      ...message,
      timestamp: serverTimestamp(),
    });
    return;
  }

  // Only categorize messages that have text.
  if (message.text) {
    const { category, title } = await categorizeMessage({ text: message.text });
    await addDoc(collection(db, 'chats', roomId, 'messages'), {
      ...message,
      category,
      title,
      timestamp: serverTimestamp(),
    });
  } else {
    // For image-only messages, just add them without categorization
    await addDoc(collection(db, 'chats', roomId, 'messages'), {
      ...message,
      timestamp: serverTimestamp(),
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
        timestamp: timestamp
      } as Message
    });
    callback(messages);
  });
};

export const getPersonalChatRoomId = (uid1: string, uid2: string) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}
