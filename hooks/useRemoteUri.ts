import { api } from "@/convex/_generated/api";
import { Media } from "@/types/Media";
import { useAction } from "convex/react";
import { Image } from "expo-image";

interface UseRemoteUriResult {
    fetchUri: ({ media, videoPlayback }: { media: Media, videoPlayback: boolean }) => Promise<string | undefined>;
}

export default function useRemoteUri(): UseRemoteUriResult {

    const requestImageURL = useAction(api.cloudflare.requestImageURL);
    const requestVideoThumbnailURL = useAction(api.cloudflare.requestVideoThumbnailURL);
    const requestVideoPlaybackURL = useAction(api.cloudflare.requestVideoPlaybackURL);

    const fetchUri = async ({ media, videoPlayback = false }: { media: Media, videoPlayback: boolean }): Promise<string | undefined> => {

        const type = media.identifier.type;
        const cloudflareId = type === 'video' ? media.identifier.videoUid : media.identifier.imageId;
        const albumId = media.albumId;

        let requestUrl: string | undefined;

        if (type === 'video' && videoPlayback) {
            return await requestVideoPlaybackURL({ albumId, videoUID: cloudflareId });
        }

        const localUri = await Image.getCachePathAsync(media._id);
        if (localUri) return localUri;

        if (type === 'image') {
            requestUrl = await requestImageURL({ albumId, imageId: cloudflareId });
        } else if (type === 'video') {
            requestUrl = await requestVideoThumbnailURL({ albumId, videoUID: cloudflareId });
        }

        return undefined;
    }

    return { fetchUri };
}