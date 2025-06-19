import { DbMedia, Media, OptimisticMedia } from "@/types/Media";
import { formatDuration } from "@/utils/mediaFactory";
import { Image } from "expo-image";
import { Play } from "lucide-react-native";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";


interface ThumbnailProps {
    media: Media;
    size: number;
}

export default function Thumbnail({ media, size }: ThumbnailProps) {
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

    const dbMedia = media as DbMedia;
    return (
        <View style={{ flex: 1, width: size, height: size }}>
            <Image
                source={{ uri: dbMedia.thumbnailUrl }}
                style={styles.image}
                contentFit="cover" />

            {isVideo && (
                <View style={styles.videoIndicator}>
                    {dbMedia.duration ? (
                        <Text>{formatDuration(dbMedia.duration)}</Text>
                    ) : (
                        <Play size={24} color="white" />
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    videoIndicator: {},
    image: {},
    duration: {},
    progressOverlay: {},
    progressText: {},
    errorOverlay: {},
})