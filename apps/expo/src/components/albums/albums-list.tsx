import { FlashList } from "@shopify/flash-list";
import { Album } from "@shutterspace/backend/types/Album";
import { useCallback, type ReactElement } from "react";
import { useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";
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

export function getAlbumGridItemSpacing(index: number) {
    const itemGap = (COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
    const marginLeft = ((index % NUM_COLUMNS) / (NUM_COLUMNS - 1)) * itemGap;
    const marginRight = itemGap - marginLeft;

    return { marginLeft, marginRight, itemGap };
}

interface AlbumsListProps {
    albums: Album[] | undefined;
    onAlbumPress: (album: Album) => void;
    onEndReached?: () => void;
    ListEmptyComponent?: () => ReactElement;
    style?: StyleProp<ViewStyle>;
}

export function AlbumsList({
    albums,
    onAlbumPress,
    onEndReached,
    ListEmptyComponent,
    style,
}: AlbumsListProps) {
    const { width: screenWidth } = useWindowDimensions();
    const tileWidth = getAlbumTileWidth(screenWidth);

    const renderItem = useCallback(({ item, index }: { item: Album; index: number }) => {
        const { marginLeft, marginRight } = getAlbumGridItemSpacing(index);

        return (
            <View
                testID="album-grid-item"
                style={{
                    flexGrow: 1,
                    marginLeft,
                    marginRight,
                    paddingBottom: COLUMN_GAP,
                }}
            >
                <AlbumListCard
                    album={item}
                    width={tileWidth}
                    onPress={() => onAlbumPress(item)}
                />
            </View>
        );
    }, [tileWidth, onAlbumPress]);

    return (
        <FlashList
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
        />
    );
}
