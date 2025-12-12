

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import QRCodeModal from "@/src/components/QRCodeModal";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { useProfile } from "@/src/context/ProfileContext";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import FriendListCard from "./components/FriendListCard";

export function FriendsListScreen() {
    const { colors } = useAppTheme();
    const { profile } = useProfile();
    const friendships = useQuery(api.friendships.getFriendships);
    const [qrModalVisible, setQrModalVisible] = useState(false);

    // Data
    const shareUrl = `https://shutterspace.app/shareId/${profile.shareCode}`;

    // Convex
    const acceptFriendRequest = useMutation(api.friendships.acceptFriendRequest);
    const removeFriend = useMutation(api.friendships.removeFriend);

    const friendshipList = useMemo(() => {
        //ignore blocked friendshps
        return friendships?.filter(friendship => friendship.status !== 'blocked');
    }, [friendships]);

    const handleAcceptFriendRequest = useCallback(async (friendshipId: Id<'friendships'>) => {
        try {
            await acceptFriendRequest({ friendshipId });
        } catch (e) {
            console.error("Error accepting friend request:", e);
            Alert.alert("Error", "Failed to accept friend request. Please try again.");
        }
    }, [acceptFriendRequest]);

    const handleRemoveFriend = useCallback(async (friendshipId: Id<'friendships'>) => {
        try {
            await removeFriend({ friendshipId });
        } catch (e) {
            console.error("Error removing friend:", e);
            Alert.alert("Error", "Failed to remove friend. Please try again.");
        }
    }, [removeFriend]);


    const renderEmptyComponent = useCallback(() => {
        return (
            <View style={styles.emptyContainer}>
                <View style={[styles.emptyContent, { borderColor: colors.border }]}>
                    <View style={[styles.emptyContentText]}>
                        <Text style={[styles.emptyContentTitle, { color: colors.text }]}>No friends found</Text>
                        <Text style={[styles.emptyContentDescription, { color: colors.caption }]}>Scan this QR code to add me on Shutterspace</Text>
                    </View>

                    <QRCode
                        value={shareUrl}
                        size={200}
                        backgroundColor="white"
                    />
                </View>
            </View>
        )
    }, []);

    if (friendships === undefined) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.text} />
            </View>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{

                headerTitle: 'My Friends',
                headerRight: () => (
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <TouchableOpacity
                            style={[styles.navButton, { borderColor: colors.border }]}
                            onPress={() => setQrModalVisible(true)}
                        >
                            <Ionicons name="qr-code" size={18} color={colors.grey1} />
                        </TouchableOpacity>
                    </View>
                )
            }} />

            <FlatList
                data={friendshipList}
                initialNumToRender={friendshipList?.length}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmptyComponent}
                renderItem={({ item }) => (
                    <FriendListCard
                        friendshipId={item._id}
                        status={item.status}
                        isRecipient={item.recipientId === profile._id}
                        onAccept={() => handleAcceptFriendRequest(item._id)}
                        onCancel={() => handleRemoveFriend(item._id)}
                        onManage={() => { }}
                    />
                )}
            />
            {/* 
            <View style={position}>
                <TouchableOpacity
                    style={button}
                    onPress={handleShareProfile}
                >
                    <Ionicons name="share-outline" size={iconSize} color={colors.border} />
                </TouchableOpacity>
            </View> */}

            <QRCodeModal
                visible={qrModalVisible}
                onClose={() => setQrModalVisible(false)}
                value={shareUrl}
                displayValue={profile.shareCode}
                title="Share Your Profile"
                description="Scan this QR code to add me on Shutterspace"
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
        padding: 16,
        flexGrow: 1,
    },

    // Empty Component
    emptyContainer: {
        paddingHorizontal: 16,
    },
    emptyContent: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
    },
    emptyContentText: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 8,
    },
    emptyContentTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptyContentDescription: {
        fontSize: 14,
        textAlign: 'center',
    },
})