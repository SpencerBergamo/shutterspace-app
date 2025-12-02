import { api } from "@/convex/_generated/api";
import { MediaIdentifier } from "@/types/Media";
import { useAction } from "convex/react";
import { useEffect, useState } from "react";

interface UseAlbumCoverResult {
    requesting: boolean;
    coverUrl: string | undefined | null;
}

export default function useAlbumCover(identifier: MediaIdentifier): UseAlbumCoverResult {
    const requestCover = useAction(api.cloudflare.requestAlbumCoverURL);

    const [requesting, setRequesting] = useState(true);
    const [coverUrl, setCoverUrl] = useState<string | undefined | null>(undefined);

    useEffect(() => {
        (async () => {
            setRequesting(true);

            try {
                const url = await requestCover({ identifier });
                setCoverUrl(url);
            } catch (e) {
                console.error('Error requesting album cover: ', e);
                setCoverUrl(null);
            } finally {
                setRequesting(false);
            }
        })();
    }, [identifier]);

    return {
        requesting,
        coverUrl,
    }
}