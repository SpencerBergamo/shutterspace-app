import { ASSETS } from "@/constants/assets";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { ThemeProvider } from "@/context/ThemeContext";
import useFirebaseToken from "@/hooks/useFirebaseToken";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useFonts } from "expo-font";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useCallback, useEffect } from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

function AuthLayout() {
  const { firebaseUser, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAppGroup = segments[0] === '(app)';

    if (firebaseUser && !inAppGroup) {
      router.replace('/(app)/home');
    }
  }, [firebaseUser, segments]);

  if (isLoading) return null;

  return <>
    <Stack >
      {firebaseUser ? (
        <ProfileProvider firebaseUser={firebaseUser}>
          <Stack.Screen name='(app)' options={{ headerShown: false }} />
        </ProfileProvider>
      ) : (
        <Stack.Screen name='(auth)' options={{ headerShown: false }} />
      )}
    </Stack>
  </>;
}

export default function RootLayout() {

  const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
    unsavedChangesWarning: false,
  });

  const [fontsLoaded] = useFonts(ASSETS.fonts);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useFirebaseToken}>
        <ThemeProvider>
          <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <AuthLayout />
          </GestureHandlerRootView>
        </ThemeProvider>
      </ConvexProviderWithAuth>
    </AuthProvider>
  );
}
