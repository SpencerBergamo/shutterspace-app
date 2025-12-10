import { File } from 'expo-file-system';
import { ImagePickerAsset } from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

type MimeType =
    | 'video/mp4'
    | 'video/quicktime'
    | 'video/mov'
    | 'image/jpeg'
    | 'image/png'
    | 'image/heic';

type Extensions =
    | 'mp4'
    | 'mov'
    | 'quicktime'
    | 'jpeg'
    | 'png'
    | 'heic';

const ALLOWED_EXTENSIONS = new Set<Extensions>([
    'mp4',
    'mov',
    'quicktime',
    'jpeg',
    'png',
    'heic',
]);

const EXTENSION_TO_MIME: Record<string, MimeType> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    quicktime: 'video/quicktime',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    heic: 'image/heic',
};

const MAX_SIZE = {
    video: 2e+8, // 200MB
    image: 1e+7, // 10MB
};

export interface ValidatedAsset extends ImagePickerAsset {
    assetId: string;
    filename: string;
    extension: string;
    mimeType: string;
    type: 'image' | 'video';
    size?: number;
    creationTime?: number;
};

export interface InvalidAsset {
    uri: string;
    assetId: string;
}

export async function validateAssets(assets: ImagePickerAsset[]): Promise<{ valid: ValidatedAsset[], invalid: InvalidAsset[] }> {
    let invalid: InvalidAsset[] = [];
    let valid: ValidatedAsset[] = [];

    for (const asset of assets) {
        const extension = asset.uri.split('.').pop()?.toLowerCase();
        if (!extension || !ALLOWED_EXTENSIONS.has(extension as Extensions)) {
            invalid.push({
                uri: asset.uri,
                assetId: asset.assetId ?? 'unknown',
            });
            console.error(`Invalid extension: ${extension}`);
            continue;
        }

        const assetId = asset.assetId ?? uuidv4();
        let filename = asset.fileName ?? `${assetId}.${extension}`;
        let mimeType = asset.mimeType ?? EXTENSION_TO_MIME[extension as Extensions];
        const type = asset.type === 'video' ? 'video' : 'image';
        let size = asset.fileSize;

        const fileInfo = await new File(asset.uri).info();
        if (!fileInfo.exists) {
            invalid.push({
                uri: asset.uri,
                assetId: asset.assetId ?? 'unknown',
            });
            console.error(`File does not exist: ${asset.uri}`);
            continue;
        }
        if (!size) size = fileInfo.size;
        const creationTime = fileInfo.modificationTime;

        const validatedAsset: ValidatedAsset = {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            assetId,
            filename,
            extension,
            mimeType,
            type,
            size,
            creationTime,
        };

        if (!size || size > MAX_SIZE[type]) {
            invalid.push(validatedAsset);
            continue;
        }

        valid.push(validatedAsset);
    }

    return { valid, invalid };
}

export const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}