import PlatformIcon from "@/src/components/PlatformIcon";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { HomeView, useUserSharedPreferences } from "@/src/context/UserSharedPreferences";
import { HeaderButton } from "@react-navigation/elements";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HomeNavBarProps = {
    variant: HomeView;
    overlay?: boolean;
};

export default function HomeNavBar({ variant, overlay = false }: HomeNavBarProps) {
    const { colors } = useAppTheme();
    const { setHomeView } = useUserSharedPreferences();
    const insets = useSafeAreaInsets();

    const iconColor = overlay ? "#FFFFFF" : colors.text;

    const navigateToView = (view: HomeView) => {
        setHomeView(view);
        router.replace(`/${view}`);
    };

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop: insets.top + 8,
                    backgroundColor: overlay ? "transparent" : colors.background,
                },
            ]}
        >
            <HeaderButton onPress={() => router.push("/settings")}>
                <PlatformIcon name="profile" size={28} color={iconColor} />
            </HeaderButton>

            <View style={styles.rightActions}>
                <HeaderButton onPress={() => {}}>
                    <PlatformIcon name="notifications" size={28} color={iconColor} />
                </HeaderButton>

                {variant === "camera-view" ? (
                    <HeaderButton onPress={() => navigateToView("albums-view")}>
                        <PlatformIcon name="gallery" size={28} color={iconColor} />
                    </HeaderButton>
                ) : (
                    <HeaderButton onPress={() => navigateToView("camera-view")}>
                        <PlatformIcon name="camera" size={28} color={iconColor} />
                    </HeaderButton>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    rightActions: {
        flexDirection: "row",
        alignItems: "center",
    },
});
