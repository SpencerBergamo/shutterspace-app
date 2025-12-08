import { api } from "@/convex/_generated/api";
import { ASSETS } from "@/src/constants/assets";
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
import { FlatList, Image, Modal, Platform, Share, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

export function HomeScreen() {
    // Layout
    const { colors } = useAppTheme();
    const { position, button, iconSize } = useFabStyles();
    const { width } = useWindowDimensions();
    // const gridConfig = useMemo(() => getGridLayout({ width, columns: width > MAX_WIDTH ? 3 : 2, gap: 16, aspectRatio: 1 }), [width, MAX_WIDTH]);
    const [orientation, setOrientation] = useState<Orientation.Orientation>(Orientation.Orientation.PORTRAIT_UP);

    // Data
    const { profile } = useProfile();
    const { albums } = useAlbums();
    const friendships = useQuery(api.friendships.getFriendships);

    // Constants
    const shareUrl = `https://shutterspace.app/shareId/${profile.shareCode}`;

    useEffect(() => {
        const subscription = Orientation.addOrientationChangeListener((event) => {
            setOrientation(event.orientationInfo.orientation);
        })

        Orientation.getOrientationAsync().then(setOrientation);

        return () => {
            Orientation.removeOrientationChangeListener(subscription);
        };
    }, []);

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
        if (friendships && friendships?.length > 0) return null;

        // Share Profile Card
        return (
            <TouchableOpacity
                style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.grey2,
                    borderRadius: 12,
                    padding: 12,
                }}
                onPress={async () => await Share.share({ url: shareUrl })}
            >
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                }}>
                    <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: colors.grey1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <Ionicons name="qr-code" size={20} color="white" />
                    </View>
                    <View style={{
                        flex: 1,
                        flexDirection: 'column',
                        gap: 4,
                    }}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: colors.text,
                        }}>
                            Share Profile
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '400',
                            color: colors.text + '80',
                        }} >
                            Share via QR Code or Link
                        </Text>
                    </View>


                    <Ionicons name="chevron-forward" size={24} color={colors.grey1} />
                </View>
            </TouchableOpacity>
        );
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                headerLeft: () => (
                    <Image
                        source={ASSETS.logo}
                        style={{ height: 32, width: 32 }}
                        resizeMode="contain"
                    />
                ),
                headerTitle: '',
                headerRight: () => (
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                    }}>
                        <Text style={{
                            fontSize: 18,
                            color: colors.text,
                        }}>
                            Hey, <Text style={{ fontSize: 18, fontWeight: '600', }}>{profile.nickname} 👋</Text>
                        </Text>
                        <TouchableOpacity
                            style={[styles.avatarContainer, {
                                backgroundColor: colors.secondary + '60'
                            }]}
                            onPress={() => router.push('/settings')}
                        >
                            <Text style={styles.avatarInitial}>{profile.nickname.charAt(0)}</Text>
                        </TouchableOpacity>
                    </View>
                )
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
                    <View style={styles.emptyContainer}>
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
                    </View>
                }
                ListHeaderComponent={renderHeader}
                ListHeaderComponentStyle={{
                    paddingVertical: 16,
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

            <View style={position}>
                <TouchableOpacity
                    style={button}
                    onPress={() => router.push('/new-album')}
                >
                    <Ionicons name="add" size={iconSize} color="white" />
                </TouchableOpacity>
            </View>

            <Modal
                visible={false}
                animationType="fade"
                transparent={true}
                onRequestClose={() => { }}
            >

            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
