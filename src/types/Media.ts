import { Id } from "@/convex/_generated/dataModel";

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