import { useAppTheme } from "@/src/context/AppThemeContext";
import { api } from "@shutterspace/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Redirect } from "expo-router";
import { DarkTheme, ThemeProvider } from "expo-router/react-navigation";
import { Stack } from "expo-router/stack";
import { ActivityIndicator, View } from "react-native";

export default function HomeLayout() {
    const { colors } = useAppTheme();
    const profile = useQuery(api.profile.getUserProfile);

    if (profile === undefined) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.text} />
            </View>
        );
    }

    if (profile === null) return <Redirect href="/welcome" />;

    return (
        <ThemeProvider value={DarkTheme}>
            <Stack screenOptions={{
                headerShown: true,
                headerTransparent: true,
                headerShadowVisible: false,
                headerLargeTitleEnabled: true,
                headerBackButtonDisplayMode: "minimal",
            }}>
                <Stack.Screen name="index" options={{
                    headerTitle: "",
                    headerTransparent: true,
                    headerShadowVisible: false,
                    headerLargeTitleEnabled: false,
                    contentStyle: { flex: 1, backgroundColor: "#000" },
                }} />
                <Stack.Screen
                    name="settings"
                    options={{
                        presentation: "modal",
                        headerShown: false,
                    }}
                />
                <Stack.Screen name="albums"
                    options={{
                        animation: "ios_from_right",
                        headerBackButtonDisplayMode: "minimal",
                    }}
                />
                {/* Nested album Stack owns its own headers; hide this parent chrome. */}
                <Stack.Screen
                    name="album/[id]"
                    options={{
                        headerShown: false,
                    }}
                />

                <Stack.Screen name="new-album" options={{
                    headerTitle: "New Album",
                    headerLargeTitleEnabled: false,
                    presentation: "modal",
                }} />
            </Stack>
        </ThemeProvider>
    );
}
