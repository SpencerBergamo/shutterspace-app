import { FlashList } from "@shopify/flash-list";
import { Album } from "@shutterspace/backend/types/Album";
import { useCallback, type ReactElement } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import AlbumListCard from "./album-list-card";

export const HORIZONTAL_PADDING = 16;
export const COLUMN_GAP = 12;
export const NUM_COLUMNS = 2;

export function getAlbumTileWidth(screenWidth: number) {
    return (screenWidth - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / NUM_COLUMNS;
}

export function getAlbumListContentWidth(screenWidth: number) {
    return screenWidth - HORIZONTAL_PADDING * 2;
}

/** Half the column gap applied as padding on each side of the inter-column gap. */
export function getAlbumGridItemSpacing(index: number) {
    const isLeftColumn = index % NUM_COLUMNS === 0;

    return {
        paddingLeft: isLeftColumn ? 0 : COLUMN_GAP / 2,
        paddingRight: isLeftColumn ? COLUMN_GAP / 2 : 0,
    };
}

interface AlbumsListProps {
    albums: Album[] | undefined;
    onAlbumPress: (album: Album) => void;
    onEndReached?: () => void;
    ListEmptyComponent?: () => ReactElement;
    style?: StyleProp<ViewStyle>;
    /** Remount the list when this changes (e.g. sort) so FlashList recalculates column layout. */
    layoutKey?: string;
}

export function AlbumsList({
    albums,
    onAlbumPress,
    onEndReached,
    ListEmptyComponent,
    style,
    layoutKey,
}: AlbumsListProps) {
    const renderItem = useCallback(({ item, index }: { item: Album; index: number }) => {
        const { paddingLeft, paddingRight } = getAlbumGridItemSpacing(index);

        return (
            <View
                testID="album-grid-item"
                style={{
                    flex: 1,
                    paddingLeft,
                    paddingRight,
                    paddingBottom: COLUMN_GAP,
                }}
            >
                <AlbumListCard
                    album={item}
                    onPress={() => onAlbumPress(item)}
                />
            </View>
        );
    }, [onAlbumPress]);

    return (
        <FlashList
            key={layoutKey}
            style={{ flex: 1, ...(style as ViewStyle) }}
            data={albums}
            numColumns={NUM_COLUMNS}
            keyExtractor={(item) => item._id}
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
            extraData={layoutKey}
        />
    );
}
