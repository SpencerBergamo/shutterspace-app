import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import { useEffect, useState } from "react";

interface UseAlbumCoverResult {
    requesting: boolean;
    coverUrl: string | undefined | null;
    mediaId: Id<'media'> | undefined | null;
}

const coverUrlCache = new Map<string, string | null>();

function getCacheKey(albumId: Id<'albums'>, mediaId: Id<'media'> | undefined) {
    return mediaId ? `${albumId}:${mediaId}` : albumId;
}

export default function useAlbumCover(albumId: Id<'albums'>): UseAlbumCoverResult {
    const lastMedia = useQuery(api.media.getLastMedia, { albumId });
    const getAlbumCover = useAction(api.albums.getAlbumCover);

    const cacheKey = getCacheKey(albumId, lastMedia?._id);
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
                if (!lastMedia) {
                    if (!cancelled) {
                        coverUrlCache.set(cacheKey, null);
                        setCoverUrl(null);
                    }
                    return;
                }

                const url = await getAlbumCover({
                    albumId,
                    identifier: lastMedia.identifier,
                });

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
    }, [albumId, lastMedia, cacheKey, cachedUrl, getAlbumCover]);

    return { requesting, coverUrl, mediaId: lastMedia?._id };
}
