import PlatformIcon from "@/src/components/PlatformIcon/platform-icon";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { router, Stack } from "expo-router";
import { Platform, TouchableOpacity } from "react-native";

export const unstable_settings = {
    initialRouteName: "index",
    settings: {
        initialRouteName: "settings",
    },
    albums: {
        initialRouteName: "albums",
    },
};

export default function HomeTabStackLayout() {
    const { colors } = useAppTheme();

    return (
        <Stack
            screenOptions={{
                headerBackButtonDisplayMode: "minimal",
                headerShadowVisible: false,
                headerTransparent: true,
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShown: true,
                    headerTitle: "",
                    headerLeft:
                        Platform.OS === "android"
                            ? () => (
                                  <TouchableOpacity onPress={() => router.navigate("/(settings)/settings")}>
                                      <PlatformIcon name="profile" size={28} color="white" />
                                  </TouchableOpacity>
                              )
                            : undefined,
                    headerRight:
                        Platform.OS === "android"
                            ? () => (
                                  <TouchableOpacity
                                      style={{ paddingHorizontal: 12 }}
                                      onPress={() => router.navigate("/(albums)/albums")}
                                  >
                                      <PlatformIcon name="grid2x2" size={28} color="white" />
                                  </TouchableOpacity>
                              )
                            : undefined,
                }}
            />

            <Stack.Screen
                name="albums"
                options={{
                    headerTitle: "Albums",
                    headerLargeTitleEnabled: true,
                    headerTransparent: false,
                }}
            />

            <Stack.Screen
                name="settings"
                options={{
                    headerTitle: "Settings",
                    headerTransparent: false,
                    headerBackVisible: false,
                    headerRight: () => (
                        <TouchableOpacity onPress={() => router.navigate("/(index)")}>
                            <PlatformIcon name="camera" size={28} color={colors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <Stack.Screen
                name="profile/edit"
                options={{
                    headerTitle: "Edit Profile",
                    headerBackButtonDisplayMode: "minimal",
                    headerTransparent: false,
                }}
            />

            <Stack.Screen
                name="shareId/[code]"
                options={{
                    headerShown: false,
                    presentation: "transparentModal",
                    animation: "fade",
                }}
            />

            <Stack.Screen
                name="new-album"
                options={{
                    presentation: "modal",
                }}
            />

            <Stack.Screen
                name="album/[albumId]/index"
                options={{
                    headerShown: true,
                    headerTitle: "",
                }}
            />

            <Stack.Screen
                name="album/[albumId]/settings"
                options={{
                    headerShown: true,
                    headerTitle: "Album Settings",
                }}
            />

            <Stack.Screen
                name="album/[albumId]/qr-code"
                options={{
                    headerShown: true,
                    headerTitle: "",
                    presentation: "modal",
                }}
            />

            <Stack.Screen
                name="viewer/[index]/index"
                options={{
                    headerShown: true,
                    animation: "fade",
                    animationDuration: 200,
                }}
            />

            <Stack.Screen name="friends" />

            <Stack.Screen
                name="share-profile"
                options={{
                    presentation: "modal",
                }}
            />

            <Stack.Screen
                name="contact-us"
                options={{
                    headerTitle: "Contact Us",
                }}
            />

            <Stack.Screen
                name="invite/[code]"
                options={{
                    headerTitle: "",
                    headerTransparent: true,
                    headerTintColor: "white",
                    headerStyle: {
                        backgroundColor: "transparent",
                    },
                }}
            />
        </Stack>
    );
}
