/**
 * @fileoverview Root Layout
 * @author Spencer Bergamo
 * @created 2025-08-04
 * 
 * Documentation References:
 * - ConvexProviderWithAuth: https://docs.convex.dev/api/modules/react#convexproviderwithauth
 */

import { ASSETS } from "@/constants/assets";
import { AuthProvider } from "@/context/AuthContext";
import useFirebaseAuth from "@/hooks/useFirebaseToken";
// import useFirebaseToken from "@/hooks/useFirebaseToken";
import { ConvexProviderWithAuth, ConvexReactClient, useConvexAuth } from "convex/react";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

function AppLayout() {
    const { isLoading, isAuthenticated } = useConvexAuth();

    if (isLoading) return null;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={isAuthenticated}>
                <Stack.Screen name="(home)" />
            </Stack.Protected>

            <Stack.Protected guard={!isAuthenticated}>
                <Stack.Screen name="welcome" />
                <Stack.Screen name="sign-in" />
                <Stack.Screen name="sign-up" />
            </Stack.Protected>
        </Stack>
    );
}

export default function RootLayout() {

    const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL! as string, {
        unsavedChangesWarning: false,
    });

    const [fontsLoaded, fontError] = useFonts(ASSETS.fonts);
    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded) await SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded && !fontError) return null;

    return (
        <AuthProvider>
            <ConvexProviderWithAuth client={convex} useAuth={useFirebaseAuth}>
                <SafeAreaProvider>
                    <KeyboardProvider>
                        <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
                            <AppLayout />
                        </GestureHandlerRootView>
                    </KeyboardProvider>
                </SafeAreaProvider>
            </ConvexProviderWithAuth>
        </AuthProvider>
    );
}
