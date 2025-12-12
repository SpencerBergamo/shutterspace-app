import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { FriendshipStatus } from "@/src/types/Friend";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface FriendListCardProps {
    friendshipId: Id<'friendships'>;
    status: FriendshipStatus;
    isRecipient: boolean;
    onAccept?: () => void;
    onDecline?: () => void;
    onCancel?: () => void;
    onManage?: () => void;
}

export default function FriendListCard({ friendshipId, status, isRecipient, onAccept, onDecline, onCancel, onManage }: FriendListCardProps) {
    const { colors } = useAppTheme();

    const friend = useQuery(api.friendships.getFriendByFriendshipId, { friendshipId });

    const renderActionButtons = () => {
        if (status === 'accepted') {
            // Already friends - show manage button
            return (
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onManage}
                >
                    <Ionicons name="chevron-forward" size={20} color={colors.text} />
                </TouchableOpacity>
            );
        }

        if (status === 'pending' && isRecipient) {
            // Recipient of friend request - show Accept and Decline
            return (
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.declineButton]}
                        onPress={onDecline}
                    >
                        <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={onAccept}
                    >
                        <Text style={styles.acceptText}>Accept</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (status === 'pending' && !isRecipient) {
            // Sender of friend request - show Cancel
            return (
                <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={onCancel}
                >
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            );
        }

        return null;
    };

    return (
        <View style={[styles.container, { borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '600', color: colors.text }}>
                    {friend ? friend.nickname.charAt(0).toUpperCase() : ''}
                </Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={[styles.friendName, { color: colors.text }]}>
                    {friend ? friend.nickname : 'Loading...'}
                </Text>
                {status !== 'accepted' && (
                    <Text style={styles.statusText}>{status}</Text>
                )}
            </View>
            {renderActionButtons()}
        </View>)

}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        marginVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },

    avatar: {
        width: 44,
        height: 44,
        borderRadius: 999,
        borderWidth: 1,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
    },
    statusText: {
        color: 'grey',
        fontStyle: 'italic',
        fontSize: 12,
        marginTop: 2,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptButton: {
        backgroundColor: '#09ADA9',
    },
    acceptText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    declineButton: {
        backgroundColor: '#F0F0F0',
    },
    declineText: {
        color: '#666666',
        fontSize: 14,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#FFF3F2',
    },
    cancelText: {
        color: '#FF3B30',
        fontSize: 14,
        fontWeight: '600',
    },
})
