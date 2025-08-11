import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const signUp = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export const signIn = async (loginId, password) => {
    let email = loginId;

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
