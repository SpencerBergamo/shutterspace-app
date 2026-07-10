import type { AlbumMediaStatus } from "@/src/hooks/useAlbumMedia";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { Media } from "@shutterspace/backend/types/Media";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GalleryGrid } from "./gallery-grid";
import { GalleryViewer } from "./gallery-viewer";
import type { OriginLayout } from "./gallery-tile";

export interface GalleryProps {
    media: Media[];
    status: AlbumMediaStatus;
    onEndReached: () => void;
    onViewerOpenChange?: (open: boolean) => void;
}

export function Gallery({
    media,
    status,
    onEndReached,
    onViewerOpenChange,
}: GalleryProps) {
    const { colors } = useAppTheme();
    const [openedIndex, setOpenedIndex] = useState<number | null>(null);

    const viewerOpen = openedIndex != null;

    const handleTilePress = useCallback(
        (_mediaId: Id<"media">, _origin: OriginLayout, index: number) => {
            setOpenedIndex(index);
            onViewerOpenChange?.(true);
        },
        [onViewerOpenChange],
    );

    const handleClose = useCallback(() => {
        setOpenedIndex(null);
        onViewerOpenChange?.(false);
    }, [onViewerOpenChange]);

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
                <Text style={[styles.emptyText, { color: colors.caption }]}>
                    No photos or videos yet.
                </Text>
            </View>
        );
    }, [status, colors.text, colors.caption]);

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <GalleryGrid
                media={media}
                onTilePress={handleTilePress}
                onEndReached={onEndReached}
                ListEmptyComponent={Empty}
                pointerEventsDisabled={viewerOpen}
            />

            {openedIndex != null ? (
                <GalleryViewer
                    media={media}
                    initialIndex={openedIndex}
                    visible
                    onClose={handleClose}
                    onNearEnd={onEndReached}
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
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
