import { Id } from "@/convex/_generated/dataModel";
import { } from "@/types/Media";
import { getStorage } from "@react-native-firebase/storage";
import { useCallback, useState } from "react";

type useUploadQueueResult = {
    queue: any[];
    uploadMedia: (media: any) => Promise<void>;
}

export const useUploadQueue = (
    albumId: Id<'albums'>,
): useUploadQueueResult => {
    const [queue, setQueue] = useState<any>([]);
    const storage = getStorage();
    // const storageRef = storage.ref(`albums/${albumId}`);

    // const updateState = useCallback((mediaId: string, update: Partial<OptimisticMedia>) => {
    //     setQueue(prev => prev.map(
    //         item => item.originalFilename === mediaId ? { ...item, ...update } : item));
    // }, []);

    const uploadMedia = useCallback(async (media: any) => {
        // for (const item of media) {
        //     const onProgress = (progress: number) => {
        //         updateState(item.filename, { progress: Math.min(progress, 99) });
        //     };

        //     const onError = (error: string) => {
        //         updateState(item.filename, { status: 'error', error: error });
        //     };

        //     const onSuccess = () => {
        //         updateState(item.filename, { status: 'success', progress: 100 });
        //     };

        //     try {
        //         updateState(item.filename, { status: 'uploading', progress: 0 });

        //         if (item.type === 'video') {
        //             // await processVideo(item, storageRef, onProgress, onError, onSuccess);
        //         } else {
        //             // await processImage(item, storageRef, onProgress, onError, onSuccess);
        //         }
        //     } catch (e) {
        //         console.error("useUploadQueue (FAIL)", e);
        //         onError('unknown');
        //     }
        // }
    }, [albumId]);

    return {
        queue,
        uploadMedia,
    }
}