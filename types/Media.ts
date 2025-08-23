import { Id } from "@/convex/_generated/dataModel";
import { ImagePickerAsset } from "expo-image-picker";

export type DbMedia = {
    _id: Id<'media'>; // the filename of the asset
    uploaderId: Id<'profiles'>;
    fileType: 'image' | 'video';
    originalFilename: string;
    uploadedAt: number;
    size?: number;
    width?: number;
    height?: number;
    duration?: number;
    dateTaken?: string;
    location?: {
        lat: number;
        lng: number;
        name?: string;
        address?: string;
    },
    isDeleted: boolean;
}

export type OptimisticMedia = Omit<DbMedia, '_id' | 'uploadedAt' | 'isDeleted'> &
{
    asset: ImagePickerAsset;
    status: 'pending' | 'uploading' | 'success' | 'error' | 'paused';
    progress?: number;
    error?: string;
}

export type Media = DbMedia | OptimisticMedia;