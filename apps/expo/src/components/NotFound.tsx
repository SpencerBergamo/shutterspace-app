import { useAppTheme } from "@/src/context/AppThemeContext";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function NotFoundScreen() {
    const { colors } = useAppTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.emoji]}>🤔</Text>
            <Text style={[styles.title, { color: colors.text }]}>Page Not Found</Text>
            <Text style={[styles.description, { color: colors.text }]}>
                Sorry, we couldn't find the page you're looking for.
            </Text>

            <TouchableOpacity
                onPress={() => router.replace("/")}
                style={[styles.button, { backgroundColor: colors.primary }]}
            >
                <Text style={styles.buttonText}>Go Home</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        textAlign: "center",
        opacity: 0.7,
        marginBottom: 32,
    },
    button: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
});
