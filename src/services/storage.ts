
'use client';

/**
 * Converts an image File object into a Base64 encoded Data URI.
 * @param file The image file to convert.
 * @returns A promise that resolves with the Data URI string.
 */
export const imageToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to read file as Data URI.'));
            }
        };
        reader.onerror = (error) => {
            reject(error);
        };
    });
};
