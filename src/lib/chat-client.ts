
"use client";

import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, limit, startAfter, getDocs, endBefore, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { Message } from '@/services/chat';

const PAGE_SIZE = 50;

function docToMessage(doc: QueryDocumentSnapshot<DocumentData, DocumentData>): Message {
    const data = doc.data();
    const timestamp = data.timestamp?.toDate();
    return {
        id: doc.id,
        user: data.user,
        text: data.text,
        imageUrl: data.imageUrl,
        time: timestamp ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        timestamp: timestamp,
        isDeleted: data.isDeleted || false,
    } as Message;
}

export function createMessagesStore(roomId: string, onInitialLoad?: (messages: Message[]) => void) {
    let messages: Message[] = [];
    let oldestDoc: QueryDocumentSnapshot | null = null;
    let newestDoc: QueryDocumentSnapshot | null = null;
    let hasMore = true;
    let isLoading = false;
    let isLiveListening = false;
    
    let subscribers: ((messages: Message[]) => void)[] = [];
    let loadingSubscribers: ((loading: boolean) => void)[] = [];
    let hasMoreSubscribers: ((hasMore: boolean) => void)[] = [];

    const notify = () => subscribers.forEach(cb => cb(messages));
    const notifyLoading = () => loadingSubscribers.forEach(cb => cb(isLoading));
    const notifyHasMore = () => hasMoreSubscribers.forEach(cb => cb(hasMore));
    
    let liveUnsubscribe: (() => void) | null = null;

    const loadInitialMessages = async () => {
        if (isLoading) return;
        isLoading = true;
        notifyLoading();

        try {
            const q = query(
                collection(db, 'chats', roomId, 'messages'),
                orderBy('timestamp', 'desc'),
                limit(PAGE_SIZE)
            );
            const querySnapshot = await getDocs(q);
            
            const newMessages = querySnapshot.docs.map(docToMessage).reverse();
            messages = newMessages;
            oldestDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            newestDoc = querySnapshot.docs[0];
            hasMore = querySnapshot.docs.length === PAGE_SIZE;

            notify();
            notifyHasMore();
            if (onInitialLoad) {
                onInitialLoad(messages);
            }
            listenForNewMessages();

        } catch (error) {
            console.error(`[ChatClient] Error fetching initial messages for room ${roomId}:`, error);
            hasMore = false;
            notifyHasMore();
        } finally {
            isLoading = false;
            notifyLoading();
        }
    };

    const loadMore = async () => {
        if (isLoading || !hasMore || !oldestDoc) return;
        isLoading = true;
        notifyLoading();

        try {
            const q = query(
                collection(db, 'chats', roomId, 'messages'),
                orderBy('timestamp', 'desc'),
                startAfter(oldestDoc),
                limit(PAGE_SIZE)
            );
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                hasMore = false;
            } else {
                const olderMessages = querySnapshot.docs.map(docToMessage).reverse();
                messages = [...olderMessages, ...messages];
                oldestDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
                hasMore = querySnapshot.docs.length === PAGE_SIZE;
            }
            notify();
            notifyHasMore();

        } catch (error) {
            console.error(`[ChatClient] Error fetching more messages for room ${roomId}:`, error);
        } finally {
            isLoading = false;
            notifyLoading();
        }
    };

    const listenForNewMessages = () => {
        if (isLiveListening) return;
        isLiveListening = true;
        
        const q = query(
            collection(db, 'chats', roomId, 'messages'),
            orderBy('timestamp', 'desc'),
            limit(1) // Initially just get the very latest to see if we have it
        );
        
        liveUnsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const newMessage = docToMessage(change.doc);
                    // Avoid adding duplicates on initial load.
                    if (messages.find(m => m.id === newMessage.id)) return;
                    
                    messages = [...messages, newMessage];
                    newestDoc = change.doc;
                    notify();
                } else if (change.type === 'modified') {
                    const modifiedMessage = docToMessage(change.doc);
                    messages = messages.map(m => m.id === modifiedMessage.id ? modifiedMessage : m);
                    notify();
                } else if (change.type === 'removed') {
                     messages = messages.filter(m => m.id !== change.doc.id);
                     notify();
                }
            });
        }, (error) => {
            console.error(`[ChatClient] Error in snapshot listener for room ${roomId}:`, error);
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
            if (liveUnsubscribe) {
                liveUnsubscribe();
            }
            subscribers = [];
            loadingSubscribers = [];
            hasMoreSubscribers = [];
        }
    };
}
