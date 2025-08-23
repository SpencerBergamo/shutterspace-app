/**
 * Get the grid config for a given number of tiles and columns
 * @interface GridConfig - Optional parameters to adjust the grid config
 * @interface GridLayout - All values that define the grid layout
 * 
 * @function getGridConfig - Get the grid config for a given number of tiles and columns
 * @param numberOfTiles - The number of tiles to display
 * @param columns - The number of columns to display
 * @returns The grid config
 */

import { StyleProp, useWindowDimensions, ViewStyle } from "react-native";

interface GridConfig {
    columns: number;
    gap: number;
    aspectRatio: number;
}

interface GridLayout {
    numColumns: number;
    columnWrapperStyle: StyleProp<ViewStyle>;
    contentContainerStyle: StyleProp<ViewStyle>;
    tileWidth: number;
    tileHeight: number;
}

export default function getGridLayout({ columns, gap, aspectRatio }: GridConfig = {
    columns: 3,
    gap: 2,
    aspectRatio: 1,
}): GridLayout {
    const { width } = useWindowDimensions();

    const tileWidth = (width - (gap * (columns + 1))) / columns;
    const tileHeight = width / aspectRatio;

    const columnWrapperStyle: StyleProp<ViewStyle> = {
        gap: gap,
        justifyContent: 'flex-start',
    };

    const contentContainerStyle: StyleProp<ViewStyle> = {
        padding: 16,
        gap: gap,
    };

    return {
        numColumns: columns,
        columnWrapperStyle,
        contentContainerStyle,
        tileWidth,
        tileHeight,
    };
}