import { api } from "@shutterspace/backend/convex/_generated/api";
import { Media } from "@shutterspace/backend/types/Media";
import { useAction } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ensureDeliveryUrl,
    getDeliveryUrlSync,
    invalidateDeliveryEntry,
    mediaThumbnailKey,
    peekDeliveryEntry,
    setDeliveryEntry,
    videoPlaybackKey,
    type DeliveryEntry,
} from "../lib/mediaDeliveryCache";

interface UseMediaDeliveryProps {
    media: Media | undefined;
}

interface UseMediaDeliveryResult {
    requesting: boolean;
    thumbnail: string | undefined | null;
    handleImageError: () => Promise<void>;
    requestingVideo: boolean;
    requestVideo: () => Promise<string | undefined>;
}

const DEFAULT_TTL_MS = 55 * 60 * 1000;

/**
 * Resolve a signed gallery thumbnail / video playback URL with warm cache.
 * Prefer batch hydration from AlbumGalleryProvider; this hook fills gaps.
 */
export default function useMediaDelivery({
    media,
}: UseMediaDeliveryProps): UseMediaDeliveryResult {
    const getVideoPlaybackURL = useAction(api.cloudflare.getVideoPlaybackURL);
    const getMediaDeliveryUrls = useAction(api.mediaDelivery.getMediaDeliveryUrls);

    const mediaId = media?._id;
    const albumId = media?.albumId;
    const cacheKey = mediaId ? mediaThumbnailKey(mediaId) : undefined;
    const syncUrl = cacheKey
        ? getDeliveryUrlSync(cacheKey, "media_thumbnail")
        : undefined;

    const [thumbnail, setThumbnail] = useState<string | undefined | null>(syncUrl);
    const [requesting, setRequesting] = useState(syncUrl === undefined && !!media);
    const [requestingVideo, setRequestingVideo] = useState(false);
    const generationRef = useRef(0);

    useEffect(() => {
        generationRef.current += 1;
        const generation = generationRef.current;

        if (!media || !mediaId || !albumId || !cacheKey) {
            setThumbnail(undefined);
            setRequesting(false);
            return;
        }

        if (media.status !== "ready") {
            setThumbnail(undefined);
            setRequesting(false);
            return;
        }

        const existing = getDeliveryUrlSync(cacheKey, "media_thumbnail");
        if (existing) {
            setThumbnail(existing);
            setRequesting(false);
        } else {
            setRequesting(true);
        }

        let cancelled = false;

        (async () => {
            const entry = await ensureDeliveryUrl(
                cacheKey,
                "media_thumbnail",
                async (): Promise<DeliveryEntry | null> => {
                    const results = await getMediaDeliveryUrls({
                        albumId,
                        mediaIds: [mediaId],
                    });
                    const first = results[0];
                    if (!first) return null;
                    return { url: first.url, expiresAt: first.expiresAt };
                },
            );

            if (cancelled || generation !== generationRef.current) return;

            if (entry) {
                setThumbnail(entry.url);
            } else if (!existing) {
                setThumbnail(null);
            }
            setRequesting(false);
        })().catch((e) => {
            console.error("Error resolving media delivery URL:", e);
            if (!cancelled && generation === generationRef.current) {
                setThumbnail(existing ?? null);
                setRequesting(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [media, mediaId, albumId, cacheKey, getMediaDeliveryUrls]);

    const handleImageError = useCallback(async () => {
        if (!media || !mediaId || !albumId || !cacheKey) return;

        invalidateDeliveryEntry(cacheKey, "media_thumbnail");
        setRequesting(true);

        try {
            const results = await getMediaDeliveryUrls({
                albumId,
                mediaIds: [mediaId],
            });
            const first = results[0];
            if (!first) {
                setThumbnail(null);
                return;
            }
            setDeliveryEntry(cacheKey, "media_thumbnail", first.url, first.expiresAt);
            setThumbnail(first.url);
        } catch (e) {
            console.error("Error refreshing media delivery URL:", e);
            setThumbnail(null);
        } finally {
            setRequesting(false);
        }
    }, [media, mediaId, albumId, cacheKey, getMediaDeliveryUrls]);

    const requestVideo = useCallback(async (): Promise<string | undefined> => {
        if (!media || media.identifier.type !== "video") return undefined;

        const key = videoPlaybackKey(media._id);
        setRequestingVideo(true);

        try {
            const entry = await ensureDeliveryUrl(
                key,
                "video_playback",
                async () => {
                    const url = await getVideoPlaybackURL({
                        albumId: media.albumId,
                        videoUID: media.identifier.type === "video"
                            ? media.identifier.videoUid
                            : "",
                    });
                    if (!url) return null;
                    return {
                        url,
                        expiresAt: Date.now() + DEFAULT_TTL_MS,
                    };
                },
            );
            return entry?.url;
        } catch (e) {
            console.error("Error requesting video playback:", e);
            return undefined;
        } finally {
            setRequestingVideo(false);
        }
    }, [media, getVideoPlaybackURL]);

    // Keep displayed URL if we already have a stale entry while refreshing.
    const displayThumbnail =
        thumbnail ??
        (cacheKey ? peekDeliveryEntry(cacheKey, "media_thumbnail")?.url : undefined);

    return {
        requesting,
        thumbnail: displayThumbnail === undefined ? thumbnail : displayThumbnail,
        handleImageError,
        requestingVideo,
        requestVideo,
    };
}
