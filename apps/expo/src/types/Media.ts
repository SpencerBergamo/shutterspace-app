import { Id } from "@shutterspace/backend/convex/_generated/dataModel";

export type MimeType =
    | 'video/mp4'
    | 'video/quicktime'
    | 'video/mov'
    | 'image/jpeg'
    | 'image/png'
    | 'image/heic';

export type Extensions =
    | 'mp4'
    | 'mov'
    | 'quicktime'
    | 'jpeg'
    | 'png'
    | 'heic';

export type MediaStatus = 'pending' | 'ready' | 'error';

export type Media = {
    _id: Id<'media'>; // the filename of the asset
    _creationTime: number;
    albumId: Id<'albums'>;
    createdBy: Id<'profiles'>;
    assetId: string;
    filename: string;
    identifier: MediaIdentifier;
    size?: number;
    dateTaken?: string;
    location?: {
        lat: number;
        lng: number;
        name?: string;
        address?: string;
    },
    status: MediaStatus;
    isDeleted: boolean;
}

export type MediaIdentifier = {
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


export interface PrepareUploadResult {
    uploadUrl: string;
    identifier: MediaIdentifier;
};

