import { Id } from "@/convex/_generated/dataModel";
import useRemoteUri from "@/hooks/useRemoteUri";
import { Media } from "@/types/Media";
import { Ionicons } from "@expo/vector-icons";
import { Image } from 'expo-image';
import { Play } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface MediaTileProps {
    media: Media;
    itemSize: number;
    onPress: (mediaId: Id<'media'>) => void;
    onLongPress: (mediaId: Id<'media'>) => void;
    onReady: (mediaId: Id<'media'>) => void;
    retry: (mediaId: Id<'media'>) => void;
    placeholderUri?: string;
}

export default function MediaTile({ media, itemSize, onPress, onLongPress, onReady, retry, placeholderUri }: MediaTileProps) {
    const { fetchUri } = useRemoteUri();

    const mediaId = media._id;
    const mediaStatus = media.status;
    const type = media.identifier.type;
    const [uri, setUri] = useState<string | undefined>();

    useEffect(() => {
        (async () => {
            const response = await fetchUri({ media, videoPlayback: false });
            setUri(response);
        })();
    }, [media, mediaStatus]);

    if (media.status === 'error') {
        return (
            <TouchableOpacity style={{ width: itemSize, height: itemSize, marginBottom: 2, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="alert-circle-outline" size={24} color="red" />
            </TouchableOpacity>
        )
    }

    return (
        <TouchableOpacity
            style={{ width: itemSize, height: itemSize, marginBottom: 2 }}
            onPress={() => onPress(mediaId)}
            onLongPress={() => onLongPress(mediaId)}
        >
            {!uri && placeholderUri && (
                <Image
                    source={{ uri: placeholderUri }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                />
            )}


            {uri && (
                <Image
                    source={{ uri, cacheKey: mediaId }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    cachePolicy={'memory-disk'}
                    onDisplay={() => {
                        onReady(mediaId);
                    }}
                    onError={(e) => {
                        console.error("Rendering tile failed: ", e);
                    }}
                />
            )}


            {uri && type === 'video' && (
                <View style={styles.playIconPosition}>
                    <Play size={24} color="white" />
                </View>
            )}
        </TouchableOpacity>
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