import { Id } from "@/convex/_generated/dataModel";

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