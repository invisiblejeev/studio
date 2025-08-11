
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import { createUserProfile, UserProfile } from './users';

export const signUp = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export const signIn = async (loginId, password) => {
    let email = loginId;

    // Special handling for the default test user
    if (loginId === 'user@example.com' && password === 'password') {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error: any) {
            // If the test user doesn't exist, create it.
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const profileData: Omit<UserProfile, 'uid'> = {
                    email: email,
                    username: 'testuser',
                    firstName: 'Test',
                    lastName: 'User',
                };
                await createUserProfile(userCredential.user.uid, profileData);
                return userCredential.user;
            }
            throw error; // Re-throw other errors
        }
    }

    // Check if loginId is a username or phone number if it doesn't contain '@'
    if (!loginId.includes('@')) {
        const usersRef = collection(db, "users");
        // Check for username OR phone number
        const q = query(usersRef, or(where("username", "==", loginId), where("phone", "==", loginId)));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            // User found, get their email
            email = querySnapshot.docs[0].data().email;
        } else {
            // If no user is found by username or phone, the login will fail with the original loginId,
            // which is fine as it's an invalid email. The catch block will handle the error.
        }
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export const logOut = async () => {
    await signOut(auth);
}

export const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
}
