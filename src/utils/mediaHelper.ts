import { File } from 'expo-file-system';
import { ImagePickerAsset } from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

type MimeType =
    | 'video/mp4'
    | 'video/quicktime'
    | 'video/mov'
    | 'image/jpeg'
    | 'image/jpg'
    | 'image/png'
    | 'image/heic';

type Extensions =
    | 'mp4'
    | 'mov'
    | 'quicktime'
    | 'jpeg'
    | 'jpg'
    | 'png'
    | 'heic';

const ALLOWED_EXTENSIONS = new Set<Extensions>([
    'mp4',
    'mov',
    'quicktime',
    'jpeg',
    'jpg',
    'png',
    'heic',
]);

const EXTENSION_TO_MIME: Record<string, MimeType> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    quicktime: 'video/quicktime',
    jpeg: 'image/jpeg',
    jpg: 'image/jpg',
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
        const fileInfo = await new File(asset.uri).info();
        if (!fileInfo.exists) {
            invalid.push({
                uri: asset.uri,
                assetId: asset.assetId ?? 'unknown',
            });
            console.error(`File does not exist: ${asset.uri}`);
            continue;
        }

        const assetId = asset.assetId ?? uuidv4();
        const filename = fileInfo.uri?.split('/').pop()?.split('.').shift() ?? asset.fileName ?? assetId;
        const type = asset.type === 'video' ? 'video' : 'image';
        const extension = fileInfo.uri?.split('.').pop()?.toLowerCase() ?? asset.uri.split('.').pop()?.toLowerCase();
        if (!extension || !ALLOWED_EXTENSIONS.has(extension as Extensions)) {
            invalid.push({
                uri: asset.uri,
                assetId: asset.assetId ?? 'unknown',
            });
            console.error(`Invalid extension: ${extension}`);
            continue;
        }

        const creationTime = fileInfo.creationTime;
        const mimeType = asset.mimeType ?? EXTENSION_TO_MIME[extension as Extensions];
        const size = asset.fileSize ?? fileInfo.size;

        if (!size || size > MAX_SIZE[type]) {
            invalid.push({
                uri: asset.uri,
                assetId: asset.assetId ?? 'unknown',
            });
            console.error(`Invalid size: ${size}`);
            continue;
        }

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

        valid.push(validatedAsset);
    }

    return { valid, invalid };
}

export const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}