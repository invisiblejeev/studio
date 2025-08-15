
'use client';

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads an image file to Firebase Storage.
 * @param file The image file to upload.
 * @param path The path in Firebase Storage where the file should be stored (e.g., 'profile-pictures').
 * @returns The public download URL of the uploaded image.
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
    // Create a unique file name to avoid overwrites.
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `${path}/${fileName}`);

    // Upload the file to the specified path.
    const snapshot = await uploadBytes(storageRef, file);

    // Get the public URL of the uploaded file.
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
};
