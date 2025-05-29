import { useTheme } from '../context/ThemeContext';

export const useThemeStyles = () => {
    const { isDark } = useTheme();

    return {
        colors: {
            primary: '#007AFF',
            background: {
                main: isDark ? '#000000' : '#F2F1F6',
                card: isDark ? '#1C1C1E' : '#FFFFFF',
                header: isDark ? '#000000' : '#F2F1F6',
            },
            text: {
                primary: isDark ? '#FFFFFF' : '#000000',
                secondary: isDark ? '#EBEBF5' : '#666666',
                tertiary: isDark ? '#8E8E93' : '#999999',
            },
            border: {
                light: isDark ? '#38383A' : '#E5E5E5',
            },
            status: {
                error: '#FF3B30',
                success: '#34C759',
                warning: '#FF9500',
            }
        },
        spacing: {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 20,
            xl: 24,
        },
        borderRadius: {
            sm: 4,
            md: 8,
            lg: 12,
            xl: 16,
            round: 9999,
        }
    } as const;
}