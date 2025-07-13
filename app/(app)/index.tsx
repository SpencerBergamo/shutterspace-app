import { useAuth } from "@/context/AuthContext";
import { useThemeStyles } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


export default function Home() {
    const { firebaseUser } = useAuth();
    const themeStyles = useThemeStyles();

    const handleSubscriptionPress = () => {
        // Navigate to subscription page
        router.push('/subscription');
    };

    return (
        <View style={[styles.container, { backgroundColor: themeStyles.colors.background.main }]}>
            <Text style={[styles.title, { color: themeStyles.colors.text.primary }]}>
                Welcome to ShutterSpace
            </Text>
            <Text style={[styles.userEmail, { color: themeStyles.colors.text.secondary }]}>
                {firebaseUser?.email}
            </Text>
            
            <View style={styles.actionsContainer}>
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: themeStyles.colors.primary }]}
                    onPress={handleSubscriptionPress}
                >
                    <Ionicons name="diamond-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>View Subscription Plans</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[
                        styles.actionButton, 
                        styles.secondaryButton,
                        { 
                            backgroundColor: 'transparent',
                            borderColor: themeStyles.colors.border.light 
                        }
                    ]}
                >
                    <Ionicons name="camera-outline" size={24} color={themeStyles.colors.text.primary} />
                    <Text style={[styles.secondaryButtonText, { color: themeStyles.colors.text.primary }]}>
                        Start Taking Photos
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    userEmail: {
        fontSize: 16,
        marginBottom: 40,
        textAlign: "center",
    },
    actionsContainer: {
        width: "100%",
        gap: 16,
        maxWidth: 300,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    secondaryButton: {
        borderWidth: 1,
    },
    actionButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
});