import {
    AppContainerStyles,
    AppTextStyles,
    AppThemeColors,
    createContainerStyles,
    createTextInputStyles,
    createTextStyles,
    Dark,
    Light,
} from "@/src/constants/styles";
import { createContext, useContext } from "react";
import { TextStyle, useColorScheme } from "react-native";

type ColorScheme = "light" | "dark";

interface AppThemeContextType {
    colorScheme: ColorScheme;
    isDark: boolean;
    colors: AppThemeColors;
    textStyles: AppTextStyles;
    containerStyles: AppContainerStyles;
    textInputStyles: TextStyle;
}

const AppThemeContext = createContext<AppThemeContextType | null>(null);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const colorScheme: ColorScheme = systemScheme === "dark" ? "dark" : "light";
    const isDark = colorScheme === "dark";
    const colors = isDark ? Dark : Light;

    const value: AppThemeContextType = {
        colorScheme,
        isDark,
        colors,
        textStyles: createTextStyles(colors),
        containerStyles: createContainerStyles(colors),
        textInputStyles: createTextInputStyles(colors),
    };

    return (
        <AppThemeContext.Provider value={value}>
            {children}
        </AppThemeContext.Provider>
    );
};

export function useAppTheme() {
    const context = useContext(AppThemeContext);
    if (!context) {
        throw new Error("useAppTheme must be used within a AppThemeProvider");
    }
    return context;
}
