import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type HomeView = "camera-view" | "albums-view";
export type ThemePreference = "light" | "dark" | "system";

type UserPreferencesState = {
    homeView: HomeView;
    theme: ThemePreference;
    _hasHydrated: boolean;
    setHomeView: (view: HomeView) => void;
    setTheme: (theme: ThemePreference) => void;
    setHasHydrated: (hasHydrated: boolean) => void;
};

const useUserPreferencesStore = create<UserPreferencesState>()(
    persist(
        (set) => ({
            homeView: "albums-view",
            theme: "system",
            _hasHydrated: false,
            setHomeView: (view) => set({ homeView: view }),
            setTheme: (theme) => set({ theme }),
            setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
        }),
        {
            name: "user-shared-preferences",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                homeView: state.homeView,
                theme: state.theme,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

type UserSharedPreferencesContextType = {
    homeView: HomeView;
    theme: ThemePreference;
    isHydrated: boolean;
    setHomeView: (view: HomeView) => void;
    setTheme: (theme: ThemePreference) => void;
};

const UserSharedPreferencesContext = createContext<UserSharedPreferencesContextType | null>(null);

export function UserSharedPreferencesProvider({ children }: { children: React.ReactNode }) {
    const homeView = useUserPreferencesStore((state) => state.homeView);
    const theme = useUserPreferencesStore((state) => state.theme);
    const isHydrated = useUserPreferencesStore((state) => state._hasHydrated);
    const setHomeView = useUserPreferencesStore((state) => state.setHomeView);
    const setTheme = useUserPreferencesStore((state) => state.setTheme);

    const [ready, setReady] = useState(isHydrated);

    useEffect(() => {
        const unsubscribe = useUserPreferencesStore.persist.onFinishHydration(() => {
            setReady(true);
        });

        if (useUserPreferencesStore.persist.hasHydrated()) {
            setReady(true);
        }

        return unsubscribe;
    }, []);

    return (
        <UserSharedPreferencesContext.Provider
            value={{
                homeView,
                theme,
                isHydrated: ready,
                setHomeView,
                setTheme,
            }}
        >
            {children}
        </UserSharedPreferencesContext.Provider>
    );
}

export function useUserSharedPreferences() {
    const context = useContext(UserSharedPreferencesContext);
    if (!context) {
        throw new Error("useUserSharedPreferences must be used within a UserSharedPreferencesProvider");
    }
    return context;
}
