import * as Haptics from 'expo-haptics';
import { createContext, useContext, useState } from "react";

interface HapticsContextType {
    isEnabled: boolean;
    toggleHaptics: () => void;
    triggerHaptic: (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

const HapticsContext = createContext<HapticsContextType | undefined>(undefined);

export function HapticsProvider({ children }: { children: React.ReactNode }) {
    const [isEnabled, setIsEnabled] = useState(true);

    const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
        if (!isEnabled) return;

        switch (type) {
            case 'light':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                break;
            case 'medium':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                break;
            case 'heavy':
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                break;
            case 'success':
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                break;
            case 'warning':
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                break;
            case 'error':
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                break;
        }
    }

    return (
        <HapticsContext.Provider value={{
            isEnabled,
            toggleHaptics: () => setIsEnabled(prev => !prev),
            triggerHaptic
        }} >
            {children}
        </HapticsContext.Provider>
    );
}

export const useHaptics = () => {
    const context = useContext(HapticsContext);
    if (!context) {
        throw new Error('useHaptics must be used within a HapticsProvider');
    }
    return context;
}