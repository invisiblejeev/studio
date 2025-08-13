
'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query } from "firebase/firestore";

export interface FlaggedContent {
    id: string;
    text: string;
    flaggedBy: string; // UID of the admin
    timestamp: any;
}

export async function flagContent(text: string, adminUid: string) {
    await addDoc(collection(db, 'flagged_content'), {
        text,
        flaggedBy: adminUid,
        timestamp: new Date(),
    });
}

export async function getFlaggedContent(): Promise<FlaggedContent[]> {
    const q = query(collection(db, "flagged_content"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlaggedContent));
}
