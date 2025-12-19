import { Id } from "@/convex/_generated/dataModel";
import { useProfile } from "@/src/context/ProfileContext";
import useSignedUrls from "@/src/hooks/useSignedUrls";
import { Media } from "@/src/types/Media";
import { formatVideoDuration } from "@/src/utils/formatters";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from "expo-image";
import { memo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

interface GalleryTileProps {
    media: Media;
    placeholder?: string;
    itemSize: number;
    onPress: (mediaId: Id<'media'>) => void;
    onLongPress: (mediaId: Id<'media'>) => void;
    onRetry: (mediaId: Id<'media'>) => void;
    onReady: (mediaId: Id<'media'>) => void;
    selectionMode?: boolean;
    isSelected?: boolean;
}

function GalleryTile({ media, itemSize, onPress, onLongPress, onRetry, onReady, selectionMode = false, isSelected = false }: GalleryTileProps) {
    const { profileId } = useProfile();
    const { requesting, thumbnail: uri } = useSignedUrls({ media });

    const [imageError, setImageError] = useState(false);

    const mediaId = media._id;
    const type = media.identifier.type;
    const isVideo = type === 'video';
    const duration = type === 'video' ? media.identifier.duration : null;
    const isOwner = media.createdBy === profileId;

    if (media.status === 'error' || imageError) {
        return (
            <Pressable
                disabled={!isOwner}
                onPress={() => onRetry(mediaId)}
                style={{
                    marginBottom: 2,
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
            disabled={media.status === 'pending'}
            onPress={() => onPress(mediaId)}
            onLongPress={() => onLongPress(mediaId)}
            style={[styles.container, { width: itemSize, height: itemSize }]}
        >
            {uri && (
                <Image
                    source={{ uri, cacheKey: mediaId }}
                    transition={100}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    cachePolicy={'memory-disk'}
                    recyclingKey={mediaId}
                    onError={(e) => {
                        console.error("Gallery Tile ERROR: ", e);
                        setImageError(true);
                    }}
                    onDisplay={() => onReady(mediaId)}
                />
            )}

            {isVideo && (
                <View style={styles.playIconPosition}>
                    {duration ? (
                        <Text style={styles.videoDurationText}>{formatVideoDuration(duration)}</Text>
                    ) : (
                        <Ionicons name="play-outline" size={24} color="white" />
                    )}
                </View>
            )}

            {requesting && (
                <ActivityIndicator size="small" color="grey" />
            )}

            {/* Selection Overlay */}
            {selectionMode && (
                <View style={styles.selectionOverlay}>
                    {isOwner ? (
                        <View style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}>
                            {isSelected && (
                                <Ionicons name="checkmark" size={18} color="white" />
                            )}
                        </View>
                    ) : (
                        <Ionicons name="lock-closed-outline" size={18} color="white" />
                    )}
                </View>
            )}
        </Pressable>
    );
}

export default memo(GalleryTile, (prevProps, nextProps) => {
    return prevProps.media._id === nextProps.media._id &&
        prevProps.media.status === nextProps.media.status &&
        prevProps.itemSize === nextProps.itemSize &&
        prevProps.selectionMode === nextProps.selectionMode &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.placeholder === nextProps.placeholder;
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 2,
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
