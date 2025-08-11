
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export const uploadProfilePicture = async (uid: string, file: File): Promise<string> => {
    const filePath = `avatars/${uid}/${file.name}`;
    const storageRef = ref(storage, filePath);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
};

export const uploadChatImage = async (roomId: string, file: File): Promise<string> => {
    const fileName = `${uuidv4()}-${file.name}`;
    const filePath = `chat-images/${roomId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
}
