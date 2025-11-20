import { useFriends } from '@/context/FriendsContext';
import { Id } from '@/convex/_generated/dataModel';
import useAppStyles from '@/hooks/useAppStyles';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ManageFriendsScreen() {
    const theme = useTheme();
    const appStyles = useAppStyles();
    const { friends, removeFriend } = useFriends();

    const handleRemoveFriend = (friendId: Id<'profiles'>, nickname: string) => {
        // Add confirmation before removing
        removeFriend(friendId);
    };

    return (
        <View style={{ flex: 1, backgroundColor: appStyles.colorScheme.background }}>
            <FlatList
                data={friends}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                            <View style={[styles.emptyAvatar, { backgroundColor: theme.colors.card }]}>
                                <Ionicons name="person-outline" size={48} color={theme.colors.text} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                                No Friends Yet
                            </Text>
                            <Text style={[styles.emptyDescription, { color: theme.colors.text }]}>
                                Share your profile to connect with friends and start sharing photos together.
                            </Text>
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={[styles.friendItem, styles.shadow, { backgroundColor: theme.colors.card }]}>
                        <View style={[styles.avatar, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]} />
                        <Text style={[styles.friendName, { color: theme.colors.text }]}>
                            {item.nickname}
                        </Text>
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => handleRemoveFriend(item._id, item.nickname)}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                )}
            />

            <View style={appStyles.fabPosition}>
                <TouchableOpacity style={[appStyles.fabButton, { backgroundColor: appStyles.colorScheme.primary }]}
                    onPress={() => { }}
                >
                    <Ionicons name="share-outline" size={24} color={appStyles.colorScheme.surface} />
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
        marginBottom: 12,
    },
    emptyDescription: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
});