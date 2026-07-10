import { FlashList } from "@shopify/flash-list";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { Media } from "@shutterspace/backend/types/Media";
import { useCallback, type ReactElement } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import {
    getGalleryGridItemSpacing,
    HORIZONTAL_PADDING,
    NUM_COLUMNS,
} from "./gallery-layout";
import { GalleryTile, type OriginLayout } from "./gallery-tile";

interface GalleryGridProps {
    media: Media[];
    onTilePress: (mediaId: Id<"media">, origin: OriginLayout, index: number) => void;
    onEndReached?: () => void;
    ListEmptyComponent?: () => ReactElement | null;
    style?: StyleProp<ViewStyle>;
    /** When true, grid ignores touches (viewer open). */
    pointerEventsDisabled?: boolean;
}

export function GalleryGrid({
    media,
    onTilePress,
    onEndReached,
    ListEmptyComponent,
    style,
    pointerEventsDisabled = false,
}: GalleryGridProps) {
    const keyExtractor = useCallback((item: Media) => item._id, []);

    const handleTilePress = useCallback(
        (mediaId: Id<"media">, origin: OriginLayout) => {
            const index = media.findIndex((m) => m._id === mediaId);
            if (index < 0) return;
            onTilePress(mediaId, origin, index);
        },
        [media, onTilePress],
    );

    const renderItem = useCallback(
        ({ item, index }: { item: Media; index: number }) => {
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
                    <GalleryTile
                        media={item}
                        onPress={handleTilePress}
                    />
                </View>
            );
        },
        [handleTilePress],
    );

    return (
        <View
            style={{ flex: 1 }}
            pointerEvents={pointerEventsDisabled ? "none" : "auto"}
        >
            <FlashList
                style={{ flex: 1, ...(style as ViewStyle) }}
                data={media}
                numColumns={NUM_COLUMNS}
                keyExtractor={keyExtractor}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{
                    paddingHorizontal: HORIZONTAL_PADDING,
                    paddingBottom: 32,
                    flexGrow: 1,
                }}
                renderItem={renderItem}
                ListEmptyComponent={ListEmptyComponent}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
            />
        </View>
    );
}
