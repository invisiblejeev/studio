
"use client";

import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, limit, startAfter, getDocs, DocumentData, QueryDocumentSnapshot, Unsubscribe, Timestamp } from 'firebase/firestore';
import type { Message } from '@/services/chat';

const PAGE_SIZE = 50;

function docToMessage(doc: QueryDocumentSnapshot<DocumentData>): Message {
    const data = doc.data();
    // Keep timestamp as a Firestore Timestamp object for accurate sorting.
    const timestamp: Timestamp | null = data.timestamp;
    
    return {
        id: doc.id,
        user: data.user,
        text: data.text,
        imageUrl: data.imageUrl,
        // Format time directly from the Timestamp object
        time: timestamp ? timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        timestamp: timestamp, // Keep as Timestamp for sorting
        isDeleted: data.isDeleted || false,
    } as Message;
}

type MessageCallback = (messages: Message[], oldestDoc: QueryDocumentSnapshot | null, hasMore: boolean) => void;

export function createFirebaseMessageApi(roomId: string, isPersonal: boolean) {
    let liveUnsubscribe: Unsubscribe | null = null;
    let newestDoc: QueryDocumentSnapshot | null = null;
    const collectionName = isPersonal ? 'personalChats' : 'chats';

    const messagesCollection = collection(db, collectionName, roomId, 'messages');

    const listenForMessages = (
        callback: MessageCallback, 
        startAfterDoc: QueryDocumentSnapshot | null = null
    ) => {
        let q = query(
            messagesCollection,
            orderBy('timestamp', 'desc')
        );

        if (startAfterDoc) {
            q = query(q, startAfter(startAfterDoc));
        } else {
             q = query(q, limit(PAGE_SIZE));
        }
        
        liveUnsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty && !startAfterDoc) {
                callback([], null, false);
                return;
            }
            
            const newMessages = snapshot.docs
                .filter(doc => doc.data().timestamp !== null) // Filter out docs with uncommitted timestamps
                .map(docToMessage);

            if (snapshot.docs.length === 0) {
                 callback([], null, false);
                 return;
            }

            if (!newestDoc && snapshot.docs.length > 0) {
              newestDoc = snapshot.docs[0];
            }
            
            const oldestDocInBatch = snapshot.docs[snapshot.docs.length - 1];
            // Don't use the oldestDoc if its timestamp is still pending.
            const validOldestDoc = oldestDocInBatch.data().timestamp ? oldestDocInBatch : null;

            const hasMore = snapshot.docs.length === PAGE_SIZE;

            callback(newMessages.reverse(), validOldestDoc, hasMore);

        }, (error) => {
            console.error(`[FirebaseChat] Error listening for messages in room ${roomId}:`, error);
        });
    };

    const loadMoreMessages = async (
        oldestDoc: QueryDocumentSnapshot,
        callback: MessageCallback
    ) => {
        try {
            const q = query(
                messagesCollection,
                orderBy('timestamp', 'desc'),
                startAfter(oldestDoc),
                limit(PAGE_SIZE)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                callback([], null, false);
            } else {
                const olderMessages = querySnapshot.docs.map(docToMessage).reverse();
                const newOldestDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
                const hasMore = querySnapshot.docs.length === PAGE_SIZE;
                callback(olderMessages, newOldestDoc, hasMore);
            }
        } catch (error) {
            console.error(`[FirebaseChat] Error loading more messages for room ${roomId}:`, error);
        }
    };

    return {
        listenForMessages,
        loadMoreMessages,
        cleanup: () => {
            if (liveUnsubscribe) {
                liveUnsubscribe();
            }
        }
    };
}
