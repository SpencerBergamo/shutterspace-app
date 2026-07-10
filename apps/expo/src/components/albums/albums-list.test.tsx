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
                <View testID="albums-list-content" style={contentContainerStyle}>
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

function renderAlbumsList(
    albums: Album[],
    screenWidth: number,
    layoutKey?: string,
) {
    setScreenWidth(screenWidth);

    return render(
        <AppThemeProvider>
            <AlbumsList
                albums={albums}
                onAlbumPress={jest.fn()}
                layoutKey={layoutKey}
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

        const { getAllByTestId, getByTestId } = await renderAlbumsList(albums, screenWidth);

        const content = getByTestId("albums-list-content");
        const covers = getAllByTestId("album-tile-cover");
        const gridItems = getAllByTestId("album-grid-item");

        expect(content).toHaveStyle({
            paddingHorizontal: HORIZONTAL_PADDING,
        });

        expect(covers).toHaveLength(albums.length);

        for (const cover of covers) {
            expect(cover).toHaveStyle({
                width: "100%",
                aspectRatio: 1,
            });
        }

        for (const [index, gridItem] of gridItems.entries()) {
            const { paddingLeft, paddingRight } = getAlbumGridItemSpacing(index);

            expect(gridItem).toHaveStyle({
                flex: 1,
                paddingLeft,
                paddingRight,
            });

            // Tile fills the column minus the half-gap padding on the inner edge.
            expect(columnWidth - paddingLeft - paddingRight).toBe(expectedTileWidth);
        }

        const usedWidth =
            HORIZONTAL_PADDING * 2 +
            expectedTileWidth * NUM_COLUMNS +
            COLUMN_GAP * (NUM_COLUMNS - 1);

        expect(usedWidth).toBe(screenWidth);
    });

    it("distributes the column gap evenly between left and right tiles", () => {
        expect(getAlbumGridItemSpacing(0)).toEqual({
            paddingLeft: 0,
            paddingRight: COLUMN_GAP / 2,
        });

        expect(getAlbumGridItemSpacing(1)).toEqual({
            paddingLeft: COLUMN_GAP / 2,
            paddingRight: 0,
        });
    });

    it("keeps equal cover styles across all rendered albums", async () => {
        const { getAllByTestId } = await renderAlbumsList(albums, 390);

        const widths = getAllByTestId("album-tile-cover")
            .map((cover) => getStyleProp<{ width: string | number }>(cover).width);

        expect(new Set(widths).size).toBe(1);
        expect(widths[0]).toBe("100%");
    });

    it("preserves even spacing after the album order changes (sort)", async () => {
        const sortedByName = [...albums].sort((a, b) => a.title.localeCompare(b.title));

        const { getAllByTestId, getByTestId, rerender } = await renderAlbumsList(
            albums,
            390,
            "updated",
        );

        await rerender(
            <AppThemeProvider>
                <AlbumsList
                    albums={sortedByName}
                    onAlbumPress={jest.fn()}
                    layoutKey="name"
                />
            </AppThemeProvider>,
        );

        const content = getByTestId("albums-list-content");
        const covers = getAllByTestId("album-tile-cover");
        const gridItems = getAllByTestId("album-grid-item");

        expect(content).toHaveStyle({ paddingHorizontal: HORIZONTAL_PADDING });
        expect(covers).toHaveLength(albums.length);

        for (const cover of covers) {
            expect(cover).toHaveStyle({ width: "100%", aspectRatio: 1 });
        }

        for (const [index, gridItem] of gridItems.entries()) {
            expect(gridItem).toHaveStyle(getAlbumGridItemSpacing(index));
        }
    });
});
