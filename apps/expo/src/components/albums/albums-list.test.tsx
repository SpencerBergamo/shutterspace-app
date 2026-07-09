import { AppThemeProvider } from "@/src/context/AppThemeContext";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { Album } from "@shutterspace/backend/types/Album";
import { render } from "@testing-library/react-native";
import { Dimensions } from "react-native";
import {
    AlbumsList,
    COLUMN_GAP,
    getAlbumGridItemSpacing,
    getAlbumListContentWidth,
    getAlbumTileWidth,
    HORIZONTAL_PADDING,
    NUM_COLUMNS,
} from "./albums-list";

jest.mock("@shopify/flash-list", () => {
    const { Dimensions, View } = require("react-native");

    return {
        FlashList: function MockFlashList({
            data,
            renderItem,
            keyExtractor,
            contentContainerStyle,
            numColumns = 1,
        }: {
            data?: unknown[];
            renderItem: (info: { item: unknown; index: number }) => React.ReactNode;
            keyExtractor: (item: unknown, index: number) => string;
            contentContainerStyle?: {
                paddingHorizontal?: number;
            };
            numColumns?: number;
        }) {
            if (!data) {
                return null;
            }

            const horizontalPadding = contentContainerStyle?.paddingHorizontal ?? 0;
            const listWidth = Dimensions.get("window").width - horizontalPadding * 2;
            const columnWidth = listWidth / numColumns;

            return (
                <View style={contentContainerStyle}>
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

jest.mock("@/src/hooks/useAlbumCover", () => ({
    __esModule: true,
    default: () => ({
        requesting: false,
        coverUrl: null,
        mediaId: null,
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

function createAlbum(id: string, title: string): Album {
    return {
        _id: id as Id<"albums">,
        _creationTime: 1_700_000_000_000,
        hostId: "host1" as Id<"profiles">,
        title,
        isDynamicThumbnail: false,
        openInvites: false,
        status: "active",
        updatedAt: 1_700_000_000_000,
    };
}

function renderAlbumsList(albums: Album[], screenWidth: number) {
    setScreenWidth(screenWidth);

    return render(
        <AppThemeProvider>
            <AlbumsList
                albums={albums}
                onAlbumPress={jest.fn()}
            />
        </AppThemeProvider>,
    );
}

function getStyleProp<T extends object>(element: { props: { style?: T | T[] } }): T {
    const { style } = element.props;
    return Array.isArray(style) ? Object.assign({}, ...style) : (style ?? {}) as T;
}

describe("AlbumsList layout", () => {
    const albums = [
        createAlbum("album-1", "Summer Trip"),
        createAlbum("album-2", "Family Reunion"),
        createAlbum("album-3", "Weekend Hike"),
        createAlbum("album-4", "Birthday Party"),
    ];

    it.each([
        { screenWidth: 390, label: "iPhone 14 width" },
        { screenWidth: 428, label: "iPhone 14 Pro Max width" },
        { screenWidth: 768, label: "tablet width" },
    ])("uses 1:1 tiles with even spacing at $label ($screenWidth px)", async ({ screenWidth }) => {
        const expectedTileWidth = getAlbumTileWidth(screenWidth);
        const contentWidth = getAlbumListContentWidth(screenWidth);
        const columnWidth = contentWidth / NUM_COLUMNS;

        const { getAllByTestId } = await renderAlbumsList(albums, screenWidth);

        const covers = getAllByTestId("album-tile-cover");
        const gridItems = getAllByTestId("album-grid-item");

        expect(covers).toHaveLength(albums.length);

        for (const cover of covers) {
            expect(cover).toHaveStyle({
                width: expectedTileWidth,
                aspectRatio: 1,
            });
        }

        for (const [index, gridItem] of gridItems.entries()) {
            const { marginLeft, marginRight } = getAlbumGridItemSpacing(index);

            expect(gridItem).toHaveStyle({
                marginLeft,
                marginRight,
            });

            expect(expectedTileWidth + marginLeft + marginRight).toBe(columnWidth);
        }

        const usedWidth =
            HORIZONTAL_PADDING * 2 +
            expectedTileWidth * NUM_COLUMNS +
            COLUMN_GAP * (NUM_COLUMNS - 1);

        expect(usedWidth).toBe(screenWidth);
    });

    it("distributes the column gap evenly between left and right tiles", () => {
        expect(getAlbumGridItemSpacing(0)).toEqual({
            marginLeft: 0,
            marginRight: COLUMN_GAP / 2,
            itemGap: COLUMN_GAP / 2,
        });

        expect(getAlbumGridItemSpacing(1)).toEqual({
            marginLeft: COLUMN_GAP / 2,
            marginRight: 0,
            itemGap: COLUMN_GAP / 2,
        });
    });

    it("keeps equal tile widths across all rendered albums", async () => {
        const { getAllByTestId } = await renderAlbumsList(albums, 390);

        const widths = getAllByTestId("album-tile-cover")
            .map((cover) => getStyleProp<{ width: number }>(cover).width);

        expect(new Set(widths).size).toBe(1);
    });
});
