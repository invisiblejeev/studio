
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

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


export async function createUserProfile(uid: string, data: Omit<UserProfile, 'uid'>) {
    const userProfileData = {
        uid,
        ...data,
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        isAdmin: false, // Default isAdmin to false for new users
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
