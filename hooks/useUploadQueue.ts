import { OptimisticMedia } from "@/types/Media";
import { useCallback, useState } from "react";

export const useUploadQueue = () => {
    const [queue, setQueue] = useState<OptimisticMedia[]>([]);
    const [isPaused, setIsPaused] = useState(false);

    const addMedia = useCallback((media: OptimisticMedia[]) => {
        setQueue(prev => [...prev, ...media]);
    }, []);

    const removeMedia = useCallback((mediaId: string) => {
        setQueue(prev => prev.filter(media => media._id !== mediaId));
    }, []);

    const updateMedia = useCallback((
        mediaId: string,
        updates: Partial<OptimisticMedia>
    ) => {
        setQueue(prev => prev.map(media =>
            media._id === mediaId ? { ...media, ...updates } : media));
    }, []);

    const getFailedUploads = useCallback(() => {
        return queue.filter(media => media.status === 'error');
    }, [queue]);

    const resetQueue = useCallback(() => {
        setQueue([]);
    }, []);

    const pauseQueue = useCallback(() => {
        setIsPaused(true);
    }, []);

    const resumeQueue = useCallback(() => {
        setIsPaused(false);
    }, []);

    return {
        queue,
        addMedia,
        updateMedia,
        removeMedia,
        getFailedUploads,
        resetQueue,
        pauseQueue,
        isPaused,
        resumeQueue,
    };
}