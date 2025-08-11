

import { auth } from '@/lib/firebase';
import { 
    sendSignInLinkToEmail, 
    isSignInWithEmailLink, 
    signInWithEmailLink as firebaseSignInWithEmailLink,
    signOut, 
    onAuthStateChanged,
    ActionCodeSettings
} from 'firebase/auth';
import { createUserProfile, UserProfile } from './users';

const actionCodeSettings: ActionCodeSettings = {
  url: process.env.NEXT_PUBLIC_URL || 'http://localhost:9002', // Change to your app's URL
  handleCodeInApp: true,
};

export const sendSignInLink = async (email: string) => {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
};

export const isSignInWithEmailLink_ = (url: string) => {
    return isSignInWithEmailLink(auth, url);
};

export const signInWithEmailLink = async (email: string, url: string) => {
    const userCredential = await firebaseSignInWithEmailLink(auth, email, url);
    return userCredential.user;
};

export const logOut = async () => {
    await signOut(auth);
    window.location.href = '/';
}

export const getCurrentUser = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
};

export { isSignInWithEmailLink };
