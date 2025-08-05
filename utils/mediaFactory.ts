import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { OptimisticMedia } from "@/types/Media";
import { FirebaseStorageTypes } from "@react-native-firebase/storage";
import { useMutation } from "convex/react";
import { ImagePickerAsset } from "expo-image-picker";
import { getThumbnailAsync } from "expo-video-thumbnails";
import { Image, Video } from 'react-native-compressor';

export const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const getMediaType = (type: ImagePickerAsset['type']): 'image' | 'video' => {
    return type === 'video' ? 'video' : 'image';
}

export const calculateAspectRatio = (width: number, height: number): number => {
    return width / height;
}

export const createOptimisticMedia = (
    assets: ImagePickerAsset[],
    albumId: Id<'albums'>,
    profileId: Id<'profiles'>,
): OptimisticMedia[] => {
    return assets.map(asset => ({
        albumId: albumId,
        createdAt: Date.now(),
        uploadedById: profileId,
        filename: asset.fileName ?? `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        type: asset.type === 'video' ? 'video' : 'image',
        width: asset.width,
        height: asset.height,
        duration: asset.duration ?? undefined,
        asset: asset,
        status: 'pending',
    }));
}

export async function processImage(
    media: OptimisticMedia,
    storageRef: FirebaseStorageTypes.Reference,
    onProgress: (progress: number) => void,
    onError: (error: string) => void,
    onSuccess: () => void,
) {
    const asset = media.asset;
    const createMediaEntry = useMutation(api.media.createMedia);
    let uploadTask: FirebaseStorageTypes.Task | null = null;

    try {
        onProgress(5);

        // Compression phase (0-30%)
        const compressedUri = await Image.compress(asset.uri, {
            output: 'jpg',
            quality: 0.9,
        });
        onProgress(30);

        // Upload phase (30-90%)

        const downloadUrl = await new Promise<string>((resolve, reject) => {
            uploadTask = storageRef.child(`images/${media.filename}.jpg`).putFile(compressedUri, {
                contentType: 'image/jpeg',
            });

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(30 + (progress * 0.6));
                },
                (error) => {
                    uploadTask?.cancel();
                    reject(error);
                },
                async () => {
                    const url = await uploadTask?.snapshot?.ref.getDownloadURL();
                    if (url) resolve(url);
                    else reject(new Error(`Failed to get image download URL`));
                }
            );
        });

        onProgress(90);

        // Convex phase (90-100%)
        await createMediaEntry({
            filename: media.filename,
            createdAt: media.createdAt,
            albumId: media.albumId,
            uploadedById: media.uploadedById,
            downloadUrl: downloadUrl,
            thumbnailUrl: downloadUrl,
            type: 'image',
            width: media.width,
            height: media.height,
            uploadedAt: Date.now(),
        });

        onProgress(100);
        onSuccess();
    } catch (e: any) {
        console.error('mediaFactory:processImage (FAIL)', e);
        onError('unknown');
    }
}

export async function processVideo(
    media: OptimisticMedia,
    storageRef: FirebaseStorageTypes.Reference,
    onProgress: (progress: number) => void,
    onError: (error: string) => void,
    onSuccess: () => void,
) {
    const asset = media.asset;
    const createMediaEntry = useMutation(api.media.createMedia);
    let videoTask: FirebaseStorageTypes.Task | null = null;
    let thumbnailTask: FirebaseStorageTypes.Task | null = null;

    try {
        onProgress(5);

        // Video compression phase (5-35%)
        const compressedUri = await Video.compress(
            asset.uri,
            { compressionMethod: 'auto' },
            (progress) => onProgress(5 + (progress * 0.3))
        );

        // Thumbnail generation phase (35-40%)
        const thumbnail = await getThumbnailAsync(asset.uri, {
            quality: 0.8,
        });
        onProgress(40);

        // Parallel upload phase (40-85%)
        const videoUploadPromise = new Promise<string>((resolve, reject) => {
            videoTask = storageRef
                .child(`videos/${media.filename}.mp4`)
                .putFile(compressedUri, { contentType: 'video/mp4' });

            videoTask.on('state_changed',
                (snapshot: any) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(40 + (progress * 0.35));
                },
                (error) => {
                    videoTask?.cancel();
                    reject(error);
                },
                async () => {
                    try {
                        const url = await videoTask?.snapshot?.ref.getDownloadURL();
                        if (url) resolve(url);
                        else reject(new Error(`Failed to get video download URL`));
                    } catch (error: any) {
                        reject(error);
                    }
                },
            );
        });


        const thumbnailUploadPromise = new Promise<string>((resolve, reject) => {
            thumbnailTask = storageRef
                .child(`thumbnails/${media.filename}_thumb.jpg`)
                .putFile(thumbnail.uri, { contentType: 'image/jpeg' });

            thumbnailTask.on('state_changed',
                (snapshot: any) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(75 + (progress * 0.1)); // 75-80%
                },
                (error: any) => {
                    thumbnailTask?.cancel();
                    reject(error);
                },
                async () => {
                    try {
                        const url = await thumbnailTask?.snapshot?.ref.getDownloadURL();
                        if (url) resolve(url);
                        else reject(new Error(`Failed to get thumbnail download URL`));
                    } catch (error: any) {
                        reject(error);
                    }
                },
            );
        });

        const [downloadUrl, thumbnailUrl] = await Promise.all([videoUploadPromise, thumbnailUploadPromise]);
        onProgress(85);

        await createMediaEntry({
            filename: media.filename,
            createdAt: media.createdAt,
            albumId: media.albumId,
            uploadedById: media.uploadedById,
            downloadUrl: downloadUrl,
            thumbnailUrl: thumbnailUrl,
            type: 'video',
            width: media.width,
            height: media.height,
            uploadedAt: Date.now(),
        });

        onProgress(100);
        onSuccess();
    } catch (e: any) {
        console.error('mediaFactory:processVideo (FAIL)', e);
        onError('unknown');
    }
}