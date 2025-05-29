import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { ThemeProvider } from "@/context/ThemeContext";
import useConvexAuthFromFirebase from "@/hooks/useConvexAuthFromFirebase";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useFonts } from "expo-font";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useCallback, useEffect } from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAppGroup = segments[0] === '(app)';

    if (user && !inAppGroup) {
      router.replace("/(app)/home");
    }
  }, [user, segments]);

  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name='(app)' options={{ headerShown: false }} />
      <Stack.Screen name='(auth)' options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
    unsavedChangesWarning: false,
  });

  const [fontsLoaded] = useFonts({
    'SansitaOne': require("../assets/fonts/SansitaOne.ttf")
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useConvexAuthFromFirebase}>
        <ThemeProvider>
          <ProfileProvider>
            <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </ProfileProvider>
        </ThemeProvider>
      </ConvexProviderWithAuth>
    </AuthProvider>
  );
}
