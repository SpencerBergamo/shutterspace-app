import { api } from "@/convex/_generated/api";
import { Media } from "@/types/Media";
import { useAction } from "convex/react";
import { Image } from "expo-image";
import { useEffect, useState } from "react";


interface UseSignedUrlsProps {
    media: Media | undefined;
    videoPlayback?: boolean;
}

export default function useSignedUrls({ media, videoPlayback = false }: UseSignedUrlsProps) {
    const requestImageURL = useAction(api.cloudflare.requestImageURL);
    const requestVideoThumbnailURL = useAction(api.cloudflare.requestVideoThumbnailURL);
    const requestVideoPlaybackURL = useAction(api.cloudflare.requestVideoPlaybackURL);

    const [url, setUrl] = useState<string | undefined>();

    useEffect(() => {
        (async () => {
            if (!media) return;

            const type = media.identifier.type;
            const cloudflareId = type === 'video' ? media.identifier.videoUid : media.identifier.imageId;
            const albumId = media.albumId;

            if (type === 'video' && videoPlayback) {
                const response = await requestVideoPlaybackURL({ albumId, videoUID: cloudflareId });
                setUrl(response);
            }

            const localUri = await Image.getCachePathAsync(media._id);
            if (localUri) {
                setUrl(localUri);
                return;
            };

            let requestUrl: string | undefined;
            if (type === 'image') {
                requestUrl = await requestImageURL({ albumId, imageId: cloudflareId });
            } else if (type === 'video') {
                requestUrl = await requestVideoThumbnailURL({ albumId, videoUID: cloudflareId });
            }

            setUrl(requestUrl);


        })();
    }, [media, videoPlayback]);


    return url;
}