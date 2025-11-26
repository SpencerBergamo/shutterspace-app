import { Id } from "@/convex/_generated/dataModel";
import useSignedUrls from "@/hooks/useSignedUrls";
import { Media } from "@/types/Media";
import { Ionicons } from "@expo/vector-icons";
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
    const { requesting, thumbnail: uri } = useSignedUrls({ media });

    const mediaId = media._id;
    const type = media.identifier.type;
    const duration = type === 'video' ? media.identifier.duration : undefined;

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    if (media.status === 'error') {
        return (
            <TouchableOpacity style={{ width: itemSize, height: itemSize, marginBottom: 2, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="alert-circle-outline" size={24} color="red" />
            </TouchableOpacity>
        )
    }

    if (requesting) {
        return (
            <View style={{ width: itemSize, height: itemSize, marginBottom: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#DEDEDEFF" }}>
                <ActivityIndicator size="small" color="grey" />
            </View>
        )
    }

    return (
        <Pressable
            style={[styles.container, { width: itemSize, height: itemSize }]}
            onPress={() => onPress(mediaId)}
            onLongPress={() => onLongPress(mediaId)}
        >
            {uri ? (
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
            ) : (
                <Ionicons name="alert-circle-outline" size={24} color="red" />
            )}

            {uri && type === 'video' && (
                <View style={styles.playIconPosition}>
                    {duration ? (
                        <Text style={styles.videoDurationText}>{formatDuration(duration)}</Text>
                    ) : (
                        <Ionicons name="play-circle-outline" size={24} color="white" />
                    )}
                </View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#DEDEDEFF",
    },

    playIconPosition: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        alignItems: 'center',
        padding: 12,
    },

    videoDurationText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',

    }
})