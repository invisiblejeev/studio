
'use server';

/**
 * @fileOverview Firestore triggers for background AI processing.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { categorizeMessage } from '@/ai/flows/categorize-message';

initializeApp();
const db = getFirestore();

// This trigger runs whenever a new message is created in any chat room.
export const onMessageCreated = onDocumentCreated(
  'chats/{roomId}/messages/{messageId}',
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log('No data associated with the event');
      return;
    }

    const message = snap.data();
    const roomId = event.params.roomId;

    // Do not process messages from personal chats or messages without text.
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
        await db.collection('requirements').add(requirementData);
        console.log(`Created requirement: ${categorization.title}`);
      }
    } catch (err) {
      console.error('Error during background categorization trigger:', err);
    }
  }
);
