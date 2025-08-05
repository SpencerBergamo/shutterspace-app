import { useWindowDimensions } from "react-native";

interface GridConfig {
    columns: number;
    gap: number;
    aspectRatio: number;
}

export const getGridConfig = ({ columns = 3, gap = 2, aspectRatio = 1 }: Partial<GridConfig>) => {
    const { width } = useWindowDimensions();

    const tileWidth = (width - (gap * (columns + 1))) / columns;
    const tileHeight = tileWidth / aspectRatio;

    return { columns, gap, width: tileWidth, height: tileHeight };
}