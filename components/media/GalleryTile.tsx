import { useProfile } from "@/context/ProfileContext";
import { Id } from "@/convex/_generated/dataModel";
import useSignedUrls from "@/hooks/useSignedUrls";
import { Media } from "@/types/Media";
import { formatVideoDuration } from "@/utils/formatters";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

interface GalleryTileProps {
    media: Media;
    itemSize: number;
    placeholder: string;
    onPress: (mediaId: Id<'media'>) => void;
    onLongPress: (mediaId: Id<'media'>) => void;
    onRetry: (mediaId: Id<'media'>) => void;
    onReady: (mediaId: Id<'media'>) => void;
}

export default function GalleryTile({ media, itemSize, placeholder, onPress, onLongPress, onRetry, onReady }: GalleryTileProps) {
    const { profileId } = useProfile();
    const { requesting, thumbnail } = useSignedUrls({ media });

    const [imageError, setImageError] = useState<string | null>(null);

    const mediaId = media._id;
    const type = media.identifier.type;
    const isVideo = type === 'video';
    const duration = type === 'video' ? media.identifier.duration : null;
    const isOwner = profileId === media.createdBy;

    if (imageError) {
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
                    <Text style={{}}>Tap for Details</Text>
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
                    placeholder={placeholder}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    cachePolicy={'memory-disk'}
                    onError={(e) => {
                        setImageError(e.error);
                    }}
                    onDisplay={() => {
                        onReady(mediaId);
                        setImageError(null);
                    }}
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
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
})