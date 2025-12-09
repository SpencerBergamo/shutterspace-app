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
    mimeType: string;
    type: 'image' | 'video';
    size?: number;
    creationTime?: number;
};

export async function validateAssets(assets: ImagePickerAsset[]): Promise<{ valid: ValidatedAsset[], invalid: ValidatedAsset[] }> {
    let invalid: ValidatedAsset[] = [];
    let valid: ValidatedAsset[] = [];

    for (const asset of assets) {
        const fileInfo = new File(asset.uri).info();
        const extension = fileInfo.uri?.split('.').pop()?.toLowerCase();
        if (!extension || !ALLOWED_EXTENSIONS.has(extension as Extensions)) {
            invalid.push({
                uri: asset.uri,
                width: asset.width,
                height: asset.height,
                assetId: asset.assetId ?? uuidv4(),
                filename: asset.fileName ?? `${asset.assetId ?? uuidv4()}.${extension}`,
                mimeType: asset.mimeType ?? EXTENSION_TO_MIME[extension as Extensions],
                type: asset.type === 'video' ? 'video' : 'image',
            });
            console.error(`Invalid extension: ${extension}`);
            continue;
        }

        const assetId = asset.assetId ?? uuidv4();
        let filename = asset.fileName ?? `${assetId}.${extension}`;
        let mimeType = asset.mimeType ?? EXTENSION_TO_MIME[extension as Extensions];
        const type = asset.type === 'video' ? 'video' : 'image';
        const size = asset.fileSize ?? fileInfo.size;
        const creationTime = fileInfo.modificationTime;

        const validatedAsset: ValidatedAsset = {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            assetId,
            filename,
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