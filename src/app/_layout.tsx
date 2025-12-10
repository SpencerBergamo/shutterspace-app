/**
 * @fileoverview Root Layout
 * @author Spencer Bergamo
 * @created 2025-08-04
 * 
 * Documentation References:
 * - ConvexProviderWithAuth: https://docs.convex.dev/api/modules/react#convexproviderwithauth
 */

import { ASSETS } from "@/src/constants/assets";
import { AppThemeProvider, useAppTheme } from "@/src/context/AppThemeContext";
import useFirebaseAuth from "@/src/hooks/useFirebaseToken";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { ConvexProviderWithAuth, ConvexReactClient, useConvexAuth } from "convex/react";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

function AppLayout({ onAuthReady }: { onAuthReady: () => void }) {
    const { colors } = useAppTheme();
    const { isLoading, isAuthenticated } = useConvexAuth();

    useEffect(() => {
        if (!isLoading) {
            onAuthReady();
        }
    }, [isLoading, onAuthReady]);

    if (isLoading) return null;

    return (
        <Stack screenOptions={{
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            headerTintColor: colors.grey1,
            headerStyle: {
                backgroundColor: colors.background,
            }
        }}>
            <Stack.Protected guard={isAuthenticated} >
                <Stack.Screen name="(home)" options={{ headerShown: false }} />
            </Stack.Protected>

            <Stack.Protected guard={!isAuthenticated} >
                <Stack.Screen name="welcome" options={{ headerShown: false }} />
                <Stack.Screen name="sign-in" options={{
                    headerTitle: ''
                }} />
                <Stack.Screen name="sign-up" options={{
                    headerTitle: '',
                }} />
            </Stack.Protected>

            <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
        </Stack>
    );
}

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL! as string, {
    unsavedChangesWarning: false,
});

export default function RootLayout() {

    const [fontsLoaded, fontError] = useFonts(ASSETS.fonts);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: "772964121786-k7bm9fjhhac6mh5koi0nojd0tf7k3kaf.apps.googleusercontent.com",
            iosClientId: "772964121786-gdf4k494q4kq0882o9clht1hrfhaih15.apps.googleusercontent.com",
            offlineAccess: true,
        })
    }, []);

    useEffect(() => {
        if (fontsLoaded && authReady) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, authReady]);

    if (!fontsLoaded && !fontError) return null;

    return (
        <ConvexProviderWithAuth client={convex} useAuth={useFirebaseAuth}>
            <SafeAreaProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <KeyboardProvider>
                        <AppThemeProvider>
                            <ActionSheetProvider>
                                <BottomSheetModalProvider>
                                    <AppLayout onAuthReady={() => setAuthReady(true)} />
                                </BottomSheetModalProvider>
                            </ActionSheetProvider>
                        </AppThemeProvider>
                    </KeyboardProvider>
                </GestureHandlerRootView>
            </SafeAreaProvider>
        </ConvexProviderWithAuth>
    );
}
