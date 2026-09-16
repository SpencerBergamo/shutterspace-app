import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { AlbumCover } from "@shutterspace/backend/types/Album";
import { useAction } from "convex/react";
import { useEffect, useState } from "react";
import {
    albumCoverCacheKey,
    ensureDeliveryUrl,
    getDeliveryUrlSync,
    type DeliveryEntry,
} from "../lib/mediaDeliveryCache";

interface UseAlbumCoverResult {
    requesting: boolean;
    coverUrl: string | undefined | null;
    /** Gallery media id when the cover is backed by (or linked to) a media row. */
    mediaId: Id<"media"> | undefined | null;
    cacheKey: string | undefined;
}

function coverIdentity(cover: AlbumCover | undefined | null): string | undefined {
    if (!cover) return undefined;
    if (cover.type === "image") {
        return cover.mediaId ? `${cover.imageId}:${cover.mediaId}` : cover.imageId;
    }
    return cover.mediaId ? `${cover.videoUid}:${cover.mediaId}` : cover.videoUid;
}

interface UseAlbumCoverOptions {
    cover?: AlbumCover | null;
}

const DEFAULT_TTL_MS = 55 * 60 * 1000;

/**
 * Resolve a signed cover URL from denormalized `album.cover`.
 * Covers are public — no auth or invite code required.
 * Prefer passing `cover` from the parent albums query so list cells stay query-free.
 */
export default function useAlbumCover(
    albumId: Id<"albums">,
    options: UseAlbumCoverOptions = {},
): UseAlbumCoverResult {
    const { cover } = options;
    const getAlbumCoverUrl = useAction(api.albums.getAlbumCoverUrl);

    const identity = coverIdentity(cover);
    const cacheKey = identity
        ? albumCoverCacheKey(albumId, identity)
        : albumCoverCacheKey(albumId, "empty");

    const syncUrl = identity
        ? getDeliveryUrlSync(cacheKey, "album_cover")
        : undefined;

    const [requesting, setRequesting] = useState(
        identity !== undefined && syncUrl === undefined,
    );
    const [coverUrl, setCoverUrl] = useState<string | undefined | null>(
        identity ? syncUrl : null,
    );

    useEffect(() => {
        if (!identity) {
            setCoverUrl(null);
            setRequesting(false);
            return;
        }

        const existing = getDeliveryUrlSync(cacheKey, "album_cover");
        if (existing) {
            setCoverUrl(existing);
            setRequesting(false);
        } else {
            setRequesting(true);
        }

        let cancelled = false;

        (async () => {
            const entry = await ensureDeliveryUrl(
                cacheKey,
                "album_cover",
                async (): Promise<DeliveryEntry | null> => {
                    const url = await getAlbumCoverUrl({ albumId });
                    if (!url) return null;
                    return {
                        url,
                        expiresAt: Date.now() + DEFAULT_TTL_MS,
                    };
                },
            );

            if (cancelled) return;

            if (entry) {
                setCoverUrl(entry.url);
            } else if (!existing) {
                setCoverUrl(null);
            }
            setRequesting(false);
        })().catch((e) => {
            console.error("Failed to get album cover: ", e);
            if (!cancelled) {
                setCoverUrl(existing ?? null);
                setRequesting(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [albumId, identity, cacheKey, getAlbumCoverUrl]);

    return {
        requesting,
        coverUrl,
        mediaId: cover?.mediaId,
        cacheKey: identity,
    };
}
