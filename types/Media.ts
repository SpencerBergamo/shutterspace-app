import { Id } from "@/convex/_generated/dataModel";

// export type MediaIdentifier = {
//     type: 'image';
//     imageId: string;
//     width: number;
//     height: number;
// } | {
//     type: 'video';
//     videoUid: string;
//     duration: number;
//     width?: number;
//     height?: number;
// }

// Base media document that represents the data stored in Convex
export type Media = {
    _id: Id<'media'>; // the filename of the asset
    _creationTime: number;
    albumId: Id<'albums'>;
    createdBy: Id<'profiles'>;
    filename: string;
    identifier: {
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
    }
    size?: number;
    dateTaken?: string;
    location?: {
        lat: number;
        lng: number;
        name?: string;
        address?: string;
    },
    isDeleted: boolean;
    status: 'pending' | 'ready' | 'error';
}

// Optimistic media for immediate display of selected assets before upload
// export type PendingMedia = {
//     tempId: string; // unique identifier for local tracking
//     albumId: Id<'albums'>;
//     localUri: string;
//     filename: string;
//     type: 'image' | 'video';
//     width: number;
//     height: number;
//     duration?: number;
//     size?: number;
//     dateTaken?: string;
//     uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
//     progress?: number;
//     error?: string;
//     // Will be populated after successful upload
//     remoteId?: string; // imageId or videoUid from Cloudflare
//     _id?: Id<'media'>; // Convex document ID after creation
// }

// // Combined type for rendering in UI
// export type DisplayMedia = Media | PendingMedia;

// // Type guards
// export const isPendingMedia = (media: DisplayMedia): media is PendingMedia => {
//     return 'tempId' in media && 'uploadStatus' in media;
// }

// export const isDbMedia = (media: DisplayMedia): media is Media => {
//     return '_id' in media && !('tempId' in media);
// }

// export interface ProcessAssetResponse {
//     status: 'success' | 'error';
//     error?: string;
//     result: {
//         filename: string;
//         size: number | undefined;
//         type: string;
//         assetId: string;
//         width: number;
//         height: number;
//         duration?: number;
//     } | null;
// }

// export interface UploadURLResponse {
//     result: {
//         id: string;
//         uploadURL: string;
//     };
//     success: boolean;
//     errors: string[];
//     messages: string[];
// }



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