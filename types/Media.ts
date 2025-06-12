import { Id } from "@/convex/_generated/dataModel";
import { ImagePickerAsset } from "expo-image-picker";

export type DbMedia = {
    _id: Id<'media'>; // the filename of the asset
    filename: string;
    createdAt: number;
    albumId: Id<'albums'>;
    uploadedById: Id<'profiles'>;
    downloadUrl: string;
    thumbnailUrl: string;
    type: 'image' | 'video';
    width: number;
    height: number;
    duration?: number;
}

export type OptimisticMedia = Omit<DbMedia, '_id' | 'downloadUrl' | 'thumbnailUrl'> &
{
    asset: ImagePickerAsset;
    status: 'pending' | 'uploading' | 'success' | 'error' | 'paused';
    progress?: number;
    error?: 'network' | 'maxretries' | 'unknown';
}

export type Media = DbMedia | OptimisticMedia;