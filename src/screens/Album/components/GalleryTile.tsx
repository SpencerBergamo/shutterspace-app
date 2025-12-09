import { Id } from "@/convex/_generated/dataModel";
import { useProfile } from "@/src/context/ProfileContext";
import useSignedUrls from "@/src/hooks/useSignedUrls";
import { Media } from "@/src/types/Media";
import { formatVideoDuration } from "@/src/utils/formatters";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

interface GalleryTileProps {
    media: Media;
    itemSize: number;
    onPress: (mediaId: Id<'media'>) => void;
    onLongPress: (mediaId: Id<'media'>) => void;
    onRetry: (mediaId: Id<'media'>) => void;
    onReady: (mediaId: Id<'media'>) => void;
    selectionMode?: boolean;
    isSelected?: boolean;
}

export default function GalleryTile({ media, itemSize, onPress, onLongPress, onRetry, onReady, selectionMode = false, isSelected = false }: GalleryTileProps) {
    const { profileId } = useProfile();
    const { requesting, thumbnail } = useSignedUrls({ media });

    const mediaId = media._id;
    const type = media.identifier.type;
    const isVideo = type === 'video';
    const duration = type === 'video' ? media.identifier.duration : null;
    const isOwner = profileId === media.createdBy;

    if (media.status === 'error') {
        return (
            <Pressable
                disabled={!isOwner}
                onPress={() => onRetry(mediaId)}
                style={{
                    marginBottom: 1,
                    width: itemSize,
                    height: itemSize,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: "#EEEEEEFF",
                    gap: 16,
                }}>
                <Ionicons name="alert-circle-outline" size={24} color="red" />

                {isOwner && (
                    <Text style={{ fontSize: 12, fontWeight: '600', color: "#333333" }}>Tap for Details</Text>
                )}
            </Pressable>
        );
    }

    return (
        <Pressable
            onPress={() => onPress(mediaId)}
            onLongPress={() => onLongPress(mediaId)}
            style={[styles.container, { width: itemSize, height: itemSize }]}
        >
            {thumbnail && (
                <Image
                    source={{ uri: thumbnail, cacheKey: mediaId }}
                    transition={0}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    cachePolicy={'memory-disk'}
                    recyclingKey={mediaId}
                    onError={(e) => { }}
                    onDisplay={() => onReady(mediaId)}
                />
            )}

            {isVideo && (
                <View style={styles.playIconPosition}>
                    {duration ? (
                        <Text style={styles.videoDurationText}>{formatVideoDuration(duration)}</Text>
                    ) : (
                        <Ionicons name="play-circle-outline" size={24} color="white" />
                    )}
                </View>
            )}

            {requesting && (
                <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="black" />
                </View>
            )}

            {/* Selection Overlay */}
            {selectionMode && (
                <View style={styles.selectionOverlay}>
                    <View style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}>
                        {isSelected && (
                            <Ionicons name="checkmark" size={18} color="white" />
                        )}
                    </View>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#EEEEEEFF",
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
    },

    selectionOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: 8,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },

    checkboxContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    checkboxSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },


})
