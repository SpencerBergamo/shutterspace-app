import { ASSETS } from "@/constants/assets";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

function AuthLayout() {
    const { firebaseUser, isLoading } = useAuth();

    if (isLoading) return null;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            {firebaseUser ? (
                <Stack.Screen name="(app)" />
            ) : (
                <Stack.Screen name="(auth)" />
            )}
        </Stack>
    );
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts(ASSETS.fonts);
    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded) await SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <ThemeProvider>
            <AuthProvider>
                <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
                    <AuthLayout />
                </GestureHandlerRootView>
            </AuthProvider>
        </ThemeProvider>
    );
}
