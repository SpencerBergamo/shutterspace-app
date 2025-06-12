import { DbMedia, Media, OptimisticMedia } from "@/types/Media";
import { formatDuration } from "@/utils/mediaFactory";
import { Image } from 'expo-image';
import { Play } from "lucide-react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

interface MediaTileProps {
    media: Media;
    onPress?: (media: Media) => void;
    onRetry?: (media: OptimisticMedia) => void;
    size: number;
}

export function MediaTile({ media, size, onPress, onRetry }: MediaTileProps) {
    const isOptimistic = 'status' in media;
    const isVideo = media.type === 'video';

    if (isOptimistic) {
        const optimisticItem = media as OptimisticMedia;

        switch (optimisticItem.status) {
            case 'pending':
            case 'uploading':
                return (
                    <View style={styles.progressOverlay}>
                        <ActivityIndicator size="small" color="#ffffff" />
                    </View>
                );

            case 'error':
                if (optimisticItem.error === 'network') {

                }
        }
    }



    const dbItem = media as DbMedia;
    return (
        <Pressable
            style={[styles.container, { width: size, height: size }]}
            onPress={() => onPress?.(dbItem)}>
            <Image
                source={{ uri: dbItem.thumbnailUrl }}
                style={styles.image}
                contentFit="cover"
            />
            {isVideo && (
                <View style={styles.videoIndicator}>
                    {dbItem.duration ? (
                        <Text>{formatDuration(dbItem.duration)}</Text>
                    ) : (
                        <Play size={24} color="white" />
                    )}
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {},
    videoIndicator: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 4,
        borderRadius: 4,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
    },
    duration: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
    },
    progressOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        color: '#ffffff',
        marginTop: 4,
    },
    errorOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

})