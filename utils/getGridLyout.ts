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

import { StyleProp, ViewStyle } from "react-native";

interface GridConfig {
    width: number;
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

export default function getGridLayout({ width, columns, gap, aspectRatio }: GridConfig): GridLayout {

    const tileWidth = width / columns;
    const tileHeight = tileWidth / aspectRatio;

    const columnWrapperStyle: StyleProp<ViewStyle> = {
        gap: gap,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    };

    const contentContainerStyle: StyleProp<ViewStyle> = {
        padding: gap,
    };

    return {
        numColumns: columns,
        columnWrapperStyle,
        contentContainerStyle,
        tileWidth,
        tileHeight,
    };
}