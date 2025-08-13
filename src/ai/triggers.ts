
'use server';

/**
 * @fileOverview Firestore triggers for background AI processing and other backend logic.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { categorizeMessage } from '@/ai/flows/categorize-message';

// Initialize the Admin SDK if it hasn't been already.
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// This trigger runs whenever a new message is created in any public chat room.
export const onPublicMessageCreated = onDocumentCreated(
  'chats/{roomId}/messages/{messageId}',
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log('No data associated with the event');
      return;
    }

    const message = snap.data();
    const roomId = event.params.roomId;

    // Do not process messages from personal chats (which contain an underscore) or messages without text.
    if (roomId.includes('_') || !message.text) {
      return;
    }

    try {
      console.log(`Categorizing message: ${message.text}`);
      const categorization = await categorizeMessage({ text: message.text });

      if (
        categorization &&
        categorization.category !== 'General Chat' &&
        categorization.category !== 'Other'
      ) {
        const requirementData = {
          user: message.user,
          text: message.text,
          state: roomId, // The public room ID is the state name
          timestamp: message.timestamp,
          category: categorization.category,
          title: categorization.title,
          originalMessageId: snap.id,
          originalRoomId: roomId,
        };
        // This write is performed with admin privileges via the Cloud Function, bypassing client-side security rules.
        await db.collection('requirements').add(requirementData);
        console.log(`Created requirement: ${categorization.title}`);
      }
    } catch (err) {
      console.error('Error during background categorization trigger:', err);
    }
  }
);


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
        
        // Use FieldValue.increment to atomically update the count.
        // Also update the last message details for the recipient's chat list.
        await recipientChatRef.set({
            unreadCount: FieldValue.increment(1),
            lastMessage: message.text || (message.imageUrl ? "Image" : ""),
            lastMessageTimestamp: message.timestamp,
            lastMessageSenderId: senderId
        }, { merge: true }).catch(err => {
            // It's possible the document doesn't exist yet if this is the very first message.
            // In a production app, we might use a transaction to create if not exists.
            // For now, we log the error if it's not a 'not-found' error.
            if (err.code !== 5) { // 5 = NOT_FOUND
                console.error(`Error updating recipient's personal chat doc:`, err);
            }
        });

        console.log(`Updated unread count and last message for user ${recipientId} in chat with ${senderId}`);
      }
    } catch (err)      {
      console.error('Error during personal message trigger:', err);
    }
  }
);
