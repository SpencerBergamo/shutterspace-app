import { ColorScheme, lightColors } from '@/constants/colors';
import { LightStyles } from '@/constants/lightStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

type Mode = 'light' | 'dark' | 'system';

export interface Theme {
    mode: Mode;
    colors: ColorScheme;
    styles: typeof LightStyles;
}

interface ThemeContextType {
    mode: Mode;
    handleThemeChange: (mode: Mode) => void;
    theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemTheme = useColorScheme();

    const [mode, setMode] = useState<Mode>('system');

    const KEY = process.env.THEME_PREFS_STORAGE_KEY!;

    const theme: Theme = useMemo(() => {
        const effectiveTheme = mode === 'system' ? systemTheme : mode;

        return {
            mode: effectiveTheme || 'light',
            colors: effectiveTheme === 'dark' ? lightColors : lightColors,
            styles: LightStyles,
        }
    }, [mode, systemTheme]);

    useEffect(() => {
        AsyncStorage.getItem(KEY)
            .then(saved => saved && setMode(saved as Mode));
    }, []);

    const handleThemeChange = (mode: Mode) => {
        setMode(mode);
        AsyncStorage.setItem(process.env.KEY, mode);
    };

    const contextValue: ThemeContextType = {
        mode,
        handleThemeChange,
        theme,
    }

    return (
        <ThemeContext.Provider
            value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};