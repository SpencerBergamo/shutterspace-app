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

        const maxSize = type === 'video' ? 10000000 : 1000000;
        if (!size) {
            throw new Error("Invalid file size");
        } else if (size && size > maxSize) {
            throw new Error("File size exceeds max size");
        }

        const allowedTypes = type === 'video'
            ? ['video/mp4', 'video/quicktime', 'video/mov', 'video/m4v', 'video/avi', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv', 'video/mpeg', 'video/mpeg-2-ts', 'video/mpeg-2-ps', 'video/mxf', 'video/lxf', 'video/gxf', 'video/3gp', 'video/mpg']
            : ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(mimeType)) {
            throw new Error(`File type ${mimeType} is not allowed`);
        }

        return { props: { uri, size, type, mimeType, filename }, error: undefined };
    } catch (e: any) {
        return { props: null, error: e.message };
    }
}