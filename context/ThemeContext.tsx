import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';


type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (mode: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const CACHE_KEY = '@theme_prefs';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemTheme = useColorScheme();
    const [theme, setTheme] = useState<Theme>('system');

    useEffect(() => {
        AsyncStorage.getItem(CACHE_KEY)
            .then(saved => saved && setTheme(saved as Theme));
    }, []);

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        AsyncStorage.setItem(CACHE_KEY, newTheme);
    };

    const isDark = theme === 'system' ? systemTheme === 'dark' : theme === 'dark';

    return (
        <ThemeContext.Provider
            value={{ theme, setTheme: handleThemeChange, isDark }}>
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
