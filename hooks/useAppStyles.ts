import { useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { StyleProp, useColorScheme, ViewStyle } from "react-native";

export interface ColorScheme {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    onBackground: string;
    text: string;
    caption: string;
    border: string;
    surface: string;
    danger: string;
}

export const lightColors: ColorScheme = {
    primary: '#09ADA9',
    secondary: '#FDFDFD',
    accent: '#F5BAB3',
    background: '#F8F9FA',
    onBackground: '#333333',
    text: '#271919FF',
    caption: '#6C757D',
    border: '#D9DDE0',
    surface: '#FFFFFF',
    danger: '#FF3B30',
};

export const darkColors: ColorScheme = {
    primary: '#09ADA9',
    secondary: '#FDFDFD',
    accent: '#F5BAB3',
    background: '#FFFFFF',
    onBackground: '#333333',
    text: '#333333',
    caption: '#6C757D',
    border: '#D9DDE0',
    surface: '#FFFFFF',
    danger: '#FF3B30',
}

interface UseAppStylesResult {
    colorScheme: ColorScheme;
    textInput: StyleProp<ViewStyle>;
    fabPosition: StyleProp<ViewStyle>;
    fabButton: StyleProp<ViewStyle>;
}

export default function useAppStyles(): UseAppStylesResult {
    const theme = useTheme();
    const colorScheme = useColorScheme();

    const [colors, setColors] = useState<ColorScheme>();

    useEffect(() => {
        setColors(colorScheme === 'dark' ? darkColors : lightColors);
    }, [colorScheme]);

    const textInput = {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: theme.colors.text,
    }

    const fabPosition = {
        position: 'absolute' as const,
        right: 30,
        bottom: 50,
    }

    const fabButton = {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    }

    return {
        colorScheme: colors ?? lightColors,
        textInput,
        fabPosition,
        fabButton,
    }
}