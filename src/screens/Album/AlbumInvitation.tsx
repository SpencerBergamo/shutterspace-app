import { api } from "@/convex/_generated/api";
import Avatar from "@/src/components/Avatar";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { formatAlbumDate } from "@/src/utils/formatters";
import { useMutation, useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotFoundScreen } from "../Home/NotFound";
import AlbumInvitationCover from "./components/AlbumInvitationCover";

export function AlbumInvitationScreen() {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const { code } = useLocalSearchParams<{ code: string }>();
    const invitation = useQuery(api.inviteCodes.openInvite, { code },

    );
    const acceptInvite = useMutation(api.inviteCodes.acceptInvite);

    const [isJoining, setIsJoining] = useState(false);

    const handleDecline = () => {
        Alert.alert("Decline Invitation?", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Yes, Decline", style: "destructive", onPress: () => router.back() },
        ]);
    };

    const handleAccept = useCallback(async () => {
        try {
            setIsJoining(true);
            await acceptInvite({ code });
        } catch (e) {
            console.error("Failed to accept invitation: ", e);
            Alert.alert("Error", "Failed to accept invitation. Please try again.");
        } finally {
            Alert.alert("Success! 🎉", "You've joined the album!", [
                {
                    text: "Open Album",
                    onPress: () => {
                        if (invitation?.albumId) {
                            router.replace(`/album/${invitation.albumId}`);
                        } else {
                            router.back();
                        }
                    }
                },
                {
                    text: "Close",
                    onPress: () => router.dismissAll()
                }
            ]);
        }
    }, [acceptInvite, code]);

    // Loading state
    if (invitation === undefined) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading invitation...</Text>
            </View>
        );
    }

    // Error state - invitation is null or failed to load
    if (!invitation) return <NotFoundScreen />;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <AlbumInvitationCover
                albumId={invitation.albumId}
                cover={invitation.cover}
            />

            {/* Gradient Overlay */}
            <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.85)"]}
                style={styles.gradient}
            />

            {/* Content */}
            <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}>
                {/* Host Section */}
                <View style={styles.hostSection}>
                    <Avatar
                        nickname={invitation.sender}
                        size={48}
                    />
                    <View>
                        <Text style={styles.invitedLabel}>You're invited by</Text>
                        <Text style={styles.hostName}>{invitation.sender}</Text>
                    </View>
                </View>

                {/* Album Title */}
                <Text style={styles.createdAt}>{formatAlbumDate(invitation.created)}</Text>
                <Text style={styles.title}>{invitation.title}</Text>

                {/* Description */}
                {invitation.description && <BlurView intensity={40} tint="light" style={styles.messageCard}>
                    <Text style={styles.messageText}>"{invitation.message}"</Text>
                </BlurView>}

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.declineButton]}
                        onPress={handleDecline}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.joinButton, { backgroundColor: colors.primary }]}
                        onPress={handleAccept}
                        disabled={isJoining}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.joinButtonText}>
                            {isJoining ? "Joining..." : "Accept Invitation"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    centerContent: {
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },

    // Loading
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
    },

    // Error
    errorContainer: {
        alignItems: "center",
        maxWidth: 300,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "white",
        marginTop: 20,
        marginBottom: 12,
    },
    errorMessage: {
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 32,
    },
    errorButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    errorButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },

    // Background
    gradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },

    // Close Button
    closeButton: {
        position: "absolute",
        right: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },

    // Content
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: "flex-end",
    },

    // Host Section
    hostSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    hostAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    hostInitial: {
        fontSize: 20,
        fontWeight: "700",
        color: "white",
    },
    invitedLabel: {
        fontSize: 13,
        color: "rgba(255,255,255,0.8)",
        marginBottom: 2,
    },
    hostName: {
        fontSize: 18,
        fontWeight: "600",
        color: "white",
    },

    // Title
    createdAt: {
        fontSize: 13,
        color: "rgba(255,255,255,0.8)",
        marginBottom: 16,
    },
    title: {
        fontSize: 36,
        fontWeight: "700",
        lineHeight: 42,
        letterSpacing: -0.5,
        color: "white",
        marginBottom: 16,
    },

    // Message Card
    messageCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        overflow: "hidden",
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        fontStyle: "italic",
        color: "white",
        textAlign: "center",
    },

    // Stats Row
    statsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        gap: 8,
        overflow: "hidden",
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    statValue: {
        fontSize: 28,
        fontWeight: "700",
        color: "white",
        marginTop: 4,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: "500",
        color: "rgba(255,255,255,0.9)",
    },

    // Buttons
    buttonRow: {
        flexDirection: "row",
        gap: 12,
    },
    declineButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.4)",
        alignItems: "center",
        justifyContent: "center",
    },
    declineButtonText: {
        fontSize: 17,
        fontWeight: "600",
        color: "white",
    },
    joinButton: {
        flex: 2,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    joinButtonText: {
        color: "white",
        fontSize: 17,
        fontWeight: "700",
    },
});
