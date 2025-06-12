import { useMemo } from "react";
import { Dimensions } from "react-native";

interface GridConfig {
    numColumns: number;
    spacing: number;
    itemSize: number;
}

const DEFAULT_CONFIG: GridConfig = {
    numColumns: 3,
    spacing: 2,
    itemSize: 0,
}

export const useGridConfig = (options?: Partial<GridConfig>): GridConfig => {
    const { width } = Dimensions.get('window');

    return useMemo(() => {
        const numColumns = options?.numColumns ?? DEFAULT_CONFIG.numColumns;
        const spacing = options?.spacing ?? DEFAULT_CONFIG.spacing;

        const itemSize = (width - (spacing * (numColumns - 1))) / numColumns;

        return {
            numColumns,
            spacing,
            itemSize,
        }
    }, [width, options?.numColumns, options?.spacing]);
}