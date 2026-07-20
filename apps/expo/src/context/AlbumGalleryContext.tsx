import { useAlbumMedia, type AlbumMediaStatus } from "@/src/hooks/useAlbumMedia";
import { getAlbumSnapshot, rememberAlbum } from "@/src/lib/albumSnapshotCache";
import {
    applyDeliveryBatch,
    getDeliveryUrlSync,
    mediaThumbnailKey,
    peekDeliveryEntry,
} from "@/src/lib/mediaDeliveryCache";
import { PendingUpload, useMediaStore } from "@/src/store/useMediaStore";
import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { Album } from "@shutterspace/backend/types/Album";
import { Media } from "@shutterspace/backend/types/Media";
import { useAction, useQuery } from "convex/react";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    type ReactNode,
} from "react";

interface AlbumGalleryContextValue {
    albumId: Id<"albums">;
    /** Live query result, or last-known snapshot while Convex reconnects. */
    album: Album | null | undefined;
    media: Media[];
    pendingMedia: PendingUpload[];
    status: AlbumMediaStatus;
    loadMore: () => void;
    /** True only on cold first load with no snapshot. */
    isLoading: boolean;
    prefetchDelivery: (mediaIds?: Id<"media">[]) => Promise<void>;
}

const AlbumGalleryContext = createContext<AlbumGalleryContextValue | null>(null);

interface AlbumGalleryProviderProps {
    albumId: Id<"albums">;
    children: ReactNode;
}

const SAFETY_MARGIN_MS = 5 * 60 * 1000;

function needsDeliveryRefresh(mediaId: Id<"media">): boolean {
    const key = mediaThumbnailKey(mediaId);
    const sync = getDeliveryUrlSync(key, "media_thumbnail");
    if (!sync) return true;
    const entry = peekDeliveryEntry(key, "media_thumbnail");
    if (!entry) return true;
    return entry.expiresAt - SAFETY_MARGIN_MS <= Date.now();
}

/**
 * Shared realtime album media subscription for grid + viewer.
 * Also batch-hydrates signed delivery URLs for each loaded page.
 */
export function AlbumGalleryProvider({
    albumId,
    children,
}: AlbumGalleryProviderProps) {
    const liveAlbum = useQuery(api.albums.queryAlbum, { albumId });
    const { media, status, loadMore, isLoading: mediaLoading } = useAlbumMedia(albumId);
    const getMediaDeliveryUrls = useAction(api.mediaDelivery.getMediaDeliveryUrls);

    const pendingUploads = useMediaStore((state) => state.pendingUploads);
    const emptyPending = useRef<PendingUpload[]>([]).current;
    const pendingMedia = useMemo(() => {
        const uploads = Object.values(pendingUploads).filter(
            (p) => p.albumId === albumId,
        );
        return uploads.length > 0 ? uploads : emptyPending;
    }, [pendingUploads, albumId, emptyPending]);

    useEffect(() => {
        if (liveAlbum) rememberAlbum(liveAlbum);
    }, [liveAlbum]);

    const snapshot = getAlbumSnapshot(albumId);
    const album: Album | null | undefined =
        liveAlbum === undefined ? snapshot : liveAlbum;

    const hydratedChunksRef = useRef<Set<string>>(new Set());

    const prefetchDelivery = useCallback(
        async (mediaIds?: Id<"media">[]) => {
            const ids =
                mediaIds ??
                media.filter((m) => m.status === "ready").map((m) => m._id);

            const toFetch = ids.filter(needsDeliveryRefresh);
            if (toFetch.length === 0) return;

            const chunkSize = 60;
            for (let i = 0; i < toFetch.length; i += chunkSize) {
                const chunk = toFetch.slice(i, i + chunkSize);
                const pageKey = chunk.map(String).sort().join(",");
                if (hydratedChunksRef.current.has(pageKey)) continue;

                try {
                    const results = await getMediaDeliveryUrls({
                        albumId,
                        mediaIds: chunk,
                    });
                    applyDeliveryBatch(
                        results.map((entry) => ({
                            key: mediaThumbnailKey(entry.mediaId),
                            purpose: "media_thumbnail" as const,
                            url: entry.url,
                            expiresAt: entry.expiresAt,
                            imageCacheKey: String(entry.mediaId),
                        })),
                    );
                    hydratedChunksRef.current.add(pageKey);
                } catch (e) {
                    console.error("Failed to batch-sign media delivery URLs:", e);
                }
            }
        },
        [albumId, media, getMediaDeliveryUrls],
    );

    useEffect(() => {
        if (media.length === 0) return;
        void prefetchDelivery();
    }, [media, prefetchDelivery]);

    const isLoading =
        liveAlbum === undefined && !snapshot && mediaLoading && media.length === 0;

    const value = useMemo<AlbumGalleryContextValue>(
        () => ({
            albumId,
            album,
            media,
            pendingMedia,
            status,
            loadMore,
            isLoading,
            prefetchDelivery,
        }),
        [
            albumId,
            album,
            media,
            pendingMedia,
            status,
            loadMore,
            isLoading,
            prefetchDelivery,
        ],
    );

    return (
        <AlbumGalleryContext.Provider value={value}>
            {children}
        </AlbumGalleryContext.Provider>
    );
}

export function useAlbumGallery(): AlbumGalleryContextValue {
    const ctx = useContext(AlbumGalleryContext);
    if (!ctx) {
        throw new Error("useAlbumGallery must be used within AlbumGalleryProvider");
    }
    return ctx;
}

export function useAlbumGalleryOptional(): AlbumGalleryContextValue | null {
    return useContext(AlbumGalleryContext);
}
