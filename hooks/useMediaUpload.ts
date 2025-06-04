import { Id } from '@/convex/_generated/dataModel';
import { OptimisticMedia } from '@/types/Media';
import { createOptimisticMedia } from '@/utils/mediaFactory';
import { processImage, processVideo } from '@/utils/processAssets';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef } from 'react';
import Toast from 'react-native-toast-message';
import { useNetworkListener } from './useNetworkListener';
import { useUploadQueue } from './useUploadQueue';

/* 
1. add the optimistic media to the upload queue
2. begin processing the media in the queue
3. handle network & failed upload errors by setting the optimistic media to error
4. if the error is a network error, use automatic retry with exponential backoff
5. if the error was an upload error, set the optimistic media to error and allow manual retry
6. if the upload is successful, set the optimistic media to success 

- i haven't gotten this far but when the upload is successful, will i be able to remove
  the optimsitc media and convex handle the data sync? will this lead to weird UI behavior?

*/

export const useMediaUpload = (albumId: Id<'albums'>, profileId: Id<'profiles'>) => {
    const { isConnected, isNetworkError, calcRetryDelay } = useNetworkListener();

    const storageRef = storage().ref(`albums/${albumId}`);

    const { queue, addMedia, updateMedia, removeMedia, getFailedUploads, resumeQueue, pauseQueue, isPaused } = useUploadQueue();

    // We can use a ref to track if a processing cycle is active, independent of the queue's length
    const isProcessingRef = useRef(false);
    const currentProcessingIndexRef = useRef(0); // to keep track of the current item being processed
    const timeoutIdsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});


    // effect to handle network changes and resume processing
    useEffect(() => {
        if (isConnected) {
            if (isPaused) resumeQueue();

            if (queue.length > 0 && !isProcessingRef.current) {
                console.log('Network restored, attepting to resume processing');
                processNextInQueue();
            }
        } else {
            console.warn('Network disconnected, pausing queue');
            pauseQueue();
        }
    }, [isConnected, isPaused, queue.length, pauseQueue, resumeQueue]);

    // 2. Upload Process
    // - processes the next item in the queue
    // - handles retry logic, exponential backoff, and network error handling
    // - updates UI with progress and status
    const processNextInQueue = useCallback(async () => {

        // prevent concurrent processing cycles
        if (isProcessingRef.current || isPaused) {
            console.warn('Processing already in progress or queue is paused, skipping');
            return;
        }

        const startIndex = currentProcessingIndexRef.current;
        const mediaToProcess = queue[startIndex]; // media to process

        // if no more items in the queue at the current index, stop processing
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
            attempt: number = 1
        ): Promise<void> => {

            // clear any existing timeout for this media item
            if (timeoutIdsRef.current[media._id]) {
                clearTimeout(timeoutIdsRef.current[media._id]);
                delete timeoutIdsRef.current[media._id];
            }


            try {

                // check connection before starting an upload attempt
                if (!isConnected) {
                    console.warn(`No internet connection, pausing ${media._id}`);
                    updateMedia(media._id, {
                        status: 'error',
                        error: 'No internet connection',
                    });

                    isProcessingRef.current = false;
                    return;
                }

                updateMedia(media._id, { status: 'uploading', progress: 0 });

                const onProgress = (progress: number) => {
                    updateMedia(media._id, { progress: Math.min(progress, 99) });
                }

                const onError = async (error: string) => {
                    console.error(`Upload error for ${media._id} (attempt ${attempt})`, error);

                    if (attempt < maxRetries && isNetworkError(error)) {
                        // exponential backoff: 2^attempt seconds
                        const delay = calcRetryDelay(attempt);

                        updateMedia(media._id, {
                            status: 'uploading',
                            error: `Retrying...`
                        });

                        console.log(`Retrying ${media._id} in ${delay} ms... (attempt: ${attempt}/${maxRetries})`);
                        timeoutIdsRef.current[media._id] = setTimeout(() => {
                            processWithRetry(media, attempt + 1);
                        }, delay);

                    } else {
                        updateMedia(media._id, {
                            status: 'error',
                            error: attempt >= maxRetries
                                ? `Failed after ${maxRetries} attempts: ${error}`
                                : error,
                        });

                        currentProcessingIndexRef.current++;
                        processNextInQueue();
                    }
                };

                const onSuccess = () => {
                    updateMedia(media._id, {
                        status: 'success',
                        progress: 100,
                    });

                    currentProcessingIndexRef.current++;
                    processNextInQueue();
                };

                if (media.type === 'video') {
                    await processVideo(media, storageRef, onProgress, onError, onSuccess);
                } else {
                    await processImage(media, storageRef, onProgress, onError, onSuccess);
                }
            } catch (e: any) {
                console.error(`Unexpected error processing ${media._id}:`, e);

                updateMedia(media._id, {
                    status: 'error',
                    error: e.message || 'Unknown error',
                });

                currentProcessingIndexRef.current++;
                processNextInQueue();
            }
        };

        await processWithRetry(mediaToProcess);
    }, [queue, storageRef, updateMedia, isConnected, isNetworkError, calcRetryDelay, isPaused]);


    const uploadAssets = useCallback(async (assets: ImagePicker.ImagePickerAsset[]) => {
        const newOptimisticMedia = createOptimisticMedia(assets, albumId, profileId);
        addMedia(newOptimisticMedia);

        Toast.show({
            type: 'info',
            text1: `Uploading ${newOptimisticMedia.length} file(s)`,
        });

        if (!isProcessingRef.current && !isPaused) {
            console.log('Starting upload cycle');

            currentProcessingIndexRef.current = 0;
            processNextInQueue();
        } else if (isProcessingRef.current) {
            console.log('Upload cycle already in progress, skipping new uploads');
        } else if (isPaused) {
            console.log('Queue is paused, new items added but won\'t be processed until resumed');
        }

    }, [createOptimisticMedia, addMedia, isPaused, processNextInQueue]);

    // cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            Object.values(timeoutIdsRef.current).forEach(clearTimeout);
        };
    }, []);

    return {
        optimisticMedia: queue,
        isProcessing: isProcessingRef.current,
        queueLength: queue.length,
        uploadAssets,
        getFailedUploads,
        resumeQueue,
    }
}