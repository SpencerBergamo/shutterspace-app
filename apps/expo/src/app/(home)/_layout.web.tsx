import { useAppTheme } from "@/src/context/AppThemeContext";
import { api } from "@shutterspace/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { router, Slot } from "expo-router";
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

    return <Slot />;
}
