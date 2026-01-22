import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UploadStatus = "uploading" | "error" | "success";

export type PendingUpload = {
    assetId: string;
    albumId: Id<'albums'>;
    uri: string;
    filename: string;
    type: 'image' | 'video';
    width: number;
    height: number;
    duration?: number;
    timestamp: number;
    status: UploadStatus;
    error?: string;
    retryCount: number;
}

interface MediaStore {
    // normalized media data - keyed by assetId for O(1) access
    pendingUploads: Record<string, PendingUpload>; // assetId -> PendingUpload

    // Actions
    addPendingUpload: (pending: PendingUpload[]) => void;
    updatePendingUpload: (
        assetId: string,
        status: UploadStatus
    ) => void;
    removePendingMedia: (assetId: string) => void;
    clearFailedUploads: () => void;

    // Selectors
    getPendingMediaForAlbum: (albumId: Id<'albums'>) => PendingUpload[];
    getFailedUploads: () => PendingUpload[];
}

export const useMediaStore = create<MediaStore>()(
    persist((set, get) => ({
        pendingUploads: {},
        uploadProgress: {},

        addPendingUpload: (pending) =>
            set((state) => {
                const newUploads = { ...state.pendingUploads };
                pending.forEach(p => {
                    newUploads[p.assetId] = p;
                });
                return { pendingUploads: newUploads };
            }),

        updatePendingUpload: (assetId, status) =>
            set((state) => {
                const upload = state.pendingUploads[assetId];
                if (!upload) return state;

                return {
                    pendingUploads: {
                        ...state.pendingUploads,
                        [assetId]: {
                            ...upload,
                            status,
                            retryCount: status === 'error' ? upload.retryCount + 1 : upload.retryCount,
                        }
                    }
                };
            }),

        removePendingMedia: (assetId) =>
            set((state) => {
                const { [assetId]: __, ...remainingUploads } = state.pendingUploads;
                return {
                    pendingUploads: remainingUploads,
                };
            }),

        clearFailedUploads: () =>
            set((state) => {
                const newUploads: Record<string, PendingUpload> = {};

                Object.entries(state.pendingUploads).forEach(([assetId, upload]) => {
                    if (upload.status !== 'error') {
                        newUploads[assetId] = upload;
                    }
                });

                return {
                    pendingUploads: newUploads,
                };
            }),

        getPendingMediaForAlbum: (albumId) =>
            Object.values(get().pendingUploads).filter(p => p.albumId === albumId),

        getFailedUploads: () =>
            Object.values(get().pendingUploads).filter(p => p.status === 'error'),

    }), {
        name: 'media-store',
        storage: createJSONStorage(() => AsyncStorage)
    }
    )
);