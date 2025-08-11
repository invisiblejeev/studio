

import { auth } from '@/lib/firebase';
import { 
    sendSignInLinkToEmail, 
    isSignInWithEmailLink as firebaseIsSignInWithEmailLink,
    signInWithEmailLink as firebaseSignInWithEmailLink,
    signOut, 
    onAuthStateChanged,
    ActionCodeSettings,
    User
} from 'firebase/auth';
import { createUserProfile, UserProfile } from './users';

const actionCodeSettings: ActionCodeSettings = {
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002',
  handleCodeInApp: true,
};

export const sendSignInLink = async (email: string) => {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
};

export const isSignInWithEmailLink = (url: string) => {
    return firebaseIsSignInWithEmailLink(auth, url);
};

export const signInWithEmailLink = async (email: string, url: string): Promise<User> => {
    const userCredential = await firebaseSignInWithEmailLink(auth, email, url);
    return userCredential.user;
};

export const logOut = async () => {
    await signOut(auth);
    // Use a full page reload to clear all state and redirect to login.
    if(typeof window !== 'undefined') {
      window.location.href = '/';
    }
}

export const getCurrentUser = (): Promise<User | null> => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
};
