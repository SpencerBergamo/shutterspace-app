import { useAppTheme } from "@/src/context/AppThemeContext";
import { api } from "@shutterspace/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { router } from "expo-router";
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

    if (profile === null) {
        router.replace("/welcome");
        return null;
    }

    return (
        <ThemeProvider value={DarkTheme}>
            <Stack screenOptions={{
                headerShown: true,
                headerTransparent: true,
                headerShadowVisible: false,
                headerLargeTitleEnabled: true,
            }}>
                <Stack.Screen name="index" options={{
                    headerTitle: "",
                    headerTransparent: true,
                    headerShadowVisible: false,
                }} />
                <Stack.Screen name="settings" options={{
                    headerTitle: "Settings",
                    animation: "ios_from_left",
                    headerBackVisible: false,
                }} />
                <Stack.Screen name="albums"
                    options={{
                        animation: "ios_from_right",
                        headerBackButtonDisplayMode: "minimal",
                    }}
                />
                <Stack.Screen
                    name="album/[id]"
                    options={{
                        headerLargeTitleEnabled: false,
                        title: "Album",
                    }}
                />

                <Stack.Screen
                    name="profile/edit"
                    options={{
                        animation: "slide_from_right",
                        gestureDirection: "horizontal",

                    }}
                />

                <Stack.Screen
                    name="friends"
                    options={{
                        headerShown: true,
                        headerTitle: "Friends",
                        headerBackButtonDisplayMode: "minimal",
                        headerShadowVisible: false,
                    }}
                />
                <Stack.Screen
                    name="contact-us"
                    options={{
                        headerShown: true,
                        headerTitle: "Contact Us",
                        headerBackButtonDisplayMode: "minimal",
                        headerShadowVisible: false,
                    }}
                />
            </Stack>
        </ThemeProvider>
    );
}
