import { FirebaseStorageTypes } from "@react-native-firebase/storage";
import { ImagePickerAsset } from "expo-image-picker";

export async function uploadToStorage(
    storageRef: FirebaseStorageTypes.Reference,
    fileUri: string,
    directory: string,
    contentType: ImagePickerAsset['mimeType'],
    onProgress: (progress: number) => void
): Promise<string | null> {
    try {
        const task = storageRef.child(directory).putFile(fileUri, {
            contentType: contentType,
        });

        return new Promise<string>((resolve, reject) => {
            task.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(progress);
                },
                (error) => reject(error),
                async () => {
                    const url = await task.snapshot?.ref.getDownloadURL();
                    if (url) resolve(url);
                }
            )
        });
    } catch (e) {
        console.error('Error uploading to storage', e);
        return null;
    }

}