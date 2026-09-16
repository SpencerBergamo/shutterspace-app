import { useAppTheme } from "@/src/context/AppThemeContext";
import { Stack } from "expo-router/stack";

export default function SettingsLayout() {
    const { colors } = useAppTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerTransparent: true,
                headerShadowVisible: false,
                headerBackButtonDisplayMode: "minimal",
                headerTitleStyle: { color: colors.text },
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: "Settings",
                    headerLargeTitleEnabled: false,
                }}
            />
            <Stack.Screen
                name="edit-profile"
                options={{
                    title: "Edit Profile",
                }}
            />
            <Stack.Screen
                name="contact-us"
                options={{
                    title: "Contact Us",
                }}
            />
        </Stack>
    );
}
