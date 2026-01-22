import { api } from "@shutterspace/backend/convex/_generated/api";
import { Id } from "@shutterspace/backend/convex/_generated/dataModel";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface AlbumFriendSelectorProps {
    albumId: Id<'albums'>;
    onSelectedChange: (selectedIds: Id<'profiles'>[]) => void;
}

export function AlbumFriendSelector({ albumId, onSelectedChange }: AlbumFriendSelectorProps) {
    const { colors } = useAppTheme();
    const friends = useQuery(api.friendships.getListOfFriends);
    const albumMembers = useQuery(api.albumMembers.queryAllMemberships, { albumId });
    const [selectedIds, setSelectedIds] = useState<Set<Id<'profiles'>>>(new Set());

    // Filter out friends who are already members
    const availableFriends = friends?.filter(friend =>
        !albumMembers?.some(member => member.profileId === friend._id)
    ) ?? [];

    const toggleSelection = (friendId: Id<'profiles'>) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(friendId)) {
            newSelected.delete(friendId);
        } else {
            newSelected.add(friendId);
        }
        setSelectedIds(newSelected);
        onSelectedChange(Array.from(newSelected));
    };

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="people" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Friends Available</Text>
            <Text style={[styles.emptyDescription, { color: colors.caption }]}>
                All your friends are already members of this album
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlashList
                data={availableFriends}
                // estimatedItemSize={64}
                keyExtractor={(item) => item._id}
                ListEmptyComponent={renderEmptyComponent}
                renderItem={({ item }) => {
                    const isSelected = selectedIds.has(item._id);
                    return (
                        <Pressable
                            style={[
                                styles.friendItem,
                                { borderBottomColor: colors.border, backgroundColor: colors.background }
                            ]}
                            onPress={() => toggleSelection(item._id)}
                        >
                            <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
                                <Text style={[styles.avatarText, { color: colors.primary }]}>
                                    {item.nickname.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={[styles.friendName, { color: colors.text }]}>
                                {item.nickname}
                            </Text>
                            <View style={[
                                styles.checkbox,
                                { borderColor: isSelected ? colors.primary : colors.border },
                                isSelected && { backgroundColor: colors.primary }
                            ]}>
                                {isSelected && (
                                    <Ionicons name="checkmark" size={16} color="white" />
                                )}
                            </View>
                        </Pressable>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    friendItem: {
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
    friendName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 48,
        gap: 16,
    },
    emptyIconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
});
