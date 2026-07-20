import { Id } from "../convex/_generated/dataModel";

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
    // ADR-0002: epoch ms preferred; string allowed during dual-write window.
    dateTaken?: number | string;
    location?: {
        lat: number;
        lng: number;
        name?: string;
        address?: string;
    },
    /** @deprecated Soft-delete flag; filtered until dropLegacyAlbumLifecycleFields. */
    isDeleted?: boolean;
    status: MediaStatus;
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

