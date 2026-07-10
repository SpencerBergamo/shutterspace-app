import {
    COLUMN_GAP,
    getGalleryContentWidth,
    getGalleryGridItemSpacing,
    getGalleryTileSize,
    HORIZONTAL_PADDING,
    NUM_COLUMNS,
} from "./gallery-layout";

describe("gallery-layout", () => {
    it("computes square tile size for 3 columns", () => {
        const screenWidth = 390;
        const tileSize = getGalleryTileSize(screenWidth);
        const contentWidth = getGalleryContentWidth(screenWidth);
        const totalGaps = COLUMN_GAP * (NUM_COLUMNS - 1);

        expect(tileSize * NUM_COLUMNS + totalGaps).toBeCloseTo(contentWidth);
        expect(contentWidth).toBe(screenWidth - HORIZONTAL_PADDING * 2);
    });

    it("applies half-gap padding between columns", () => {
        expect(getGalleryGridItemSpacing(0)).toEqual({
            paddingLeft: 0,
            paddingRight: COLUMN_GAP / 2,
        });
        expect(getGalleryGridItemSpacing(1)).toEqual({
            paddingLeft: COLUMN_GAP / 2,
            paddingRight: COLUMN_GAP / 2,
        });
        expect(getGalleryGridItemSpacing(2)).toEqual({
            paddingLeft: COLUMN_GAP / 2,
            paddingRight: 0,
        });
        expect(getGalleryGridItemSpacing(3)).toEqual({
            paddingLeft: 0,
            paddingRight: COLUMN_GAP / 2,
        });
    });
});
