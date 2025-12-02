import { useAppTheme } from "@/context/AppThemeContext";
import { useMemo } from "react";
import { Dimensions, StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UseFabStylesResult {
    position: StyleProp<ViewStyle>;
    button: StyleProp<ViewStyle>;
    iconSize: number;
}

export default function useFabStyles(): UseFabStylesResult {
    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();

    return useMemo(() => {
        const breakPoint = 400;
        const minSize = breakPoint * 0.2;
        const maxSize = 60;

        const fabSize = Math.min(
            Math.max(SCREEN_WIDTH * 0.2, minSize),
            maxSize,
        )

        const position: StyleProp<ViewStyle> = {
            position: 'absolute' as const,
            right: 30,
            bottom: insets.bottom + 20,
        }

        const button: StyleProp<ViewStyle> = {
            width: fabSize,
            height: fabSize,
            borderRadius: fabSize / 2,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            backgroundColor: colors.primary,
        }

        const iconSize = Math.max(fabSize * 0.5, 24);

        return {
            position,
            button,
            iconSize,
        }
    }, [insets.bottom, colors.primary]);
}