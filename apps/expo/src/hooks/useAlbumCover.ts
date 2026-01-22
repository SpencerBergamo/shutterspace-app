import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import { useEffect, useState } from "react";

interface UseAlbumCoverResult {
    requesting: boolean;
    coverUrl: string | undefined | null;
    mediaId: Id<'media'> | undefined | null;
}

export default function useAlbumCover(albumId: Id<'albums'>): UseAlbumCoverResult {
    const lastMedia = useQuery(api.media.getLastMedia, { albumId });
    const getAlbumCover = useAction(api.albums.getAlbumCover);

    const [requesting, setRequesting] = useState(true);
    const [coverUrl, setCoverUrl] = useState<string | undefined | null>(undefined);

    useEffect(() => {
        (async () => {
            try {
                if (!lastMedia) {
                    setCoverUrl(null);
                    setRequesting(false);
                    return;
                }

                const url = await getAlbumCover({ albumId, identifier: lastMedia.identifier });
                setCoverUrl(url);
            } catch (e) {
                console.error("Failed to get album cover: ", e);
                setCoverUrl(null);
            } finally {
                setRequesting(false);
            }
        })();
    }, [albumId, lastMedia]);

    return { requesting, coverUrl, mediaId: lastMedia?._id };
}