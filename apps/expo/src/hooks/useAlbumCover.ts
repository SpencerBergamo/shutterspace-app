import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { AlbumCover } from "@shutterspace/backend/types/Album";
import { useAction } from "convex/react";
import { useEffect, useState } from "react";

interface UseAlbumCoverResult {
    requesting: boolean;
    coverUrl: string | undefined | null;
    /** Gallery media id when the cover is backed by (or linked to) a media row. */
    mediaId: Id<'media'> | undefined | null;
    cacheKey: string | undefined;
}

const coverUrlCache = new Map<string, string | null>();

function coverIdentity(cover: AlbumCover | undefined | null): string | undefined {
    if (!cover) return undefined;
    if (cover.type === 'image') {
        return cover.mediaId ? `${cover.imageId}:${cover.mediaId}` : cover.imageId;
    }
    return cover.mediaId ? `${cover.videoUid}:${cover.mediaId}` : cover.videoUid;
}

function getCacheKey(albumId: Id<'albums'>, cover: AlbumCover | undefined | null) {
    const identity = coverIdentity(cover);
    return identity ? `${albumId}:${identity}` : `${albumId}:empty`;
}

interface UseAlbumCoverOptions {
    cover?: AlbumCover | null;
}

/**
 * Resolve a signed cover URL from denormalized `album.cover`.
 * Covers are public — no auth or invite code required.
 * Prefer passing `cover` from the parent albums query so list cells stay query-free.
 */
export default function useAlbumCover(
    albumId: Id<'albums'>,
    options: UseAlbumCoverOptions = {},
): UseAlbumCoverResult {
    const { cover } = options;
    const getAlbumCoverUrl = useAction(api.albums.getAlbumCoverUrl);

    const cacheKey = getCacheKey(albumId, cover);
    const cachedUrl = coverUrlCache.get(cacheKey);

    const [requesting, setRequesting] = useState(cachedUrl === undefined);
    const [coverUrl, setCoverUrl] = useState<string | undefined | null>(cachedUrl);

    useEffect(() => {
        if (cachedUrl !== undefined) {
            setCoverUrl(cachedUrl);
            setRequesting(false);
            return;
        }

        let cancelled = false;

        (async () => {
            setRequesting(true);
            try {
                if (!cover) {
                    if (!cancelled) {
                        coverUrlCache.set(cacheKey, null);
                        setCoverUrl(null);
                    }
                    return;
                }

                const url = await getAlbumCoverUrl({ albumId });

                if (!cancelled) {
                    coverUrlCache.set(cacheKey, url);
                    setCoverUrl(url);
                }
            } catch (e) {
                console.error("Failed to get album cover: ", e);
                if (!cancelled) {
                    coverUrlCache.set(cacheKey, null);
                    setCoverUrl(null);
                }
            } finally {
                if (!cancelled) {
                    setRequesting(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [albumId, cover, cacheKey, cachedUrl, getAlbumCoverUrl]);

    return {
        requesting,
        coverUrl,
        mediaId: cover?.mediaId,
        cacheKey: coverIdentity(cover),
    };
}
