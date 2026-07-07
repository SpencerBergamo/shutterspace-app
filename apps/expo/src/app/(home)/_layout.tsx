import { useAppTheme } from "@/src/context/AppThemeContext";
import { api } from "@shutterspace/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DarkTheme, ThemeProvider } from "expo-router/react-navigation";
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

    if (profile === null) router.replace("/welcome");

    return (
        <ThemeProvider value={DarkTheme}>
            <NativeTabs hidden minimizeBehavior="onScrollDown">
                <NativeTabs.Trigger name="(settings)" disableTransparentOnScrollEdge>
                    <NativeTabs.Trigger.Label hidden />
                </NativeTabs.Trigger>
                <NativeTabs.Trigger name="(index)" disableTransparentOnScrollEdge>
                    <NativeTabs.Trigger.Label hidden />
                </NativeTabs.Trigger>
                <NativeTabs.Trigger name="(albums)">
                    <NativeTabs.Trigger.Label hidden />
                </NativeTabs.Trigger>
            </NativeTabs>
        </ThemeProvider>
    );
}
