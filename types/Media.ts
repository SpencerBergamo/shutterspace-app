import { Id } from "@/convex/_generated/dataModel";
import { ImagePickerAsset } from "expo-image-picker";

export interface Media {
    _id: Id<'media'>; // convex id
    albumId: Id<'albums'>;
    uploadedBy: Id<'profiles'>;
    uploadedAt: number; // unix timestamp in ms
    filename: string;
    downloadUrl: string;
    type: 'image' | 'video';
    width: number;
    height: number;
    duration?: number;
}

export interface OptimisticMedia {
    _id: string;
    albumId: Id<"albums">;
    uploadedBy: Id<'profiles'>;
    uri: ImagePickerAsset['uri'];
    filename: string;
    width: number;
    height: number;
    mimeType: ImagePickerAsset['mimeType'];
    type: ImagePickerAsset['type'];
    exif: ImagePickerAsset['exif'];

    status: 'pending' | 'uploading' | 'success' | 'error' | 'paused';
    progress?: number;
    error?: string;
}
