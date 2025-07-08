import { ASSETS } from "@/constants/assets";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import useFirebaseToken from "@/hooks/useFirebaseToken";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useCallback, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

function AuthLayout() {
    const { firebaseUser, isLoading } = useAuth();

    if (isLoading) return null;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* <Stack.Protected guard={firebaseUser ? true : false}>
                <Stack.Screen name="(app)" />
            </Stack.Protected>
            <Stack.Protected guard={!firebaseUser }>
                <Stack.Screen name="(auth)" />
            </Stack.Protected> */}
            {firebaseUser ? (
                <Stack.Screen name="(app)" />
            ) : (
                <Stack.Screen name="(auth)" />
            )}
        </Stack>
    );

}

export default function RootLayout() {
    // const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
    //     unsavedChangesWarning: false,
    // });
    const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
    const convex = useMemo(() => new ConvexReactClient(convexUrl, {
        unsavedChangesWarning: false,
    }), [convexUrl]);

    console.log(convexUrl);



    const [fontsLoaded] = useFonts(ASSETS.fonts);
    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded) await SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <AuthProvider>
            <ConvexProviderWithAuth client={convex} useAuth={useFirebaseToken}>
                <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
                    <AuthLayout />
                </GestureHandlerRootView>
            </ConvexProviderWithAuth>
        </AuthProvider>
    );
}
