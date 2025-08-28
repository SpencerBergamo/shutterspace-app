import { Id } from "@/convex/_generated/dataModel";

// Base media document that represents the data stored in Convex
export type DbMedia = {
    _id: Id<'media'>; // the filename of the asset
    albumId: Id<'albums'>;
    uploaderId: Id<'profiles'>;
    uploadedAt: number;
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

export type Media = DbMedia & {
    signedUrl: string;
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