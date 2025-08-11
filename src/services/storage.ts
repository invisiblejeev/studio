
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadProfilePicture = async (uid: string, file: File): Promise<string> => {
    const filePath = `avatars/${uid}/${file.name}`;
    const storageRef = ref(storage, filePath);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
};
