
"use client";

import type { Message } from '@/services/chat';
import { createFirebaseMessageApi } from './firebase-chat';
import type { QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';

// Helper to get milliseconds from either a Firestore Timestamp or a JS Date
const getMillis = (timestamp: Timestamp | Date | undefined | null): number => {
    if (!timestamp) return 0;
    if (timestamp instanceof Date) { // It's a JS Date
        return timestamp.getTime();
    }
    if ('toMillis' in timestamp) { // It's a Firestore Timestamp
        return timestamp.toMillis();
    }
    return 0;
}


export function createMessagesStore(roomId: string, isPersonal: boolean, onInitialLoad?: (messages: Message[]) => void) {
    let messages: Message[] = [];
    let oldestDoc: QueryDocumentSnapshot | null = null;
    let hasMore = false; // Initialize to false
    let isLoading = false;
    
    let subscribers: ((messages: Message[]) => void)[] = [];
    let loadingSubscribers: ((loading: boolean) => void)[] = [];
    let hasMoreSubscribers: ((hasMore: boolean) => void)[] = [];

    const notify = () => subscribers.forEach(cb => cb(messages));
    const notifyLoading = () => loadingSubscribers.forEach(cb => cb(isLoading));
    const notifyHasMore = () => hasMoreSubscribers.forEach(cb => cb(hasMore));
    
    const firebaseApi = createFirebaseMessageApi(roomId, isPersonal);

    const handleUpdates = (newMessages: Message[], newOldestDoc: QueryDocumentSnapshot | null, newHasMore: boolean) => {
        // Filter out messages with uncommitted timestamps to prevent query errors.
        const validNewMessages = newMessages.filter(msg => msg.timestamp !== null);

        const messageMap = new Map(messages.map(m => [m.id, m]));
        
        validNewMessages.forEach(msg => {
            messageMap.set(msg.id, msg);
        });

        const allMessages = Array.from(messageMap.values());
        allMessages.sort((a, b) => getMillis(a.timestamp) - getMillis(b.timestamp));
        
        messages = allMessages;
        if(newOldestDoc){
            oldestDoc = newOldestDoc;
        }
        hasMore = newHasMore;
        notify();
        notifyHasMore();
    };

    const loadInitialMessages = async () => {
        if (isLoading) return;
        isLoading = true;
        notifyLoading();

        firebaseApi.listenForMessages((initialMessages, firstDoc, initialHasMore) => {
            messages = initialMessages;
            oldestDoc = firstDoc;
            hasMore = initialHasMore;
            
            notify();
            notifyHasMore();
            if (onInitialLoad) {
                onInitialLoad(messages);
            }
            
            isLoading = false;
            notifyLoading();

            // Now, listen for live updates
            firebaseApi.listenForMessages((liveMessages, _, __) => {
                // We pass the current hasMore state as live updates don't change it.
                handleUpdates(liveMessages, null, hasMore);
            }, oldestDoc);

        });
    };

    const loadMore = async () => {
        if (isLoading || !hasMore || !oldestDoc) return;
        isLoading = true;
        notifyLoading();

        await firebaseApi.loadMoreMessages(oldestDoc, (olderMessages, newOldestDoc, newHasMore) => {
            messages = [...olderMessages, ...messages];
            oldestDoc = newOldestDoc;
            hasMore = newHasMore;
            notify();
            notifyHasMore();
            isLoading = false;
            notifyLoading();
        });
    };
    
    loadInitialMessages();

    return {
        loadMore,
        subscribe: (cb: (messages: Message[]) => void) => {
            subscribers.push(cb);
            cb(messages); // Immediately give the current state
            return () => {
                subscribers = subscribers.filter(sub => sub !== cb);
            };
        },
        subscribeToLoading: (cb: (loading: boolean) => void) => {
            loadingSubscribers.push(cb);
            cb(isLoading);
            return () => {
                loadingSubscribers = loadingSubscribers.filter(sub => sub !== cb);
            };
        },
        subscribeToHasMore: (cb: (hasMore: boolean) => void) => {
            hasMoreSubscribers.push(cb);
            cb(hasMore);
            return () => {
                hasMoreSubscribers = hasMoreSubscribers.filter(sub => sub !== cb);
            };
        },
        cleanup: () => {
            firebaseApi.cleanup();
            subscribers = [];
            loadingSubscribers = [];
            hasMoreSubscribers = [];
        }
    };
}
