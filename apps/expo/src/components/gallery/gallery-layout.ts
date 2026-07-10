export const NUM_COLUMNS = 3;
export const COLUMN_GAP = 2;
export const HORIZONTAL_PADDING = 0;

/** Exact square tile width for a 3-column gallery grid. */
export function getGalleryTileSize(screenWidth: number) {
    const contentWidth = screenWidth - HORIZONTAL_PADDING * 2;
    const totalGap = COLUMN_GAP * (NUM_COLUMNS - 1);
    return (contentWidth - totalGap) / NUM_COLUMNS;
}

export function getGalleryContentWidth(screenWidth: number) {
    return screenWidth - HORIZONTAL_PADDING * 2;
}

/** Half the column gap applied as padding on each side of the inter-column gap. */
export function getGalleryGridItemSpacing(index: number) {
    const column = index % NUM_COLUMNS;
    const isFirstColumn = column === 0;
    const isLastColumn = column === NUM_COLUMNS - 1;

    return {
        paddingLeft: isFirstColumn ? 0 : COLUMN_GAP / 2,
        paddingRight: isLastColumn ? 0 : COLUMN_GAP / 2,
    };
}
