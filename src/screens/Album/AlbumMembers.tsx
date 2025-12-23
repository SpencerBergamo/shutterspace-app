import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Avatar from "@/src/components/Avatar";
import FloatingActionButton from "@/src/components/FloatingActionButton";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { MemberRole, Membership } from "@/src/types/Album";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NotFoundScreen } from "../Home";

interface MembershipItemProps {
    item: Membership;
    currentUserRole: MemberRole;
    isCurrentUser: boolean;
    friendshipId?: Id<'friendships'>;
    friendshipStatus?: 'pending' | 'accepted' | 'rejected' | 'blocked';
    onSendFriendRequest: (profileId: Id<'profiles'>) => void;
}

const MembershipItem = ({
    item,
    currentUserRole,
    isCurrentUser,
    friendshipId,
    friendshipStatus,
    onSendFriendRequest,
}: MembershipItemProps) => {
    const { colors } = useAppTheme();
    const publicProfile = useQuery(api.profile.getPublicProfileById, { profileId: item.profileId });

    const canManage = (currentUserRole === 'host' || currentUserRole === 'moderator') && !isCurrentUser;

    if (!publicProfile) return null;

    const getRoleBadge = () => {
        switch (item.role) {
            case 'host':
                return <Ionicons name="star" size={16} color={colors.primary} />;
            case 'moderator':
                return <Ionicons name="shield-checkmark" size={16} color={colors.primary} />;
            case 'pending':
                return (
                    <View style={[styles.badge, { backgroundColor: colors.secondary + '40', borderColor: colors.border }]}>
                        <Text style={[styles.badgeText, { color: colors.text }]}>Pending</Text>
                    </View>
                );
            default:
                return null;
        }
    };

    const renderActionButton = () => {
        // Show friend request button if not friends and not current user
        if (!isCurrentUser && !friendshipId) {
            return (
                <TouchableOpacity
                    onPress={() => onSendFriendRequest(item.profileId)}
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                >
                    <Ionicons name="person-add" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Add Friend</Text>
                </TouchableOpacity>
            );
        }

        // Show friend status
        if (friendshipId && friendshipStatus === 'pending') {
            return (
                <View style={[styles.badge, { backgroundColor: colors.secondary + '40', borderColor: colors.border }]}>
                    <Text style={[styles.badgeText, { color: colors.text }]}>Request Sent</Text>
                </View>
            );
        }

        // Show management options for host/moderator
        if (canManage) {
            return (
                <TouchableOpacity
                    style={[styles.iconButton, { borderColor: colors.border }]}
                    onPress={() => {
                        Alert.alert(
                            "Manage Member",
                            `What would you like to do with ${publicProfile.nickname}?`,
                            [
                                { text: "Cancel", style: "cancel" },
                                item.role === 'pending' && {
                                    text: "Accept",
                                    onPress: () => console.log('Accept member'),
                                },
                                item.role !== 'pending' && item.role !== 'host' && {
                                    text: currentUserRole === 'host' ? "Make Moderator" : undefined,
                                    onPress: () => console.log('Promote to moderator'),
                                },
                                {
                                    text: "Remove",
                                    style: "destructive",
                                    onPress: () => console.log('Remove member'),
                                },
                            ].filter(Boolean) as any
                        );
                    }}
                >
                    <Ionicons name="ellipsis-horizontal" size={18} color={colors.text} />
                </TouchableOpacity>
            );
        }

        return null;
    };

    return (
        <View style={[styles.memberItem, { borderColor: colors.border }]}>
            <View style={styles.memberInfo}>
                <Avatar
                    nickname={publicProfile.nickname}
                    avatarKey={publicProfile.avatarKey}
                    ssoAvatarUrl={publicProfile.ssoAvatarUrl}
                    size={44}
                />
                <View style={styles.memberDetails}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.nickname, { color: colors.text }]}>
                            {publicProfile.nickname}
                            {isCurrentUser && " (You)"}
                        </Text>
                        {getRoleBadge()}
                    </View>
                </View>
            </View>
            {renderActionButton()}
        </View>
    );
};

