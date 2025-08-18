
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, Unsubscribe } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  state?: string;
  city?: string;
  avatar?: string;
  isAdmin?: boolean;
}

export async function isIdentifierTaken(field: 'username' | 'email', value: string): Promise<boolean> {
  if (!value) {
    return false;
  }
  const q = query(collection(db, 'users'), where(field, '==', value.toLowerCase()));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}


export async function createUserProfile(uid: string, data: Omit<UserProfile, 'uid' | 'isAdmin'>) {
    const userProfileData = {
        uid,
        ...data,
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        // isAdmin field is no longer set by default.
    };
    
    await setDoc(doc(db, 'users', uid), userProfileData);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const userProfile = docSnap.data() as UserProfile;
    return userProfile;
  }
  return null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, 'users', uid);
  const updatedData: { [key: string]: any } = { ...data };
  
  if (data.username) {
    updatedData.username = data.username.toLowerCase();
  }
  if (data.email) {
    updatedData.email = data.email.toLowerCase();
  }
  // Ensure isAdmin is not accidentally overwritten by a client-side update
  // unless it's explicitly part of the update object (which it shouldn't be from the profile page)
  if ('isAdmin' in updatedData) {
      delete updatedData.isAdmin;
  }

  await updateDoc(userRef, updatedData);
}

export async function deleteUserProfile(uid: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
}

export async function getUserCountByState(state: string): Promise<number> {
    if (!state) return 0;
    try {
        const q = query(collection(db, 'users'), where('state', '==', state));
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error) {
        console.error("Error getting user count by state: ", error);
        return 0;
    }
}
