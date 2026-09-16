import {
    COLUMN_GAP,
    getGalleryGridItemSpacing,
} from "./gallery-layout";

describe("gallery-layout", () => {
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
