import { useMemo } from "react";
import { Dimensions } from "react-native";

interface GridConfig {
    numColumns: number;
    spacing: number;
    itemSize: number;
}

export const useGridConfig = (options?: Partial<GridConfig>): GridConfig => {
    const { width } = Dimensions.get('window');

    return useMemo(() => {
        const numColumns = options?.numColumns ?? 3;
        const spacing = options?.spacing ?? 2;

        const itemSize = (width - (spacing * (numColumns - 1))) / numColumns;

        return {
            numColumns,
            spacing,
            itemSize,
        }
    }, [width, options?.numColumns, options?.spacing]);
}