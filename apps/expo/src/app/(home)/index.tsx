import { useUserSharedPreferences } from "@/src/context/UserSharedPreferences";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function HomeIndex() {
    const { homeView, isHydrated } = useUserSharedPreferences();

    if (!isHydrated) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <Redirect href={homeView === "camera-view" ? "/camera-view" : "/albums-view"} />;
}
