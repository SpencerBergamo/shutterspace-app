import { Id } from "@/convex/_generated/dataModel";

export interface Media {
    _id: Id<'media'>; // convex id
    albumId: Id<'albums'>;
    uploadedBy: Id<'profiles'>;
    cloudinaryId: string;
    mediaType: 'image' | 'video';
    uploadedAt: number; // unix timestamp in ms
    exifData: ExifData | null;
}

export interface OptimisticMedia {
    _id: string;
    uri: string;
    mimeType?: string;
    albumId: Id<"albums">;
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress?: number;
    uploadedBy: Id<'profiles'>;
    mediaType: 'image' | 'video';
    size?: number;
    error?: string;
}

export interface ExifData {
    creationTime?: number; //unix timestamp
    location?: {
        latitude: number;
        longitude: number;
        altitude?: number;
    },
    imageInfo?: {
        width: number;
        height: number;
        orientation?: number;
    }
}