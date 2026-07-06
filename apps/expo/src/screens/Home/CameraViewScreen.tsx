import HomeNavBar from "@/src/screens/Home/components/HomeNavBar";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { CameraView } from "expo-camera";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

const isSimulator = !Constants.isDevice;

export function CameraViewScreen() {
    const { colors } = useAppTheme();
    const enableCamera = !isSimulator;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {enableCamera ? (
                <CameraView style={styles.camera} facing="back" />
            ) : (
                <View style={[styles.placeholder, { backgroundColor: colors.grey2 }]}>
                    <Text style={[styles.placeholderTitle, { color: colors.text }]}>
                        Camera Preview Unavailable
                    </Text>
                    <Text style={[styles.placeholderSubtitle, { color: colors.caption }]}>
                        The camera is disabled on the simulator. Run on a physical device to preview the camera.
                    </Text>
                </View>
            )}

            <View style={styles.navOverlay} pointerEvents="box-none">
                <HomeNavBar variant="camera-view" overlay={enableCamera} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
    },
    camera: {
        flex: 1,
    },
    placeholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    placeholderTitle: {
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 8,
    },
    placeholderSubtitle: {
        fontSize: 15,
        textAlign: "center",
        lineHeight: 22,
    },
    navOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
    },
});
