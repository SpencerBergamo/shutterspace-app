import { Id } from "@/convex/_generated/dataModel";
import * as ImagePicker from 'expo-image-picker';

// Base media document that represents the data stored in Convex
export type DbMedia = {
    _id: Id<'media'>; // the filename of the asset
    albumId: Id<'albums'>;
    uploaderId: Id<'profiles'>;
    filename: string;
    asset: {
        type: 'image';
        imageId: string;
        width: number;
        height: number;
    } | {
        type: 'video';
        videoUid: string;
        duration: number;
        width?: number;
        height?: number;
    };
    size?: number;
    dateTaken?: string;
    location?: {
        lat: number;
        lng: number;
        name?: string;
        address?: string;
    },
    isDeleted: boolean;
}

export type OptimisticMedia = Omit<DbMedia, "_id" | "asset"> & {
    _id: string;
    file: ImagePicker.ImagePickerAsset;
    type: 'image' | 'video';
    status: 'pending' | 'uploading' | 'success' | 'error' | 'paused';
    error?: string;
}

export type Media = DbMedia | OptimisticMedia;

export type TypeAndID = { type: 'image' | 'video'; id: string; }

export interface ProcessAssetResponse {
    status: 'success' | 'error';
    error?: string;
    result: {
        filename: string;
        size: number | undefined;
        type: string;
        assetId: string;
        width: number;
        height: number;
        duration?: number;
    } | null;
}

export interface UploadURLResponse {
    result: {
        id: string;
        uploadURL: string;
    };
    success: boolean;
    errors: string[];
    messages: string[];
}



// Media with signed URLs for client-side rendering
// export type MediaWithSignedUrls = DbMedia & {
//     signedUrl: string;
//     thumbnailUrl: string;
//     expiresAt: number;
// }

// export type OptimisticMedia = Omit<DbMedia, '_id' | 'uploadedAt' | 'isDeleted'> &
// {
//     asset: ImagePickerAsset;
//     status: 'pending' | 'uploading' | 'success' | 'error' | 'paused';
//     progress?: number;
//     error?: string;
// }

// export type Media = MediaWithSignedUrls | OptimisticMedia;