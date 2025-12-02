import { AppThemeColors, Light } from "@/constants/styles";
import { createContext, useContext } from "react";

interface AppThemeContextType {
    colors: AppThemeColors;
}

const AppThemeContext = createContext<AppThemeContextType | null>(null);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
    // const [colors, setColors] = useState<AppThemeColors>(Light);
    const colors = Light as AppThemeColors;

    return (
        <AppThemeContext.Provider value={{ colors }}>
            {children}
        </AppThemeContext.Provider>
    )
}

export function useAppTheme() {
    const context = useContext(AppThemeContext);
    if (!context) {
        throw new Error('useAppTheme must be used within a AppThemeProvider');
    }
    return context;
}