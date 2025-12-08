import { PendingMedia } from "@/src/hooks/useMedia";
import { formatVideoDuration } from "@/src/utils/formatters";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

interface PendingGalleryTileProps {
    pendingMedia: PendingMedia;
    itemSize: number;
}

export default function PendingGalleryTile({ pendingMedia, itemSize }: PendingGalleryTileProps) {
    const isVideo = pendingMedia.type === 'video';

    return (
        <Pressable
            disabled
            style={[styles.container, { width: itemSize, height: itemSize }]}
        >
            <Image
                source={{ uri: pendingMedia.uri }}
                placeholder={pendingMedia.uri}
                transition={200}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy={'memory-disk'}
            />

            {isVideo && pendingMedia.duration && (
                <View style={styles.playIconPosition}>
                    <Text style={styles.videoDurationText}>
                        {formatVideoDuration(pendingMedia.duration)}
                    </Text>
                </View>
            )}

            {/* Uploading Overlay */}
            <View style={styles.uploadingOverlay}>
                <View style={styles.uploadingIndicator}>
                    <ActivityIndicator size="small" color="white" />
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#EEEEEEFF",
        opacity: 0.8,
    },

    playIconPosition: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        alignItems: 'center',
        padding: 12,
    },

    videoDurationText: {
        color: "white",
        fontSize: 12,
        fontWeight: 'bold',
    },

    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },

    uploadingIndicator: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 20,
        padding: 12,
    },
});
