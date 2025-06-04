import { api } from "@/convex/_generated/api";
import { OptimisticMedia } from "@/types/Media";
import { FirebaseStorageTypes } from "@react-native-firebase/storage";
import { useMutation } from "convex/react";
import { getThumbnailAsync } from "expo-video-thumbnails";
import { Image, Video } from 'react-native-compressor';

export async function processImage(
    media: OptimisticMedia,
    storageRef: FirebaseStorageTypes.Reference,
    onProgress: (progress: number) => void,
    onError: (error: string) => void,
    onSuccess: () => void,
) {
    const createMediaEntry = useMutation(api.media.createMedia);
    let uploadTask: FirebaseStorageTypes.Task | null = null;

    try {
        onProgress(5);

        // Compression phase (0-30%)
        const compressedUri = await Image.compress(media.uri, {
            output: 'jpg',
            quality: 0.8,
        });
        onProgress(30);

        // Upload phase (30-90%)
        uploadTask = storageRef.child(`images/${media._id}.jpg`).putFile(compressedUri, {
            contentType: 'image/jpeg',
        });

        const downloadUrl = await new Promise<string>((resolve, reject) => {
            uploadTask?.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(30 + (progress * 0.6));
                },
                (error) => reject(error),
                async () => {
                    const url = await uploadTask?.snapshot?.ref.getDownloadURL();
                    if (url) resolve(url);
                }
            );
        });

        onProgress(90);

        // Convex phase (90-100%)
        await createMediaEntry({
            albumId: media.albumId,
            uploadedById: media.uploadedBy,
            filename: media.filename ?? media._id,
            downloadUrl: downloadUrl,
            type: 'image',
            width: media.width,
            height: media.height,
            uploadedAt: Date.now(),
        });

        onProgress(100);
        onSuccess();
    } catch (e: any) {
        console.error('Error processing image:', e);

        if (uploadTask) {
            try {
                uploadTask.cancel();
            } catch (cancelError) {
                console.warn('Failed to cancel upload task: ', cancelError);
            }
        }

        onError(e.message || 'Image processing failed');
    }
}

export async function processVideo(
    media: OptimisticMedia,
    storageRef: FirebaseStorageTypes.Reference,
    onProgress: (progress: number) => void,
    onError: (error: string) => void,
    onSuccess: () => void,
) {
    const createMediaEntry = useMutation(api.media.createMedia);
    let videoTask: FirebaseStorageTypes.Task | null = null;
    let thumbnailTask: FirebaseStorageTypes.Task | null = null;

    try {
        onProgress(5);

        // Video compression phase (5-35%)
        const compressedUri = await Video.compress(
            media.uri,
            {
                compressionMethod: 'auto',
            },
            (progress) => onProgress(5 + (progress * 0.3))
        );

        // Thumbnail generation phase (35-40%)
        const thumbnail = await getThumbnailAsync(media.uri, {
            quality: 0.8,
        });
        onProgress(40);

        // Parallel upload phase (40-85%)
        const videoUploadPromise = new Promise<string>((resolve, reject) => {
            videoTask = storageRef.child(`videos/${media._id}.mp4`).putFile(compressedUri, {
                contentType: 'video/mp4',
            });

            videoTask.on('state_changed',
                (snapshot: any) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(40 + (progress * 0.35));
                },
                (error) => reject(new Error(`Video upload failed: ${error.message}`)),
                async () => {
                    try {
                        const url = await videoTask?.snapshot?.ref.getDownloadURL();
                        if (url) resolve(url);
                        else reject(new Error(`Failed to get video download URL`));
                    } catch (e: any) {
                        reject(new Error(`Unexpected error: ${e.message}`));
                    }
                },
            );
        });

        const thumbnailUploadPromise = new Promise<string>((resolve, reject) => {
            thumbnailTask = storageRef.child(`thumbnails/${media._id}_thumb.jpg`).putFile(thumbnail.uri, {
                contentType: 'image/jpeg',
            });

            thumbnailTask.on('state_changed',
                (snapshot: any) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(75 + (progress * 0.1)); // 75-80%
                },
                (error: any) => reject(new Error(`Thumbnail upload failed: ${error.message}`)),
                async () => {
                    try {
                        const url = await thumbnailTask?.snapshot?.ref.getDownloadURL();
                        if (url) resolve(url);
                        else reject(new Error(`Failed to get thumbnail download URL`));
                    } catch (e: any) {
                        reject(new Error(`Unexpected error: ${e.message}`));
                    }
                },
            );
        });

        const [downloadUrl] = await Promise.all([videoUploadPromise, thumbnailUploadPromise]);
        onProgress(85);

        await createMediaEntry({
            albumId: media.albumId,
            uploadedById: media.uploadedBy,
            filename: media.filename,
            downloadUrl: downloadUrl,
            type: 'video',
            width: media.width,
            height: media.height,
            uploadedAt: Date.now(),
        });

        onProgress(100);
        onSuccess();


        /* old code
        
        
        
        const videoTask = storageRef.child(`videos/${media._id}.mp4`).putFile(compressedUri, {
            contentType: 'video/mp4',
        });
        const thumbnailTask = storageRef.child(`thumbnails/${media._id}_thumb.jpg`).putFile(thumbnail.uri, {
            contentType: 'image/jpeg',
        });

        // should account for 30% of the total progress
        const downloadUrl = await new Promise<string>((resolve, reject) => {
            videoTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(40 + (progress * 0.3));
                }, (error) => reject(error),
                async () => {
                    const url = await videoTask.snapshot?.ref.getDownloadURL();
                    if (url) resolve(url);
                });
        });

        // should account for 20% of the total progress
        thumbnailTask.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(70 + (progress * 0.2));
        });
        */
    } catch (e: any) {
        onError(e.message);
    }
}