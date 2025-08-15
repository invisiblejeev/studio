
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { imageToDataUri } from './storage';

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


export async function createUserProfile(uid: string, data: Omit<UserProfile, 'uid' | 'avatar'> & { avatarFile?: File }) {
    let avatarDataUri = "";
    if (data.avatarFile) {
        avatarDataUri = await imageToDataUri(data.avatarFile);
    }

    const userProfileData = {
        uid,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        phone: data.phone,
        state: data.state,
        city: data.city,
        isAdmin: false, // Default isAdmin to false for new users
        avatar: avatarDataUri,
    };
    
    await setDoc(doc(db, 'users', uid), userProfileData);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, 'users', uid);
  const updatedData = { ...data };
  if (data.username) {
    updatedData.username = data.username.toLowerCase();
  }
  if (data.email) {
    updatedData.email = data.email.toLowerCase();
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
