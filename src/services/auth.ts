import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { createUserProfile } from './users';

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
                await createUserProfile({
                    uid: userCredential.user.uid,
                    email: email,
                    username: 'testuser',
                    firstName: 'Test',
                    lastName: 'User',
                });
                return userCredential.user;
            }
            throw error; // Re-throw other errors
        }
    }


    // Check if loginId is a username or phone number
    if (!loginId.includes('@')) {
        const usersRef = collection(db, "users");
        // Check for username
        let q = query(usersRef, where("username", "==", loginId));
        let querySnapshot = await getDocs(q);
        
        // If not found by username, check for phone number
        if (querySnapshot.empty) {
            q = query(usersRef, where("phone", "==", loginId));
            querySnapshot = await getDocs(q);
        }

        if (!querySnapshot.empty) {
            email = querySnapshot.docs[0].data().email;
        } else {
            // Assume it's an email if no user is found, or throw error
            // For better UX, you might want to return a "user not found" message
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
