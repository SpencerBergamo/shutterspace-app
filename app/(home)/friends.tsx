import { useFriends } from "@/context/FriendsContext";
import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import useAppStyles from "@/hooks/useAppStyles";
import useFabStyles from "@/hooks/useFabStyles";
import { Friendship, FriendshipStatus } from "@/types/Friend";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, Alert, AlertButton, FlatList, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface FriendCardProps {
    friendshipId: Id<'friendships'>;
    status: FriendshipStatus;
    isRecipient: boolean;
    onAction: () => void;
}

function FriendCard({ friendshipId, status, isRecipient, onAction }: FriendCardProps) {
    const { colorScheme } = useAppStyles();

    const friend = useQuery(api.friendships.getFriendByFriendshipId, { friendshipId });

    return (
        <View style={[styles.friendItem, styles.shadow]}>
            <View style={[styles.avatar, { backgroundColor: colorScheme.background, borderColor: colorScheme.border }]}>
                <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '600' }}>
                    {friend ? friend.nickname.charAt(0).toUpperCase() : ''}
                </Text>
            </View>
            <Text style={[styles.friendName, { color: colorScheme.text }]}>
                {friend ? friend.nickname : 'Loading...'}
            </Text>
            {status !== 'accepted' && (
                <Text style={{ color: "grey", fontStyle: 'italic' }}>{status}</Text>
            )}
            <TouchableOpacity
                style={styles.removeButton}
                onPress={onAction}
            >
                {status === 'pending' && isRecipient ? (
                    <Ionicons name="checkmark-outline" size={20} color="#09ADA9" />
                ) : status === 'pending' ? (
                    <Ionicons name="close" size={20} color="#FF3B30" />
                ) : (
                    <View />
                )}
            </TouchableOpacity>
        </View>
    );
}

export default function FriendsListScreen() {

    const { position, button, iconSize } = useFabStyles();
    const { colorScheme } = useAppStyles();
    const { profile } = useProfile();
    const { friendships } = useFriends();

    const friendshipList = useMemo(() => {
        //ignore blocked friendshps
        return friendships?.filter(friendship => friendship.status !== 'blocked');
    }, [friendships])

    // Data
    const shareUrl = `https://shutterspace.app/shareId/${profile.shareCode}`;

    // Convex
    const acceptFriendRequest = useMutation(api.friendships.acceptFriendRequest);
    const removeFriend = useMutation(api.friendships.removeFriend);

    const handleShareProfile = async () => {
        await Share.share({ url: shareUrl });
    }

    const handleFriendItem = useCallback(async (friendship: Friendship) => {
        const status = friendship.status;
        const isRecipient = friendship.recipientId === profile._id;

        let title = "";
        let message = "";
        let buttons: AlertButton[];

        if (status === 'pending' && isRecipient) {
            title = "Accept Friend Request";
            message = "Are you sure you want to accept this friend request?";
            buttons = [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept', style: 'destructive', onPress: async () => {
                        await acceptFriendRequest({ friendshipId: friendship._id });
                    }
                },
            ]
        }
        else if (status === 'pending' && !isRecipient) {
            title = "Cancel Friend Request";
            message = "Are you sure you want to cancel this friend request?";
            buttons = [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Cancel', style: 'destructive', onPress: async () => {
                        await removeFriend({ friendshipId: friendship._id });
                    }
                },
            ]
        } else {
            title = "Remove Friend";
            message = "Are you sure you want to remove this friend?";
            buttons = [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove', style: 'destructive', onPress: async () => {
                        await removeFriend({ friendshipId: friendship._id });
                    }
                },
            ]
        }

        Alert.alert(title, message, buttons);
    }, [friendshipList]);

    if (friendships === undefined) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colorScheme.text} />
            </View>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <FlatList
                data={friendshipList}
                initialNumToRender={friendshipList.length}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyCard, { backgroundColor: colorScheme.background, borderColor: colorScheme.border }]}>
                            <QRCode
                                value={shareUrl}
                                size={175}
                            />
                            <Text style={[styles.emptyTitle, { color: colorScheme.text }]}>
                                No Friends Yet
                            </Text>
                            <Text style={[styles.emptyDescription, { color: colorScheme.text }]}>
                                Share your profile to connect with friends and start sharing photos together.
                            </Text>
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <FriendCard
                        friendshipId={item._id}
                        status={item.status}
                        isRecipient={item.recipientId === profile._id}
                        onAction={() => handleFriendItem(item)}
                    />
                )}
            />

            <View style={position}>
                <TouchableOpacity
                    style={button}
                    onPress={handleShareProfile}
                >
                    <Ionicons name="share-outline" size={iconSize} color={colorScheme.surface} />
                </TouchableOpacity>
            </View>
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

    // List
    listContent: {
        padding: 16,
        flexGrow: 1,
    },
    friendItem: {
        backgroundColor: "#fff",
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    friendName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    removeButton: {
        padding: 8,
    },

    // Empty Container
    emptyContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    emptyCard: {
        borderRadius: 16,
        padding: 32,
        borderWidth: 1,
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
    },
    emptyAvatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 24,
        marginBottom: 12,
    },
    emptyDescription: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
})