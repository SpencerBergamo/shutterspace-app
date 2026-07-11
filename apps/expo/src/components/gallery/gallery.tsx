import { useAppTheme } from "@/src/context/AppThemeContext";
import useAlbumCover from "@/src/hooks/useAlbumCover";
import type { AlbumMediaStatus } from "@/src/hooks/useAlbumMedia";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { Media } from "@shutterspace/backend/types/Media";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GalleryGrid } from "./gallery-grid";

export interface GalleryProps {
    albumId: Id<"albums">;
    media: Media[];
    status: AlbumMediaStatus;
    onEndReached: () => void;
}

export function Gallery({
    albumId,
    media,
    status,
    onEndReached,
}: GalleryProps) {
    const { colors } = useAppTheme();
    const {
        requesting: requestingAlbumCover,
        coverUrl: albumCoverUrl,
        mediaId: albumCoverMediaId,
    } = useAlbumCover(albumId);

    const Empty = useCallback(() => {
        if (status === "LoadingFirstPage") {
            return (
                <View style={styles.empty}>
                    <ActivityIndicator size="large" color={colors.text} />
                </View>
            );
        }

        return (
            <View style={styles.empty}>
                <Text selectable style={[styles.emptyText, { color: colors.caption }]}>
                    No photos or videos yet.
                </Text>
            </View>
        );
    }, [status, colors.text, colors.caption]);

    const ListHeaderComponent = useCallback(() => {
        if (requestingAlbumCover) {
            return (
                <View style={styles.cover}>
                    <ActivityIndicator size="small" color="grey" />
                </View>
            );
        }

        if (!albumCoverUrl || !albumCoverMediaId) {
            return null;
        }

        return (
            <Link.AppleZoomTarget>
                <View style={styles.cover}>
                    <Image
                        source={{ uri: albumCoverUrl, cacheKey: albumCoverMediaId }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                    />
                </View>
            </Link.AppleZoomTarget>
        );
    }, [requestingAlbumCover, albumCoverUrl, albumCoverMediaId]);

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <GalleryGrid
                albumId={albumId}
                media={media}
                onEndReached={onEndReached}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={Empty}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    cover: {
        width: "100%",
        aspectRatio: 1,
        marginBottom: 2,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#DEDEDE",
        overflow: "hidden",
    },
    empty: {
        flex: 1,
        minHeight: 240,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 16,
        textAlign: "center",
    },
});
