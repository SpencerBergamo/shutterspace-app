import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Media } from "@/types/Media";
import { useAction } from "convex/react";
import { Image } from 'expo-image';
import { CloudAlert, Play } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

interface MediaTileProps {
    media: Media;
    onPress: (mediaId: Id<'media'>) => void;
    onLongPress: (mediaId: Id<'media'>) => void;
    onReady: (mediaId: Id<'media'>) => void;
    onError: (mediaId: Id<'media'>) => void;
    inFlightURI?: string;
}

type ImageStatus = 'loading' | 'ready' | 'error';

export default function MediaTile({ media, onPress, onLongPress, onReady, onError, inFlightURI }: MediaTileProps) {
    const { profileId } = useProfile();
    const requestImageURL = useAction(api.cloudflare.requestImageURL);
    const requestVideoThumbnailURL = useAction(api.cloudflare.requestVideoThumbnailURL);

    const mediaId = media._id;
    const mediaStatus = media.status;
    const type = media.identifier.type;
    const [renderState, setRenderState] = useState<ImageStatus>('loading');
    const [uri, setUri] = useState<string | undefined>(inFlightURI);

    useEffect(() => {
        (async () => {
            switch (mediaStatus) {
                case 'error':
                    setRenderState('error');
                    break;

                case 'ready':
                    try {
                        const localUri = await Image.getCachePathAsync(mediaId);
                        if (localUri) {
                            setUri(localUri);
                            setRenderState('ready');
                            return;
                        }

                        const cloudflareId = type === 'video' ? media.identifier.videoUid : media.identifier.imageId;
                        const albumId = media.albumId;
                        let requestUrl: string | undefined;

                        if (type === 'image') {
                            requestUrl = await requestImageURL({ albumId, profileId, imageId: cloudflareId });
                        } else if (type === 'video') {
                            requestUrl = await requestVideoThumbnailURL({ albumId, profileId, videoUID: cloudflareId });
                        }

                        setUri(requestUrl);
                    } catch (e) {
                        setRenderState('error');
                        onError(mediaId);
                    }
                default: return;
            }
        })();

    }, [media, mediaStatus]);

    return (
        <Pressable style={styles.container} onPress={() => onPress(mediaId)} onLongPress={() => onLongPress(mediaId)}>
            <Image
                key={mediaId}
                source={{ uri, cacheKey: mediaId }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy={'memory-disk'}
                placeholder={inFlightURI}
                onDisplay={() => {
                    setRenderState('ready');
                    onReady(mediaId);
                }}
                onError={() => {
                    onError(mediaId);
                }}
            />

            {type === 'video' && (
                <View style={styles.playIconPosition}>
                    <Play size={24} color="white" />
                </View>
            )}

            {renderState === 'loading' && (
                <ActivityIndicator size="small" color="white" />
            )}

            {renderState === 'error' && (
                <CloudAlert size={24} color="red" />
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 4,
    },

    playIconPosition: {
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: 12,
    }
})