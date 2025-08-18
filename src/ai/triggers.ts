
'use server';

/**
 * @fileOverview Firestore triggers for background AI processing and other backend logic.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { UserProfile } from '@/services/users';


// Initialize the Admin SDK if it hasn't been already.
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();


// This trigger runs whenever a new message is created in a PERSONAL chat room.
export const onPersonalMessageCreated = onDocumentCreated(
  'personalChats/{roomId}/messages/{messageId}',
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log('No data associated with the personal message event');
      return;
    }
    const message = snap.data();
    const roomId = event.params.roomId;
    const senderId = message.user.id;
    
    try {
      const chatDocRef = db.collection('personalChats').doc(roomId);
      const chatDoc = await chatDocRef.get();
      if (!chatDoc.exists) {
          console.error(`Chat room ${roomId} not found.`);
          return;
      }

      const chatData = chatDoc.data()!;
      // Find the recipient's ID from the members array
      const recipientId = chatData.members.find((uid: string) => uid !== senderId);

      if (recipientId) {
        // We need the sender's profile to update the recipient's chat list item correctly.
        const senderProfileSnap = await db.collection('users').doc(senderId).get();
        if (!senderProfileSnap.exists) {
            console.error(`Sender profile not found for ID: ${senderId}`);
            return;
        }
        const senderProfile = senderProfileSnap.data() as UserProfile;

        // The document in the recipient's subcollection is keyed by the *sender's* ID
        const recipientChatRef = db.collection('users').doc(recipientId).collection('personalChats').doc(senderId);
        
        // This update is now correct. It increments the unread count and updates the last message details.
        await recipientChatRef.update({
            unreadCount: FieldValue.increment(1),
            lastMessage: message.text || (message.imageUrl ? "Image" : "New Message"),
            lastMessageTimestamp: message.timestamp,
            lastMessageSenderId: senderId,
            // Ensure the 'withUser' data is kept up-to-date in case of profile changes.
            'withUser.username': senderProfile.username,
            'withUser.avatar': senderProfile.avatar || '',
        });

        console.log(`Updated unread count and last message for user ${recipientId} in chat with ${senderId}`);
      }
    } catch (err)      {
      console.error('Error during onPersonalMessageCreated trigger:', err);
    }
  }
);
