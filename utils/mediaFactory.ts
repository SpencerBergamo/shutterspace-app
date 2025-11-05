import { ImagePickerAsset } from "expo-image-picker";

export const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}


export interface ValidatedAsset {
    error?: string;
    props: {
        uri: string;
        size: number;
        type: 'image' | 'video';
        mimeType: string;
        filename: string;
    } | null;
}

export const validateAsset = (asset: ImagePickerAsset): ValidatedAsset => {
    try {
        const uri = asset.uri;
        const size = asset.fileSize;
        const type = asset.type === 'video' ? 'video' : 'image';
        const filename = asset.fileName || new Date().getTime() + Math.random().toString(36).substring(2, 15);

        let mimeType = asset.mimeType;
        if (!mimeType) {
            const ext = uri.split('.').pop()?.toLowerCase();
            if (type === 'video') {
                mimeType = ext === 'mov' ? 'video/quicktime' :
                    ext === 'mp4' ? 'video/mp4' :
                        ext === 'avi' ? 'video/avi' : 'video/mp4';
            } else {
                mimeType = ext === 'png' ? 'image/png' :
                    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                        ext === 'webp' ? 'image/webp' : 'image/jpeg';
            }
        }

        const maxSize = type === 'video' ? 2e+8 : 1e+7; // 200MB for videos, 10MB for images
        if (!size) {
            throw new Error("Invalid file size");
        } else if (size && size > maxSize) {
            throw new Error("File size exceeds max size");
        }

        const allowedTypes = type === 'video'
            ? ['video/mp4', 'video/mov', 'video/quicktime']
            : ['image/jpeg', 'image/png', 'image/jpg', 'image/heic'];

        if (!allowedTypes.includes(mimeType)) {
            throw new Error(`File type ${mimeType} is not allowed`);
        }

        return { props: { uri, size, type, mimeType, filename }, error: undefined };
    } catch (e: any) {
        return { props: null, error: e.message };
    }
}