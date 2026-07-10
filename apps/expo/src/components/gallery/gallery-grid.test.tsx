import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { Media } from "@shutterspace/backend/types/Media";
import { fireEvent, render } from "@testing-library/react-native";
import { Dimensions } from "react-native";
import { GalleryGrid } from "./gallery-grid";
import {
    getGalleryGridItemSpacing,
    NUM_COLUMNS,
} from "./gallery-layout";

jest.mock("@shopify/flash-list", () => {
    const { Dimensions, Pressable, View } = require("react-native");

    return {
        FlashList: function MockFlashList({
            data,
            renderItem,
            keyExtractor,
            contentContainerStyle,
            numColumns = 1,
            onEndReached,
            ListEmptyComponent,
        }: {
            data?: unknown[];
            renderItem: (info: { item: unknown; index: number }) => React.ReactNode;
            keyExtractor: (item: unknown, index: number) => string;
            contentContainerStyle?: { paddingHorizontal?: number };
            numColumns?: number;
            onEndReached?: () => void;
            ListEmptyComponent?: () => React.ReactElement | null;
        }) {
            if (!data || data.length === 0) {
                return ListEmptyComponent ? <ListEmptyComponent /> : null;
            }

            const horizontalPadding = contentContainerStyle?.paddingHorizontal ?? 0;
            const listWidth = Dimensions.get("window").width - horizontalPadding * 2;
            const columnWidth = listWidth / numColumns;

            return (
                <View testID="gallery-list-content" style={contentContainerStyle}>
                    <Pressable testID="gallery-list-end" onPress={() => onEndReached?.()} />
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {data.map((item, index) => (
                            <View key={keyExtractor(item, index)} style={{ width: columnWidth }}>
                                {renderItem({ item, index })}
                            </View>
                        ))}
                    </View>
                </View>
            );
        },
    };
});

jest.mock("@/src/hooks/useSignedUrls", () => ({
    __esModule: true,
    default: () => ({
        requesting: false,
        thumbnail: "https://example.com/thumb.jpg",
        handleImageError: jest.fn(),
        requestingVideo: false,
        requestVideo: jest.fn(),
    }),
}));

jest.mock("expo-image", () => {
    const { View } = require("react-native");
    return { Image: View };
});

function setScreenWidth(screenWidth: number) {
    Dimensions.set({
        window: {
            width: screenWidth,
            height: 844,
            scale: 2,
            fontScale: 1,
        },
        screen: {
            width: screenWidth,
            height: 844,
            scale: 2,
            fontScale: 1,
        },
    });
}

function createMedia(id: string, index: number): Media {
    return {
        _id: id as Id<"media">,
        _creationTime: 1_700_000_000_000 + index,
        albumId: "album1" as Id<"albums">,
        createdBy: "profile1" as Id<"profiles">,
        assetId: `asset-${id}`,
        filename: `${id}.jpg`,
        identifier: {
            type: "image",
            imageId: `img-${id}`,
            width: 1000,
            height: 1000,
        },
        status: "ready",
    };
}

describe("GalleryGrid", () => {
    beforeEach(() => {
        setScreenWidth(390);
    });

    it("renders a 3-column grid of tiles with stable keys", async () => {
        const media = [0, 1, 2, 3, 4].map((i) => createMedia(`m${i}`, i));
        const onTilePress = jest.fn();

        const { getAllByTestId } = await render(
            <GalleryGrid media={media} onTilePress={onTilePress} />,
        );

        const items = getAllByTestId("gallery-grid-item");
        expect(items).toHaveLength(5);
        expect(NUM_COLUMNS).toBe(3);

        items.forEach((item, index) => {
            expect(item).toHaveStyle({
                flex: 1,
                ...getGalleryGridItemSpacing(index),
            });
        });

        const tiles = getAllByTestId("gallery-tile");
        expect(tiles[0]).toHaveStyle({
            width: "100%",
            aspectRatio: 1,
        });
    });

    it("invokes onEndReached from the list", async () => {
        const media = [0, 1, 2].map((i) => createMedia(`m${i}`, i));
        const onEndReached = jest.fn();

        const { getByTestId } = await render(
            <GalleryGrid
                media={media}
                onTilePress={jest.fn()}
                onEndReached={onEndReached}
            />,
        );

        fireEvent.press(getByTestId("gallery-list-end"));
        expect(onEndReached).toHaveBeenCalled();
    });
});
