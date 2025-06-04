import { Id } from "@/convex/_generated/dataModel";
import { OptimisticMedia } from "@/types/Media";
import { ImagePickerAsset } from "expo-image-picker";


export const generateMediaId = (): string =>
    `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

export const createOptimisticMedia = (
    assets: ImagePickerAsset[],
    albumId: Id<'albums'>,
    profileId: Id<'profiles'>
): OptimisticMedia[] => {
    return assets.map(asset => ({
        _id: generateMediaId(),
        albumId: albumId,
        uploadedBy: profileId,
        uri: asset.uri,
        mimeType: asset.mimeType,
        filename: asset.fileName,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        exif: asset.exif,
        status: 'pending',
    })) as OptimisticMedia[];
};