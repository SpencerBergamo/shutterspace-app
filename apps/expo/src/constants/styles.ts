import type { TextStyle, ViewStyle } from "react-native";

export interface AppThemeColors {
    primary: string;
    secondary: string;
    tertiary: string;

    background: string;
    onBackground: string;
    text: string;
    caption: string;

    border: string;
    shadow: string;
    danger: string;
    surface: string;

    grey1: string;
    grey2: string;
    grey3: string;
}

export const Light: AppThemeColors = {
    primary: "#09ADA9",
    secondary: "#F57F20",
    tertiary: "#D9117F",

    background: "#F8F9FA",
    onBackground: "#333333",
    text: "#271919FF",
    caption: "#6C757D",

    border: "#D9DDE0",
    shadow: "#000000",
    danger: "#FF3B30",
    surface: "#FFFFFF",

    grey1: "#6C757D",
    grey2: "#D9DDE0",
    grey3: "#F8F9FA",
};

export const Dark: AppThemeColors = {
    primary: "#09ADA9",
    secondary: "#F57F20",
    tertiary: "#D9117F",

    background: "#0F1112",
    onBackground: "#E8E8E8",
    text: "#F5F5F5",
    caption: "#9BA1A6",

    border: "#2A2F33",
    shadow: "#000000",
    danger: "#FF453A",
    surface: "#1C1F21",

    grey1: "#9BA1A6",
    grey2: "#2A2F33",
    grey3: "#16191A",
};

export const MAX_WIDTH = 500;

export const TextInputStyles = {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
} as const;

export interface AppTextStyles {
    brand: TextStyle;
    title: TextStyle;
    subtitle: TextStyle;
    body: TextStyle;
    bodyMedium: TextStyle;
    caption: TextStyle;
    sectionLabel: TextStyle;
    button: TextStyle;
    buttonOnPrimary: TextStyle;
    link: TextStyle;
    error: TextStyle;
}

export interface AppContainerStyles {
    screen: ViewStyle;
    content: ViewStyle;
    centered: ViewStyle;
    card: ViewStyle;
    surface: ViewStyle;
    row: ViewStyle;
    separator: ViewStyle;
}

export function createTextStyles(colors: AppThemeColors): AppTextStyles {
    return {
        brand: {
            fontFamily: "SansitaOne",
            fontSize: 28,
            color: colors.text,
        },
        title: {
            fontSize: 24,
            fontWeight: "700",
            color: colors.text,
        },
        subtitle: {
            fontSize: 16,
            fontWeight: "400",
            color: colors.caption,
        },
        body: {
            fontSize: 16,
            fontWeight: "400",
            color: colors.text,
        },
        bodyMedium: {
            fontSize: 16,
            fontWeight: "500",
            color: colors.text,
        },
        caption: {
            fontSize: 13,
            fontWeight: "400",
            color: colors.caption,
        },
        sectionLabel: {
            fontSize: 13,
            fontWeight: "500",
            color: colors.caption,
        },
        button: {
            fontSize: 17,
            fontWeight: "600",
            color: colors.text,
            textAlign: "center",
        },
        buttonOnPrimary: {
            fontSize: 17,
            fontWeight: "600",
            color: "#FFFFFF",
            textAlign: "center",
        },
        link: {
            fontSize: 14,
            fontWeight: "600",
            color: colors.primary,
        },
        error: {
            fontSize: 12,
            fontWeight: "400",
            color: colors.danger,
        },
    };
}

export function createContainerStyles(colors: AppThemeColors): AppContainerStyles {
    return {
        screen: {
            flex: 1,
            backgroundColor: colors.background,
        },
        content: {
            width: "100%",
            maxWidth: MAX_WIDTH,
            alignSelf: "center",
            paddingHorizontal: 20,
        },
        centered: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.background,
        },
        card: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 16,
            borderCurve: "continuous",
            padding: 16,
        },
        surface: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderCurve: "continuous",
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
        },
        separator: {
            height: 1,
            backgroundColor: colors.border,
            width: "100%",
        },
    };
}

export function createTextInputStyles(colors: AppThemeColors): TextStyle {
    return {
        ...TextInputStyles,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        color: colors.text,
    };
}