export function AlbumMembersScreen() {
    const { colors } = useAppTheme();
    const profile = useQuery(api.profile.getUserProfile);
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();

    const inviteCode = useQuery(api.inviteCodes.getInviteCode, albumId ? { albumId } : "skip");
    const memberships = useQuery(api.albumMembers.getMemberships, albumId ? { albumId } : "skip");
    const currentUserRole = useQuery(api.albumMembers.getMembership, albumId ? { albumId } : "skip");
    const friendships = useQuery(api.friendships.getFriendships);
    const sendFriendRequest = useMutation(api.friendships.sendFriendRequest);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Create a map of friendships for quick lookup
    const friendshipMap = useMemo(() => {
        if (!friendships) return new Map();
        const map = new Map<Id<'profiles'>, { id: Id<'friendships'>, status: 'pending' | 'accepted' | 'rejected' | 'blocked' }>();
        friendships.forEach(f => {
            const friendId = f.senderId === profile?._id ? f.recipientId : f.senderId;
            map.set(friendId, { id: f._id, status: f.status });
        });
        return map;
    }, [friendships, profile]);

    // Sort memberships by pending first, then role, then joinedAt
    const orderedMemberships = useMemo(() => {
        if (!memberships) return [];

        const roleOrder: Record<MemberRole, number> = {
            'pending': 0,
            'host': 1,
            'moderator': 2,
            'member': 3,
            'not-a-member': 4,
        };

        return [...memberships].sort((a, b) => {
            // by hierarchy
            const roleCompare = roleOrder[a.role] - roleOrder[b.role];
            if (roleCompare !== 0) return roleCompare;

            // by joinedAt
            return a.joinedAt - b.joinedAt;
        });
    }, [memberships]);

    const handleSendFriendRequest = useCallback(async (friendId: Id<'profiles'>) => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await sendFriendRequest({ friendId });
        } catch (error) {
            console.error('Failed to send friend request:', error);
            Alert.alert('Error', 'Failed to send friend request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, sendFriendRequest]);

    const handleShareInvite = useCallback(async () => {
        if (!inviteCode) return;

        try {
            await Share.share({
                message: `https://shutterspace.app/invite/${inviteCode}`,
                url: `https://shutterspace.app/invite/${inviteCode}`,
            });
        } catch (e) {
            console.error('Failed to share invite:', e);
            Alert.alert('Error', 'Failed to share invite. Please try again.');
        }
    }, [albumId]);

    if (!albumId) return <NotFoundScreen />;

    if (memberships === undefined || currentUserRole === undefined) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (memberships === null || currentUserRole === 'not-a-member') {
        return <NotFoundScreen />;
    }

    const pendingCount = memberships.filter(m => m.role === 'pending').length;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={orderedMemberships}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListHeaderComponent={
                    pendingCount > 0 && (currentUserRole === 'host' || currentUserRole === 'moderator') ? (
                        <View style={[styles.headerBanner, { backgroundColor: colors.secondary + '20', borderColor: colors.border }]}>
                            <Ionicons name="time-outline" size={20} color={colors.text} />
                            <Text style={[styles.headerBannerText, { color: colors.text }]}>
                                {pendingCount} pending request{pendingCount > 1 ? 's' : ''}
                            </Text>
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={48} color={colors.text + '60'} />
                        <Text style={[styles.emptyText, { color: colors.text }]}>No members yet</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const friendship = friendshipMap.get(item.profileId);
                    return (
                        <MembershipItem
                            item={item}
                            currentUserRole={currentUserRole}
                            isCurrentUser={profile?._id === item.profileId}
                            friendshipId={friendship?.id}
                            friendshipStatus={friendship?.status}
                            onSendFriendRequest={handleSendFriendRequest}
                        />
                    );
                }}
            />

            <FloatingActionButton
                selectIcon="add"
                onPress={handleShareInvite}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    headerBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    headerBannerText: {
        fontSize: 14,
        fontWeight: '600',
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    memberDetails: {
        flex: 1,
        gap: 4,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    nickname: {
        fontSize: 16,
        fontWeight: '600',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    iconButton: {
        padding: 8,
        borderWidth: 1,
        borderRadius: 20,
    },
    separator: {
        height: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        opacity: 0.6,
    },
});
