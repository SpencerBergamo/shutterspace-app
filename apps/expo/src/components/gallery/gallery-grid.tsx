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
import { GalleryTile } from "./gallery-tile";

interface GalleryGridProps {
    media: Media[];
    albumId: Id<"albums">;
    onEndReached?: () => void;
    ListHeaderComponent?: () => ReactElement | null;
    ListEmptyComponent?: () => ReactElement | null;
    style?: StyleProp<ViewStyle>;
}

export function GalleryGrid({
    media,
    albumId,
    onEndReached,
    ListHeaderComponent,
    ListEmptyComponent,
    style,
}: GalleryGridProps) {
    const keyExtractor = useCallback((item: Media) => item._id, []);

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
                    <GalleryTile media={item} albumId={albumId} />
                </View>
            );
        },
        [albumId],
    );

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
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={ListEmptyComponent}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
            />
        </View>
    );
}
