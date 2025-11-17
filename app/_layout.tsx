/**
 * @fileoverview Root Layout
 * @author Spencer Bergamo
 * @created 2025-08-04
 * 
 * Documentation References:
 * - ConvexProviderWithAuth: https://docs.convex.dev/api/modules/react#convexproviderwithauth
 */

import { ASSETS } from "@/constants/assets";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import useFirebaseAuth from "@/hooks/useFirebaseToken";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { ConvexProviderWithAuth, ConvexReactClient, useConvexAuth } from "convex/react";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useCallback, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

function AppLayout() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const { theme } = useTheme();

    if (isLoading) return null;

    return (
        <Stack screenOptions={{
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            headerStyle: {
                backgroundColor: theme.colors.background,
            },
        }}>
            <Stack.Protected guard={isAuthenticated} >
                <Stack.Screen name="(home)" options={{ headerShown: false }} />
            </Stack.Protected>

            <Stack.Protected guard={!isAuthenticated}>
                <Stack.Screen name="welcome" options={{ headerShown: false }} />
                <Stack.Screen name="sign-in" options={{
                    headerTitle: ''
                }} />
                <Stack.Screen name="sign-up" options={{
                    headerTitle: '',
                }} />
            </Stack.Protected>

            <Stack.Screen name="invite/[code]" options={{}} />
        </Stack>
    );
}

export default function RootLayout() {

    const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL! as string, {
        unsavedChangesWarning: false,
    });

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: "772964121786-k7bm9fjhhac6mh5koi0nojd0tf7k3kaf.apps.googleusercontent.com",
            iosClientId: "772964121786-gdf4k494q4kq0882o9clht1hrfhaih15.apps.googleusercontent.com",
            offlineAccess: true,
        })
    }, []);

    const [fontsLoaded, fontError] = useFonts(ASSETS.fonts);
    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded) await SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded && !fontError) return null;

    return (
        <ConvexProviderWithAuth client={convex} useAuth={useFirebaseAuth}>
            <ThemeProvider>
                <SafeAreaProvider>
                    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
                        <KeyboardProvider>
                            <BottomSheetModalProvider>
                                <AppLayout />
                            </BottomSheetModalProvider>
                        </KeyboardProvider>
                    </GestureHandlerRootView>
                </SafeAreaProvider>
            </ThemeProvider>
        </ConvexProviderWithAuth>
    );
}
