import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery } from "convex/react";
import { router, Stack } from "expo-router";
import { useCallback } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FriendListCard from "./components/FriendListCard";

export function FriendsListScreen() {
    const { colors } = useAppTheme();
    const profile = useQuery(api.profile.getUserProfile);
    const friendshipList = useQuery(api.friendships.getAllFriendships);

    // Convex
    const acceptFriendRequest = useMutation(api.friendships.acceptFriendRequest);
    const removeFriend = useMutation(api.friendships.removeFriend);

    const handleAcceptFriendRequest = useCallback(async (friendshipId: Id<'friendships'>) => {
        try {
            await acceptFriendRequest({ friendshipId });
        } catch (e) {
            console.error("Error accepting friend request:", e);
            Alert.alert("Error", "Failed to accept friend request. Please try again.");
        }
    }, [acceptFriendRequest]);

    const handleDeclineFriendRequest = useCallback(async (friendshipId: Id<'friendships'>) => {
        try {
            await removeFriend({ friendshipId });
        } catch (e) {
            console.error("Error declining friend request:", e);
            Alert.alert("Error", "Failed to decline friend request. Please try again.");
        }
    }, [removeFriend]);

    const handleCancelFriendRequest = useCallback(async (friendshipId: Id<'friendships'>) => {
        try {
            await removeFriend({ friendshipId });
        } catch (e) {
            console.error("Error canceling friend request:", e);
            Alert.alert("Error", "Failed to cancel friend request. Please try again.");
        }
    }, [removeFriend]);

    const handleRemoveFriend = useCallback(async (friendshipId: Id<'friendships'>) => {
        Alert.alert(
            "Remove Friend",
            "Are you sure you want to remove this friend?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await removeFriend({ friendshipId });
                        } catch (e) {
                            console.error("Error removing friend:", e);
                            Alert.alert("Error", "Failed to remove friend. Please try again.");
                        }
                    }
                }
            ]
        );
    }, [removeFriend]);


    const renderEmptyComponent = useCallback(() => {
        return (
            <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="people" size={48} color={colors.primary} />
                </View>
                <View style={styles.emptyContentText}>
                    <Text style={[styles.emptyContentTitle, { color: colors.text }]}>No Friends Yet</Text>
                    <Text style={[styles.emptyContentDescription, { color: colors.caption }]}>Start connecting with friends on ShutterSpace</Text>
                </View>
                <View style={[styles.emptyGuide, { backgroundColor: colors.grey3, borderColor: colors.border }]}>
                    {/* <View style={[styles.emptyGuideIcon, { backgroundColor: colors.background }]}>
                        <Ionicons name="qr-code" size={20} color={colors.text} />
                    </View> */}
                    <View style={styles.emptyGuideText}>
                        <Text style={[styles.emptyGuideTitle, { color: colors.text }]}>Tap the QR code button above</Text>
                        <Text style={[styles.emptyGuideDescription, { color: colors.caption }]}>Share your profile or scan a friend's code to connect</Text>
                    </View>
                </View>
            </View>
        )
    }, [colors]);


    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{

                headerTitle: 'My Friends',
                headerRight: () => (
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <TouchableOpacity
                            style={[styles.navButton, { borderColor: colors.border }]}
                            onPress={() => router.push('/share-profile')}
                        >
                            <Ionicons name="qr-code" size={18} color={colors.grey1} />
                        </TouchableOpacity>
                    </View>
                )
            }} />

            <FlashList
                data={friendshipList}
                estimatedItemSize={56}
                keyExtractor={(item) => item._id}
                ListEmptyComponent={renderEmptyComponent}
                renderItem={({ item }) => (
                    <FriendListCard
                        friendshipId={item._id}
                        status={item.status}
                        isRecipient={item.recipientId === profile?._id}
                        onAccept={() => handleAcceptFriendRequest(item._id)}
                        onDecline={() => handleDeclineFriendRequest(item._id)}
                        onCancel={() => handleCancelFriendRequest(item._id)}
                        onManage={() => handleRemoveFriend(item._id)}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 1,
    },

    // Navbar
    navButton: {
        borderRadius: 999,
        padding: 12,
        borderWidth: 1,
    },

    // List
    listContent: {
        flexGrow: 1,
    },

    // Empty Component
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 24,
    },
    emptyIconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContentText: {
        alignItems: 'center',
        gap: 8,
    },
    emptyContentTitle: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyContentDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    emptyGuide: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        maxWidth: 400,
    },
    emptyGuideIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyGuideText: {
        flex: 1,
        gap: 4,
    },
    emptyGuideTitle: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptyGuideDescription: {
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
    },
})