import { Dimensions } from "react-native";


interface GridConfig {
    columns: number;
    gap: number;
    aspectRatio: number; // width / height
}

const DEFAULT: GridConfig = {
    columns: 3,
    gap: 2,
    aspectRatio: 1,
}

export const getGridConfig = (options?: Partial<GridConfig>) => {
    const { width } = Dimensions.get('window');
    const columns = options?.columns ?? DEFAULT.columns;
    const gap = options?.gap ?? DEFAULT.gap;
    const aspectRatio = options?.aspectRatio ?? DEFAULT.aspectRatio;

    const tileWidth = (width - (gap * (columns + 1))) / columns;
    const tileHeight = tileWidth / aspectRatio;

    // const size = (width - (gap * (columns - 1))) / columns;

    return { columns, gap, width: tileWidth, height: tileHeight }
}