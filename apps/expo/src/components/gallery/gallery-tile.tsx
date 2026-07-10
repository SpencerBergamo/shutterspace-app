import useSignedUrls from "@/src/hooks/useSignedUrls";
import { formatVideoDuration } from "@/src/utils/formatters";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { Media } from "@shutterspace/backend/types/Media";
import { Image } from "expo-image";
import { memo, useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
    type LayoutRectangle,
} from "react-native";

export type OriginLayout = LayoutRectangle & { pageX: number; pageY: number };

interface GalleryTileProps {
    media: Media;
    onPress: (mediaId: Id<"media">, origin: OriginLayout) => void;
}

function GalleryTileComponent({ media, onPress }: GalleryTileProps) {
    const containerRef = useRef<View>(null);
    const [imageError, setImageError] = useState(false);

    const isReady = media.status === "ready";
    const isPending = media.status === "pending";
    const isError = media.status === "error" || imageError;
    const isVideo = media.identifier.type === "video";
    const duration = media.identifier.type === "video" ? media.identifier.duration : null;

    const { requesting, thumbnail: uri } = useSignedUrls({
        media: isReady && !isError ? media : undefined,
    });

    const handlePress = useCallback(() => {
        if (!isReady || isError) return;

        containerRef.current?.measureInWindow((x, y, width, height) => {
            onPress(media._id, { x, y, width, height, pageX: x, pageY: y });
        });
    }, [isReady, isError, media._id, onPress]);

    if (isError) {
        return (
            <View
                testID="gallery-tile-error"
                style={styles.container}
            >
                <Image
                    source="sf:exclamationmark.circle"
                    style={styles.errorIcon}
                    tintColor="#FF3B30"
                />
            </View>
        );
    }

    return (
        <View
            ref={containerRef}
            testID="gallery-tile"
            style={styles.container}
        >
            <Pressable
                disabled={isPending}
                onPress={handlePress}
                style={StyleSheet.absoluteFill}
            >
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
                            <Text style={styles.durationText}>{formatVideoDuration(duration)}</Text>
                        ) : (
                            <Image
                                source="sf:play.fill"
                                style={styles.playIcon}
                                tintColor="white"
                            />
                        )}
                    </View>
                ) : null}

                {(requesting || isPending) && (
                    <ActivityIndicator
                        style={StyleSheet.absoluteFill}
                        size="small"
                        color="#8E8E93"
                    />
                )}
            </Pressable>
        </View>
    );
}

function areEqual(prev: GalleryTileProps, next: GalleryTileProps) {
    return (
        prev.onPress === next.onPress &&
        prev.media._id === next.media._id &&
        prev.media.status === next.media.status &&
        prev.media.identifier === next.media.identifier
    );
}

export const GalleryTile = memo(GalleryTileComponent, areEqual);

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
