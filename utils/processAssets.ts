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
    onError: (error: string) => void
) {
    const createMediaEntry = useMutation(api.media.createMedia);

    try {
        onProgress(0);

        const compressedUri = await Image.compress(media.uri, {
            output: 'jpg',
            quality: 0.8,
        });

        const imageTask = storageRef.child(`images/${media._id}.jpg`).putFile(compressedUri, {
            contentType: 'image/jpeg',
        })

        // should account for 60% of the total progress
        const downloadUrl = await new Promise<string>((resolve, reject) => {
            imageTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(60 + (progress * 0.4));
                },
                (error) => reject(error),
                async () => {
                    const url = await imageTask.snapshot?.ref.getDownloadURL();
                    if (url) resolve(url);
                }
            )
        });

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
    } catch (e: any) {
        onError(e.message);
    }
}

export async function processVideo(
    media: OptimisticMedia,
    storageRef: FirebaseStorageTypes.Reference,
    onProgress: (progress: number) => void,
    onError: (error: string) => void
) {
    const createMediaEntry = useMutation(api.media.createMedia);

    try {
        onProgress(0);

        // should account for 40% of the total progress
        const compressedUri = await Video.compress(
            media.uri, {},
            (progress) => onProgress(progress * 0.4));

        // should account for 0% of the total progress
        const thumbnail = await getThumbnailAsync(media.uri, {
            quality: 0.8,
        });

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
    } catch (e: any) {
        onError(e.message);
    }
}