import { api } from "@/convex/_generated/api";
import Avatar from "@/src/components/Avatar";
import FloatingActionButton from "@/src/components/FloatingActionButton";
import QRCodeModal from "@/src/components/QRCodeModal";
import { useAlbums } from '@/src/context/AlbumsContext';
import { useAppTheme } from "@/src/context/AppThemeContext";
import { useProfile } from "@/src/context/ProfileContext";
import { formatAlbumDate } from "@/src/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router, Stack } from "expo-router";
import * as Orientation from 'expo-screen-orientation';
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import AlbumCoverImage from "../Album/components/AlbumCoverImage";
import { AddFriendsPrompt } from "./components/AddFriendsPrompt";

export function HomeScreen() {
    // Layout
    const { colors } = useAppTheme();
    const { width } = useWindowDimensions();

    const [orientation, setOrientation] = useState<Orientation.Orientation>(Orientation.Orientation.PORTRAIT_UP);
    const [qrModalVisible, setQrModalVisible] = useState(false);

    // Data
    const { profile } = useProfile();
    const { albums } = useAlbums();
    const friendships = useQuery(api.friendships.getFriendships);

    // Constants
    const shareUrl = `https://shutterspace.app/shareId/${profile.shareCode}`;

    useEffect(() => {
        const subscription = Orientation.addOrientationChangeListener((event) => {
            setOrientation(event.orientationInfo.orientation);
        });

        Orientation.getOrientationAsync().then(setOrientation);

        return () => {
            Orientation.removeOrientationChangeListener(subscription);
        };
    }, []);

    useEffect(() => {
        if (qrModalVisible) {
            Orientation.lockAsync(Orientation.OrientationLock.PORTRAIT_UP);
        } else {
            Orientation.unlockAsync();
        }
    }, [qrModalVisible]);

    const gridConfig = useMemo(() => {
        const gap = 16;
        const isTable = Platform.OS === 'ios'
            ? width >= 768
            : width >= 600;

        const isPortrait = orientation === Orientation.Orientation.PORTRAIT_UP ||
            orientation === Orientation.Orientation.PORTRAIT_DOWN;

        let numColumns: number;

        if (isTable) {
            numColumns = isPortrait ? 4 : 6;
        } else {
            numColumns = isPortrait ? 2 : 3;
        }

        const itemSize = (width - (gap * (numColumns + 1))) / numColumns;

        return {
            itemSize,
            numColumns,
            gap,
        }
    }, [width, orientation]);

    const renderHeader = useCallback(() => {
        const friendCount = friendships?.filter(f => f.status === 'accepted').length ?? 0;

        // Show prompt for users with fewer than 5 friends
        if (friendCount >= 5) return null;

        return (
            <AddFriendsPrompt
                friendCount={friendCount}
                onPress={() => router.push('/friends')}
            />
        );
    }, [friendships]);

    const renderItem = useCallback(({ item }: { item: typeof albums[number] }) => (
        <Pressable
            onPress={() => router.push(`/album/${item._id}`)}
            style={[styles.albumCover, { width: gridConfig.itemSize }]}
        >
            <View style={[styles.albumCoverImage, { width: gridConfig.itemSize, height: gridConfig.itemSize }]}>
                <AlbumCoverImage album={item} />
            </View>

            <Text style={[styles.albumTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.albumDate, { color: colors.text + '80' }]}>
                {formatAlbumDate(item._creationTime)}
            </Text>
        </Pressable>
    ), [gridConfig.itemSize, colors.text]);

    const renderHeaderLeft = useCallback(() => (
        <View style={styles.headerLeft}>
            <Avatar
                nickname={profile.nickname}
                avatarKey={profile.avatarKey}
                ssoAvatarUrl={profile.ssoAvatarUrl}
                onPress={() => router.push('settings')}
            />
            <View style={styles.greetingContainer}>
                <Text style={[styles.greeting, { color: colors.text }]}>
                    Hi, {profile.nickname}
                </Text>
                {!profile.avatarKey && (
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        onPress={() => router.push('profile/edit')}
                    >
                        <Text style={[styles.completeProfile, { color: colors.primary }]}>
                            Complete profile
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    ), [profile.nickname, profile.avatarKey, profile.ssoAvatarUrl, colors.text, colors.primary]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                headerLeft: renderHeaderLeft,
                headerTitle: '',
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => router.push('/friends')}
                        style={[styles.headerRight, { borderColor: colors.border }]}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="people" size={18} color={colors.grey1} />
                    </TouchableOpacity>
                ),
            }} />

            <FlatList
                key={gridConfig.numColumns}
                data={albums}
                keyExtractor={(item) => item._id}
                numColumns={gridConfig.numColumns}
                columnWrapperStyle={{
                    gap: gridConfig.gap,
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                }}
                contentContainerStyle={{ paddingHorizontal: gridConfig.gap, gap: gridConfig.gap }}
                scrollEnabled={albums.length > 0}
                ListEmptyComponent={
                    <View style={styles.emptyContainer} >
                        <View style={[styles.emptyCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                Welcome to Shutterspace!
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: colors.text }]}>
                                You don't have any albums yet.
                            </Text>
                            <Text style={[styles.emptyDescription, { color: colors.text }]}>
                                Create your first album to start sharing photos with friends and family.
                            </Text>
                            <View style={[styles.ctaContainer, { backgroundColor: colors.background }]}>
                                <Plus size={20} color={colors.primary} />
                                <Text style={[styles.ctaText, { color: colors.primary }]}>
                                    Tap the button below to get started
                                </Text>
                            </View>
                        </View>
                    </View >
                }
                ListHeaderComponent={renderHeader}
                ListHeaderComponentStyle={{
                    marginTop: 16,
                }}
                renderItem={renderItem}
            />

            <FloatingActionButton
                selectIcon="add"
                items={[
                    {
                        selectIcon: "camera-outline",
                        label: "Take Photo",
                        onPress: () => router.push('/camera'),
                    }

                ]}
            />

            <QRCodeModal
                visible={qrModalVisible}
                onClose={() => setQrModalVisible(false)}
                value={shareUrl}
                displayValue={profile.shareCode}
                title="Share Profile"
                description="Share this code with your friends!"
                showCopyButton={true}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Header
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        width: 40,
        height: 40,
        overflow: 'hidden',
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: '600',
    },
    greetingContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
    },
    greeting: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 16,
    },
    completeProfile: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
    },
    headerRight: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 999,
        padding: 12,
        borderWidth: 1,
    },

    // Album Cover
    albumCover: {
        flexDirection: 'column',
        marginBottom: 16,
    },
    albumCoverImage: {
        borderRadius: 16,
        backgroundColor: '#DEDEDEFF',
        overflow: 'hidden',
        marginBottom: 8,
    },
    albumTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    albumDate: {
        fontSize: 12,
    },

    // Fab
    fabPosition: {
        position: 'absolute',
        right: 30,
    },
    fabButton: {
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Empty Container Styles
    emptyContainer: {
        flex: 1,
        paddingTop: 16,
    },
    emptyCard: {
        borderRadius: 16,
        padding: 32,
        borderWidth: 1,
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    ctaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    ctaText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
