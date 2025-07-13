import { useAuth } from "@/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";

export default function JoinAlbum() {
    const { albumId } = useLocalSearchParams<{ albumId: string }>();
    const { firebaseUser } = useAuth();
    const router = useRouter();
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        // If user is not authenticated, redirect to sign-in
        if (!firebaseUser) {
            Alert.alert(
                "Sign In Required",
                "You need to sign in to join an album.",
                [
                    {
                        text: "Sign In",
                        onPress: () => router.replace("/(auth)/sign-in"),
                    },
                    {
                        text: "Cancel",
                        style: "cancel",
                        onPress: () => router.replace("/"),
                    },
                ]
            );
        }
    }, [firebaseUser, router]);

    const handleJoinAlbum = async () => {
        if (!albumId) {
            Alert.alert("Error", "Invalid album invitation link.");
            return;
        }

        setIsJoining(true);
        try {
            // TODO: Implement album joining logic here
            // This would typically involve calling an API to join the album
            console.log(`Attempting to join album: ${albumId}`);
            
            // Placeholder for actual implementation
            Alert.alert(
                "Success",
                `You would join album ${albumId}`,
                [
                    {
                        text: "OK",
                        onPress: () => router.replace("/"),
                    },
                ]
            );
        } catch (error) {
            console.error("Error joining album:", error);
            Alert.alert("Error", "Failed to join album. Please try again.");
        } finally {
            setIsJoining(false);
        }
    };

    if (!firebaseUser) {
        return null; // Will redirect via useEffect
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Join Album</Text>
            <Text style={styles.subtitle}>
                You&apos;ve been invited to join an album!
            </Text>
            <Text style={styles.albumId}>Album ID: {albumId}</Text>
            
            <TouchableOpacity 
                style={[styles.button, isJoining && styles.buttonDisabled]}
                onPress={handleJoinAlbum}
                disabled={isJoining}
            >
                <Text style={styles.buttonText}>
                    {isJoining ? "Joining..." : "Join Album"}
                </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => router.replace("/")}
            >
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 20,
        textAlign: "center",
    },
    albumId: {
        fontSize: 14,
        color: "#888",
        marginBottom: 30,
        fontFamily: "monospace",
    },
    button: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 8,
        marginBottom: 15,
        minWidth: 200,
    },
    buttonDisabled: {
        backgroundColor: "#999",
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    cancelButton: {
        paddingHorizontal: 30,
        paddingVertical: 15,
    },
    cancelButtonText: {
        color: "#007AFF",
        fontSize: 16,
        textAlign: "center",
    },
});