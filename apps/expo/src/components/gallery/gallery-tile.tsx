import useSignedUrls from "@/src/hooks/useSignedUrls";
import { formatVideoDuration } from "@/src/utils/formatters";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { Media } from "@shutterspace/backend/types/Media";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { memo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface GalleryTileProps {
    media: Media;
    albumId: Id<"albums">;
}

function GalleryTileComponent({ media, albumId }: GalleryTileProps) {
    const [imageError, setImageError] = useState(false);

    const isReady = media.status === "ready";
    const isPending = media.status === "pending";
    const isError = media.status === "error" || imageError;
    const isVideo = media.identifier.type === "video";
    const duration = media.identifier.type === "video" ? media.identifier.duration : null;

    const { requesting, thumbnail: uri } = useSignedUrls({
        media: isReady && !isError ? media : undefined,
    });

    const isLoading = requesting || isPending;

    if (isError) {
        return (
            <View testID="gallery-tile-error" style={styles.container}>
                <Image
                    source="sf:exclamationmark.circle"
                    style={styles.errorIcon}
                    tintColor="#FF3B30"
                />
            </View>
        );
    }

    const content = (
        <View testID="gallery-tile" style={styles.container}>
            {isLoading ? (
                <ActivityIndicator size="small" color="#8E8E93" />
            ) : (
                <>
                    {uri ? (
                        <Image
                            source={{ uri, cacheKey: media._id }}
                            transition={100}
                            style={styles.image}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                            recyclingKey={media._id}
                            onError={() => setImageError(true)}
                        />
                    ) : null}

                    {isVideo && isReady ? (
                        <View style={styles.videoBadge} pointerEvents="none">
                            {duration != null ? (
                                <Text style={styles.durationText}>
                                    {formatVideoDuration(duration)}
                                </Text>
                            ) : (
                                <Image
                                    source="sf:play.fill"
                                    style={styles.playIcon}
                                    tintColor="white"
                                />
                            )}
                        </View>
                    ) : null}
                </>
            )}
        </View>
    );

    if (isLoading || !isReady) {
        return content;
    }

    return (
        <Link href={`/album/${albumId}/media/${media._id}`} asChild>
            <Pressable>{content}</Pressable>
        </Link>
    );
}

export const GalleryTile = memo(GalleryTileComponent);

const styles = StyleSheet.create({
    container: {
        width: "100%",
        aspectRatio: 1,
        marginBottom: 2,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#EEEEEE",
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    videoBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        padding: 8,
    },
    durationText: {
        color: "white",
        fontSize: 12,
        fontWeight: "700",
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    playIcon: {
        width: 18,
        height: 18,
    },
    errorIcon: {
        width: 24,
        height: 24,
    },
});
