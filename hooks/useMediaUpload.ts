import { Id } from '@/convex/_generated/dataModel';
import { OptimisticMedia } from '@/types/Media';
import { processImage, processVideo } from '@/utils/processAssets';
import storage, { FirebaseStorageTypes } from '@react-native-firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { getNetworkStateAsync } from 'expo-network';
import { useCallback, useEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';

interface UploadTask {
    mediaId: string;
    task?: FirebaseStorageTypes.TaskSnapshot; //firebase upload task
    retryCount: number;
    maxRetries: number;
}

export const useMediaUpload = (albumId: Id<'albums'>, profileId: Id<'profiles'>) => {
    const [optimisticMedia, setOptimisticMedia] = useState<OptimisticMedia[]>([]);
    const storageRef = storage().ref(`albums/${albumId}`);
    const processingQueue = useRef<OptimisticMedia[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const currentTask = useRef<any>(null);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    const removeOptimisticMedia = useCallback((mediaId: string) => {
        // find and remove the media from optimistic media, upload tasks, and retry queue
        setOptimisticMedia(prev => prev.filter(item => item._id !== mediaId));
        processingQueue.current = processingQueue.current.filter(item => item._id !== mediaId);
    }, []);

    const updateOptimisticMedia = useCallback((
        mediaId: string,
        updates: Partial<OptimisticMedia>
    ) => {
        setOptimisticMedia(prev => prev.map(item => item._id === mediaId
            ? { ...item, ...updates } : item
        ));
    }, []);

    const generateId = useCallback(() =>
        `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`, []);


    /* createOptimisticMedia useCallback 
    why use a callback and use the dependencies array?
    answer: because we want to create a new optimistic media object for each asset,
    and we want to use the albumId and profileId from the parent component.
    and we want to use the generateId function to create a new id for each asset.
    and we want to use the useCallback hook to memoize the function so that it doesn't
    recreate the function on every render.
    */
    const createOptimisticMedia = useCallback((
        assets: ImagePicker.ImagePickerAsset[]): OptimisticMedia[] => {
        return assets.map(asset => ({
            _id: generateId(),
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
    }, [albumId, profileId, generateId]);

    const checkNetworkStatus = useCallback(async (): Promise<boolean> => {
        const status = await getNetworkStateAsync();
        return status.isConnected ?? false;
    }, []);

    // 2. Upload Process
    // - processes the next item in the queue
    // - handles retry logic, exponential backoff, and network error handling
    // - updates UI with progress and status
    const processNextInQueue = useCallback(async () => {
        // if the processingQueue is empty, set isProcessing to false and return
        if (processingQueue.current.length === 0) {
            setIsProcessing(false);
            return;
        }

        const media = processingQueue.current.shift();
        const maxRetries = 3;

        // we already checked the processingQueue length, so this check is for 
        // the case the shift operation is executed and media is undefined
        if (!media) return;

        const processWithRetry = async (attempt: number = 1): Promise<void> => {
            try {
                const isConnected = await checkNetworkStatus();
                if (!isConnected) {
                    updateOptimisticMedia(media._id, {
                        status: 'error',
                        error: 'No internet connection',
                    });

                    processNextInQueue();
                    return;
                }

                updateOptimisticMedia(media._id, { status: 'uploading', progress: 0 });

                const onProgress = (progress: number) => {
                    updateOptimisticMedia(media._id, { progress: Math.min(progress, 99) });
                }

                const onError = async (error: string) => {
                    console.error(`Upload error for ${media._id} (attempt ${attempt})`, error);

                    const isNetworkError = error.toLowerCase().includes('network') ||
                        error.toLowerCase().includes('timeout') ||
                        error.toLowerCase().includes('connection');

                    if (attempt < maxRetries && isNetworkError) {
                        // exponential backoff: 2^attempt seconds
                        const delay = Math.pow(2, attempt) * 1000;

                        updateOptimisticMedia(media._id, {
                            status: 'retrying',
                            error: `Retrying in ${delay / 1000}s... (${attempt}/${maxRetries})`
                        });

                        const timeout = setTimeout(() => {
                            processWithRetry(attempt + 1);
                        }, delay);
                    } else {
                        updateOptimisticMedia(media._id, {
                            status: 'error',
                            error: attempt >= maxRetries
                                ? `Failed after ${maxRetries} attempts: ${error}`
                                : error,
                        });

                        // Continue with the next item in the queue
                        processNextInQueue();
                    }
                };

                const onSuccess = () => {
                    updateOptimisticMedia(media._id, {
                        status: 'success',
                        progress: 100,
                    });

                    // Continue with the next item in the queue
                    processNextInQueue();
                };

                if (media.type === 'video') {
                    // await processVideo(media, storageRef, onProgress, onError, onSuccess);
                    currentTask.current = await processVideo(media, storageRef, onProgress, onError, onSuccess);
                } else {
                    currentTask.current = await processImage(media, storageRef, onProgress, onError, onSuccess);
                }
            } catch (e: any) {
                console.error(`Unexpected error processing ${media._id}:`, e);

                updateOptimisticMedia(media._id, {
                    status: 'error',
                    error: e.message || 'Unknown error',
                });

                processNextInQueue();
            }
        };

        await processWithRetry();
    }, [storageRef, updateOptimisticMedia, checkNetworkStatus]);

    const uploadAssets = useCallback(async (assets: ImagePicker.ImagePickerAsset[]) => {
        const newOptimisticMedia = createOptimisticMedia(assets);
        setOptimisticMedia(prev => [...prev, ...newOptimisticMedia]);

        // Add to processing queue
        processingQueue.current.push(...newOptimisticMedia);

        Toast.show({
            type: 'info',
            text1: `Uploading ${newOptimisticMedia.length} file(s)`,
        });

        if (!isProcessing) {
            setIsProcessing(true);
            processNextInQueue();
        }

        /*
        try {
            for (const media of newOptimisticMedia) {
                await Promise.allSettled(
                    newOptimisticMedia.map(media => processMediaWithRetry(media))
                );
            }

            const successCount = newOptimisticMedia.filter(m =>
                optimisticMedia.find(om => om._id === m._id)?.status === 'success'
            ).length;

            const failedCount = newOptimisticMedia.length - successCount;

            if (failedCount > 0) {
                Toast.show({
                    type: 'error',
                    text1: `${failedCount} file(s) failed to upload`,
                    text2: 'Please check your internet connection and try again.',
                });
            } else {
                Toast.show({
                    type: 'success',
                    text1: `${successCount} file(s) uploaded successfully`,
                });
            }

        } catch (e) {
            console.error('Unknown error uploading assets:', e);
            Toast.show({
                type: 'error',
                text1: 'Upload failed',
                text2: 'Please try again later.',
            });
        }
            */
    }, [createOptimisticMedia, isProcessing, processNextInQueue]);

    const cancelCurrentUpload = useCallback(() => {
        if (currentTask.current) {
            currentTask.current.cancel?.();
            currentTask.current = null;
        }
    }, []);

    const clearQueue = useCallback(() => {
        processingQueue.current = [];
        cancelCurrentUpload();
        setIsProcessing(false);

        setOptimisticMedia(prev => prev.map(item =>
            item.status === 'pending' || item.status === 'uploading'
                ? { ...item, status: 'error', error: 'Cancelled' }
                : item
        ));
    }, [cancelCurrentUpload]);

    /*
        const retryFailedUploads = useCallback(async () => {
            const failedMedia = optimisticMedia.filter(m =>
                m.status === 'error' && retryQueue.current.has(m._id)
            );
    
            if (failedMedia.length === 0) return;
    
            const isConnected = await checkNetworkStatus();
            if (!isConnected) {
                Toast.show({
                    type: 'error',
                    text1: 'No Internet Connection',
                    text2: 'Please check your internet connection and try again.',
                });
                return;
            }
    
            for (const media of failedMedia) {
                await processMediaWithRetry(media, 1);
            }
    
        }, [optimisticMedia, processMediaWithRetry, checkNetworkStatus]);
    
        const cancelUpload = useCallback((mediaId: string) => {
            const task = uploadTasks.current.get(mediaId);
            if (task?.task) {
                task.task.ref.delete();
            }
            removeOptimisticMedia(mediaId);
        }, [removeOptimisticMedia]);
    
        // listen for network changes and retry failed uploads
        const handleNetworkChange = useCallback(async (state: any) => {
            if (state.isConnected && retryQueue.current.size > 0) {
                Toast.show({
                    type: 'info',
                    text1: 'Network connection restored',
                    text2: 'Retrying failed uploads...',
                });
                await retryFailedUploads();
            }
        }, [retryFailedUploads]);
        */

    // cleanup timeout on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            // cancel current upload
            if (currentTask.current) {
                currentTask.current.cancel();
            }

            // clear timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // clear queue
            processingQueue.current = [];

            // reset optimistic media
            setOptimisticMedia([]);
        };
    }, []);

    return {
        optimisticMedia,
        isProcessing,
        queueLength: processingQueue.current.length,
        removeOptimisticMedia,
        uploadAssets,
        cancelCurrentUpload,
        clearQueue,
    }
}