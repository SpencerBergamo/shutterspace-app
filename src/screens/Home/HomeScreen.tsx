import { api } from "@/convex/_generated/api";
import { QRCodeModal } from "@/src/components/QRCodeModal";
import { useAlbums } from '@/src/context/AlbumsContext';
import { useAppTheme } from "@/src/context/AppThemeContext";
import { useProfile } from "@/src/context/ProfileContext";
import useFabStyles from "@/src/hooks/useFabStyles";
import AlbumCover from "@/src/screens/Album/components/AlbumCover";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router, Stack } from "expo-router";
import * as Orientation from 'expo-screen-orientation';
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { AddFriendsPrompt } from "./components/AddFriendsPrompt";
import { HeaderLeftComponent } from "./components/Navbar";

export function HomeScreen() {
    // Layout
    const { colors } = useAppTheme();
    const { position, button, iconSize } = useFabStyles();
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
        const friendCount = friendships?.length ?? 0;

        // Show prompt for users with fewer than 5 friends
        if (friendCount >= 5) return null;

        return (
            <AddFriendsPrompt
                friendCount={friendCount}
                onPress={() => setQrModalVisible(true)}
            />
        );
    }, [friendships]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                headerLeft: () => (
                    <HeaderLeftComponent
                        nickname={profile.nickname}
                        avatar={profile.avatarKey}
                        onPress={() => router.push('settings')}
                        onCompleteProfilePress={() => router.push('profile/edit')}
                    />
                ),
                headerTitle: '',
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => setQrModalVisible(true)}
                        style={[styles.headerRight, { backgroundColor: colors.background, shadowColor: colors.shadow }]}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="qr-code" size={24} color={colors.grey1} />
                    </TouchableOpacity>
                )
            }} />

            < FlatList
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
                    < View style={styles.emptyContainer} >
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
                renderItem={({ item }) => (
                    <AlbumCover
                        album={item}
                        width={gridConfig.itemSize}
                        height={gridConfig.itemSize}
                        onPress={() => router.push(`/album/${item._id}`)}
                    />
                )}
            />

            < View style={position} >
                <TouchableOpacity
                    style={button}
                    onPress={() => router.push('/new-album')}
                >
                    <Ionicons name="add" size={iconSize} color="white" />
                </TouchableOpacity>
            </View >

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

    headerRight: {
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 1,
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
