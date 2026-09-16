export const NUM_COLUMNS = 3;
export const COLUMN_GAP = 2;
export const HORIZONTAL_PADDING = 0;

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
