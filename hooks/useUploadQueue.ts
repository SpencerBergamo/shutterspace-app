import { OptimisticMedia } from "@/types/Media";
import { FirebaseStorageTypes } from "@react-native-firebase/storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNetworkListener } from "./useNetworkListener";

type useUploadQueueResult = {
    queue: OptimisticMedia[];
    uploadMedia: (media: OptimisticMedia[]) => Promise<void>;
}

export const useUploadQueue = (
    storageRef: FirebaseStorageTypes.Reference,
): useUploadQueueResult => {
    const { isConnected, isNetworkError, calcRetryDelay } = useNetworkListener();
    const [queue, setQueue] = useState<OptimisticMedia[]>([]);
    const [isPaused, setIsPaused] = useState(false);

    const isProcessingRef = useRef(false);
    const currentProcessingIndexRef = useRef(0);
    const timeoutIdsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // --- Effect: handle network changes ---
    useEffect(() => {
        if (isConnected) { } else {
            console.warn('Network disconnected, pausing queue');
            pauseQueue();
        }
    }, [isConnected, queue.length, isPaused]);

    const updateMedia = useCallback((mediaId: string, update: Partial<OptimisticMedia>) => {
        setQueue(prev => prev.map(
            item => item.filename === mediaId ? { ...item, ...update } : item));
    }, []);

    const pauseQueue = useCallback(() => { }, []);

    const uploadMedia = useCallback(async (media: OptimisticMedia[]) => {


    }, []);

    const processNextInQueue = useCallback(async () => {
        // if processing already in progress, skip
        if (isProcessingRef.current) {
            console.warn('Processing already in progress, skipping');
            return;
        }

        const startIndex = currentProcessingIndexRef.current;
        const mediaToProcess = queue[startIndex];

        if (!mediaToProcess) {
            console.log('Queue is empty or all items have been processed');
            isProcessingRef.current = false;
            currentProcessingIndexRef.current = 0;
            return;
        }

        isProcessingRef.current = true;
        const maxRetries = 3;

        const processWithRetry = async (
            media: OptimisticMedia,
            attempt: number = 1,
        ): Promise<void> => {
            // clear any existing timeout for this media item
            if (timeoutIdsRef.current[media.filename]) {
                clearTimeout(timeoutIdsRef.current[media.filename]);
                delete timeoutIdsRef.current[media.filename];
            }

            try {
                if (!isConnected) {
                    console.warn('No Internet Connection, pausing upload');
                    updateMedia(media.filename, {
                        status: 'error',
                        error: 'network',
                    });

                    isProcessingRef.current = false;
                    return;
                }

                updateMedia(media.filename, { status: 'uploading', progress: 0 });

                const onProgress = (progress: number) => {
                    updateMedia(media.filename, { progress: Math.min(progress, 99) });
                }

                const onError = async (networkError: boolean) => {

                    if (attempt < maxRetries) {
                        const delay = calcRetryDelay(attempt);

                        updateMedia(media.filename, { status: 'uploading' });

                        timeoutIdsRef.current[media.filename] = setTimeout(() => {
                            processWithRetry(media, attempt + 1);
                        }, delay);
                    } else {
                        updateMedia(media.filename, {
                            status: 'error',
                            error: 'maxretries',
                        });

                        currentProcessingIndexRef.current++;
                        processNextInQueue();
                    }
                };

                const onSuccess = () => {
                    updateMedia(media.filename, {
                        status: 'success',
                        progress: 100,
                    });

                    currentProcessingIndexRef.current++;
                    processNextInQueue();
                };

                if (media.type === 'video') {
                    // await processVideo(media, storageRef, onProgress, onError, onSuccess);
                } else {
                    // await processImage(media, storageRef, onProgress, onError, onSuccess);
                }
            } catch (e) {

            }
        }

    }, []);

    return {
        queue,
        uploadMedia,
    }
}