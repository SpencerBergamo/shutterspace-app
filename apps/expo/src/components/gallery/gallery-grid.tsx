import { AlbumMediaStatus } from "@/src/hooks/useAlbumMedia";
import { FlashList } from "@shopify/flash-list";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { AlbumCover } from "@shutterspace/backend/types/Album";
import { Media } from "@shutterspace/backend/types/Media";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useCallback } from "react";
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from "react-native";
import { GalleryGridHeader } from "./gallery-grid-header";
import {
    getGalleryGridItemSpacing,
    HORIZONTAL_PADDING,
    NUM_COLUMNS,
} from "./gallery-layout";
import { GalleryTile } from "./gallery-tile";

interface GalleryGridProps {
    media: Media[];
    albumId: Id<"albums">;
    cover?: AlbumCover;
    onEndReached?: () => void;
    status: AlbumMediaStatus;
    style?: StyleProp<ViewStyle>;
}

export function GalleryGrid({
    media,
    albumId,
    cover,
    onEndReached,
    status,
    style,
}: GalleryGridProps) {
    const headerHeight = useHeaderHeight();
    const keyExtractor = useCallback((item: Media) => item._id, []);

    const renderItem = useCallback(({ item, index }: { item: Media; index: number }) => {
        const { paddingLeft, paddingRight } = getGalleryGridItemSpacing(index);

        return (
            <View
                testID="gallery-grid-item"
                style={{
                    flex: 1,
                    paddingLeft,
                    paddingRight,
                }}
            >
                <GalleryTile media={item} albumId={albumId} />
            </View>
        );
    }, [albumId]);

    const HeaderComponent = useCallback(() => (
        <GalleryGridHeader albumId={albumId} cover={cover} />
    ), [albumId, cover]);

    const EmptyComponent = useCallback(() => (
        <View style={{ flex: 1, marginTop: headerHeight }} />
    ), [headerHeight]);

    const FooterComponent = useCallback(() => {
        if (status === "LoadingMore") {
            return (
                <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 16 }}>
                    <ActivityIndicator />
                </View>
            );
        }
        return null;
    }, [status]);

    return (
        <View style={{ flex: 1 }}>
            <FlashList
                style={{ flex: 1, ...(style as ViewStyle) }}
                data={media}
                numColumns={NUM_COLUMNS}
                keyExtractor={keyExtractor}
                contentContainerStyle={{
                    paddingHorizontal: HORIZONTAL_PADDING,
                    paddingBottom: 32,
                    flexGrow: 1,
                }}
                renderItem={renderItem}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={EmptyComponent}
                ListHeaderComponent={HeaderComponent}
                ListFooterComponent={FooterComponent}
            />
        </View>
    );
}
