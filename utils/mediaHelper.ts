import { ImagePickerAsset } from "expo-image-picker";
import { nanoid } from "nanoid";

type AllowedMimeTypes =
    | 'video/mp4'
    | 'video/quicktime'
    | 'video/mov'
    | 'image/jpeg'
    | 'image/png'
    | 'image/heic';

interface ValidatedAsset extends ImagePickerAsset {
    assetId: string;
    filename: string;
    mimeType: string;
    type: 'image' | 'video';
}

const ALLOWED_TYPES = new Set<AllowedMimeTypes>([
    'video/mp4',
    'video/quicktime',
    'video/mov',
    'image/jpeg',
    'image/png',
    'image/heic',
]);

const MAX_SIZE = {
    video: 2e+8, // 200MB
    image: 1e+7, // 10MB
}

function getMimeType(asset: ImagePickerAsset): AllowedMimeTypes | null {
    const ext = asset.uri.split('.').pop()?.toLowerCase();
    const mimeType = asset.mimeType;

    if (mimeType && ALLOWED_TYPES.has(mimeType as AllowedMimeTypes)) {
        return mimeType as AllowedMimeTypes;
    }

    const mimeMap: Record<string, AllowedMimeTypes> = {
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        png: 'image/png',
        heic: 'image/heic',
    };

    return ext && mimeMap[ext] ? mimeMap[ext] : null;
}

function generateFilename(mimeType: AllowedMimeTypes): string {
    const ext = mimeType.split('/')[1].replace('quicktime', 'mov'); // quicktime is not a valid extension type
    const timestamp = new Date().getTime();
    return `${timestamp}.${ext}`;
}

export const validateAssets = (assets: ImagePickerAsset[]) => {
    let invalid: ValidatedAsset[] = [];
    let valid: ValidatedAsset[] = [];

    for (const asset of assets) {
        const assetId = asset.assetId || nanoid();
        const type = asset.type === 'video' ? 'video' : 'image';

        const mimeType = getMimeType(asset);
        if (!mimeType) {
            console.warn('Invalid mime type');
            invalid.push({ ...asset, assetId, filename: asset.fileName || 'unknown', mimeType: 'invalid', type });
            continue;
        }

        const maxSize = type === 'video' ? MAX_SIZE.video : MAX_SIZE.image;
        if (!asset.fileSize) {
            console.warn('No file size found');
            invalid.push({ ...asset, assetId, filename: asset.fileName || 'unknown', mimeType: 'invalid', type });
            continue;
        } else if (asset.fileSize && asset.fileSize > maxSize) {
            console.warn('File size exceeds max size');
            invalid.push({ ...asset, assetId, filename: asset.fileName || 'unknown', mimeType: 'invalid', type });
            continue;
        }

        const filename = asset.fileName || generateFilename(mimeType);
        valid.push({ ...asset, assetId, filename, mimeType, type });
    }

    return { invalid, valid };
}

export const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}