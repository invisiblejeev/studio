
'use server';

/**
 * @fileOverview Firestore triggers for background AI processing and other backend logic.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize the Admin SDK if it hasn't been already.
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();


// This trigger runs whenever a new message is created in a PERSONAL chat room.
export const onPersonalMessageCreated = onDocumentCreated(
  'chats/{roomId}/messages/{messageId}',
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log('No data associated with the personal message event');
      return;
    }
    const message = snap.data();
    const roomId = event.params.roomId;
    const senderId = message.user.id;

    // Only process messages from personal chats (which contain an underscore).
    if (!roomId.includes('_')) {
      return;
    }
    
    try {
      const chatDocRef = db.collection('chats').doc(roomId);
      const chatDoc = await chatDocRef.get();
      if (!chatDoc.exists) return;

      const chatData = chatDoc.data()!;
      const recipientId = chatData.users.find((uid: string) => uid !== senderId);

      if (recipientId) {
        const recipientChatRef = db.collection('users').doc(recipientId).collection('personalChats').doc(senderId);
        
        // Use set with merge to create the document if it doesn't exist, or update it if it does.
        // This makes the unread count update more robust.
        await recipientChatRef.set({
            unreadCount: FieldValue.increment(1),
            lastMessage: message.text || (message.imageUrl ? "Image" : ""),
            lastMessageTimestamp: message.timestamp,
            lastMessageSenderId: senderId
        }, { merge: true });

        console.log(`Updated unread count and last message for user ${recipientId} in chat with ${senderId}`);
      }
    } catch (err)      {
      console.error('Error during personal message trigger:', err);
    }
  }
);
