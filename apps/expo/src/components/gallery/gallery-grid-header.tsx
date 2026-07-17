import useAlbumCover from "@/src/hooks/useAlbumCover";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { AlbumCover } from "@shutterspace/backend/types/Album";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export interface GalleryGridHeaderProps {
    albumId: Id<"albums">;
    cover?: AlbumCover;
}

export function GalleryGridHeader({ albumId, cover }: GalleryGridHeaderProps) {
    const { requesting, coverUrl, cacheKey } = useAlbumCover(albumId, { cover });

    return (
        <Link.AppleZoomTarget>
            <View testID="gallery-grid-header" style={styles.cover}>
                {coverUrl && cacheKey ? (
                    <Image
                        source={{ uri: coverUrl, cacheKey }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                    />
                ) : requesting ? (
                    <ActivityIndicator size="small" color="grey" />
                ) : (
                    <Image
                        source="sf:photo"
                        style={styles.placeholderIcon}
                        tintColor="#777777"
                    />
                )}
            </View>
        </Link.AppleZoomTarget>
    );
}

const styles = StyleSheet.create({
    cover: {
        width: "100%",
        aspectRatio: 1,
        marginBottom: 2,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#DEDEDE",
        overflow: "hidden",
    },
    placeholderIcon: {
        width: 48,
        height: 48,
    },
});
