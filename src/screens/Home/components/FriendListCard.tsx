import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { FriendshipStatus } from "@/src/types/Friend";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";

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

    const getStatusInfo = () => {
        if (status === 'pending' && isRecipient) {
            return { text: 'Wants to connect', badge: 'New' };
        }
        if (status === 'pending' && !isRecipient) {
            return { text: 'Request sent', badge: 'Pending' };
        }
        return null;
    };

    const statusInfo = getStatusInfo();

    const getStatusBadge = () => {
        if (!statusInfo) return null;

        const isNew = status === 'pending' && isRecipient;
        return (
            <View style={[styles.statusBadge, { backgroundColor: isNew ? colors.primary + '20' : colors.grey3 }]}>
                <Text style={[styles.statusBadgeText, { color: isNew ? colors.primary : colors.caption }]}>
                    {statusInfo.badge}
                </Text>
            </View>
        );
    };

    const renderRightActions = (progress: SharedValue<number>, translation: SharedValue<number>, swipeableMethods: SwipeableMethods) => {
        if (status === 'accepted') {
            // 1 button: 40 + 16 padding = 56
            const animatedStyle = useAnimatedStyle(() => {
                return {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingRight: 16,
                    transform: [{ translateX: translation.value + 56 }],
                };
            });

            return (
                <Reanimated.View style={animatedStyle}>
                    <Pressable
                        style={[styles.swipeActionButton, styles.removeAction]}
                        onPress={onManage}
                    >
                        <Ionicons name="pencil-outline" size={20} color="white" />
                    </Pressable>
                </Reanimated.View>
            );
        }

        if (status === 'pending' && isRecipient) {
            // 2 buttons: 40 + 12 + 40 + 16 = 108
            const animatedStyle = useAnimatedStyle(() => {
                return {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingRight: 16,
                    transform: [{ translateX: translation.value + 108 }],
                };
            });

            return (
                <Reanimated.View style={animatedStyle}>
                    <Pressable
                        style={[styles.swipeActionButton, styles.declineAction]}
                        onPress={onDecline}
                    >
                        <Ionicons name="close" size={22} color="white" />
                    </Pressable>
                    <Pressable
                        style={[styles.swipeActionButton, styles.acceptAction]}
                        onPress={onAccept}
                    >
                        <Ionicons name="checkmark" size={22} color="white" />
                    </Pressable>
                </Reanimated.View>
            );
        }

        if (status === 'pending' && !isRecipient) {
            // 1 button: 40 + 16 padding = 56
            const animatedStyle = useAnimatedStyle(() => {
                return {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingRight: 16,
                    transform: [{ translateX: translation.value + 56 }],
                };
            });

            return (
                <Reanimated.View style={animatedStyle}>
                    <Pressable
                        style={[styles.swipeActionButton, styles.cancelAction]}
                        onPress={onCancel}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="white" />
                    </Pressable>
                </Reanimated.View>
            );
        }

        return null;
    };
    return (
        <ReanimatedSwipeable
            containerStyle={{ width: '100%' }}
            renderRightActions={renderRightActions}
            friction={2}
            rightThreshold={40}>
            <View style={[styles.container, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {friend ? friend.nickname.charAt(0).toUpperCase() : ''}
                    </Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={[styles.friendName, { color: colors.text }]}>
                        {friend ? friend.nickname : 'Loading...'}
                    </Text>
                    {statusInfo && (
                        <Text style={[styles.statusText, { color: colors.caption }]}>
                            {statusInfo.text}
                        </Text>
                    )}
                </View>
                {getStatusBadge()}
            </View>
        </ReanimatedSwipeable>
    );

}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '600',
    },
    infoContainer: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '500',
    },
    statusText: {
        fontSize: 13,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    swipeActionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptAction: {
        backgroundColor: '#10B981',
    },
    declineAction: {
        backgroundColor: '#EF4444',
    },
    cancelAction: {
        backgroundColor: '#F59E0B',
    },
    removeAction: {
        backgroundColor: '#EF4444',
    },
});
