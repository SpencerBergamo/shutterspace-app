import { Id } from '@/convex/_generated/dataModel';
import { OptimisticMedia } from '@/types/Media';
import { processImage, processVideo } from '@/utils/processAssets';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

export const useMediaUpload = (albumId: Id<'albums'>, profileId: Id<'profiles'>) => {
    const [optimisticMedia, setOptimisticMedia] = useState<OptimisticMedia[]>([]);
    const storageRef = storage().ref(`albums/${albumId}`);

    const removeOptimisticMedia = (mediaId: string) => {
        setOptimisticMedia(prev => prev.filter(item => item._id !== mediaId));
    }

    const updateOptimisticMedia = (
        mediaId: string,
        updates: Partial<OptimisticMedia>) => {
        setOptimisticMedia(prev => prev.map(item => item._id === mediaId ? {
            ...item,
            ...updates,
        } : item));
    };

    const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const createOptimisticMedia = (assets: ImagePicker.ImagePickerAsset[]): OptimisticMedia[] => {
        return assets.map(asset => ({
            _id: generateId(),
            albumId: albumId,
            uploadedBy: profileId,
            uri: asset.uri,
            mimeType: asset.mimeType,
            filename: asset.fileName,
            width: asset.width,
            height: asset.height,
            type: asset.type,
            exif: asset.exif,
            status: 'pending',
        })) as OptimisticMedia[];
    };

    const uploadAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
        const newOptimisticMedia = createOptimisticMedia(assets);
        setOptimisticMedia(prev => [...prev, ...newOptimisticMedia]);

        for (const media of newOptimisticMedia) {
            if (media.status === 'success' || media.status === 'error') continue;

            if (media.type === 'video') {
                await processVideo(
                    media,
                    storageRef,
                    (progress) => updateOptimisticMedia(media._id, {
                        status: 'uploading',
                        progress: progress,
                    }),
                    (error) => updateOptimisticMedia(media._id, {
                        status: 'error',
                        error: error,
                    }),
                )
            } else {
                await processImage(
                    media,
                    storageRef,
                    (progress) => updateOptimisticMedia(media._id, {
                        status: 'uploading',
                        progress: progress,
                    }),
                    (error) => updateOptimisticMedia(media._id, {
                        status: 'error',
                        error: error,
                    }),
                );
            }
        }
    }

    return {
        optimisticMedia,
        removeOptimisticMedia,
        uploadAssets,
    }
}