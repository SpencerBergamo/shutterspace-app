import { api } from "@/convex/_generated/api";
import { Media } from "@/types/Media";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAction } from "convex/react";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";

interface VideoCache {
    url: string;
    videoUID: string;
    expiresAt: number;
}

interface UseSignedUrlsProps {
    media: Media | undefined;
}

interface UseSignedUrlsResult {
    requesting: boolean;
    thumbnail: string | undefined | null;
    handleImageError: () => Promise<void>;
    requestingVideo: boolean;
    requestVideo: () => Promise<string | undefined>;
}

export default function useSignedUrls({ media }: UseSignedUrlsProps): UseSignedUrlsResult {
    const getImageURL = useAction(api.r2.getImageURL);
    const getVideoThumbnailURL = useAction(api.cloudflare.getVideoThumbnailURL);
    const getVideoPlaybackURL = useAction(api.cloudflare.getVideoPlaybackURL);

    const [requesting, setRequesting] = useState<boolean>(true);
    const [requestingVideo, setRequestingVideo] = useState<boolean>(false);
    const [thumbnail, setThumbnail] = useState<string | undefined | null>(undefined);

    const requestVideo = useCallback(async (): Promise<string | undefined> => {
        try {
            if (!media) return;
            const type = media.identifier.type;
            const cloudflareId = type === 'video' ? media.identifier.videoUid : media.identifier.imageId;
            const albumId = media.albumId;
            if (type !== 'video') return;

            setRequestingVideo(true);

            const cached = await AsyncStorage.getItem(media._id.toString());
            if (cached) {
                const entity = JSON.parse(cached) as VideoCache;
                if (entity && entity.expiresAt > Date.now()) return entity.url;
            }

            const url = await getVideoPlaybackURL({ albumId, videoUID: cloudflareId });
            if (url) {
                const newEntity: VideoCache = {
                    url,
                    videoUID: cloudflareId,
                    expiresAt: Date.now() + 1000 * 60 * 60, // 1 hour
                }

                // replace existing item in cache with new one
                await AsyncStorage.setItem(media._id.toString(), JSON.stringify(newEntity));
                setRequestingVideo(false);
                return url;
            }

            return undefined;
        } catch (e) {
            console.error('Error requesting video playback: ', e);
            return undefined;
        } finally {
            setRequestingVideo(false);
        }
    }, [media, getVideoPlaybackURL]);

    const handleImageError = useCallback(async () => {
        setRequesting(true);

        try {
            throw new Error("Not implemented");
        } catch (e) {
            console.error("Error handling image error: ", e);
            setThumbnail(null);
        } finally {
            setRequesting(false);
        }
    }, [media]);

    useEffect(() => {
        (async () => {
            if (!media) {
                setRequesting(false);
                return;
            }
            const type = media.identifier.type;
            const cloudflareId = type === 'video' ? media.identifier.videoUid : media.identifier.imageId;
            const albumId = media.albumId;

            setRequesting(true);

            try {
                const localUri = await Image.getCachePathAsync(media._id);
                if (localUri) {
                    setThumbnail(localUri);
                    setRequesting(false);
                    return;
                };

                let requestUrl: string | undefined | null;
                if (type === 'image') {
                    requestUrl = await getImageURL({ albumId, imageId: cloudflareId });
                } else if (type === 'video') {
                    requestUrl = await getVideoThumbnailURL({ albumId, videoUID: cloudflareId });
                } else {
                    setRequesting(false);
                    setThumbnail(null);
                    return;
                }

                setThumbnail(requestUrl);
            } catch (e) {
                console.error('Error requesting thumbnail: ', e);
                setThumbnail(null);
            } finally {
                setRequesting(false);
            }
        })();
    }, [media, getImageURL, getVideoThumbnailURL]);


    return { requesting, thumbnail, handleImageError, requestingVideo, requestVideo };
}