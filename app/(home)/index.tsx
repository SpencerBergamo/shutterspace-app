import AlbumCard from "@/components/albums/AlbumCover";
import { ASSETS } from "@/constants/assets";
import { useAlbums } from '@/context/AlbumsContext';
import { useAppTheme } from "@/context/AppThemeContext";
import { useProfile } from "@/context/ProfileContext";
import useFabStyles from "@/hooks/useFabStyles";
import getGridLayout from "@/utils/getGridLyout";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { Plus } from "lucide-react-native";
import { useMemo } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

export default function HomeScreen() {
    const { colors } = useAppTheme();
    const { profile } = useProfile();
    const { position, button, iconSize } = useFabStyles();
    const { width } = useWindowDimensions();
    const { albums } = useAlbums();

    const gridConfig = useMemo(() => getGridLayout({ width, columns: 2, gap: 16, aspectRatio: 1 }), [width]);

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
                data={albums}
                keyExtractor={(item) => item._id}
                numColumns={gridConfig.numColumns}
                columnWrapperStyle={gridConfig.columnWrapperStyle}
                contentContainerStyle={gridConfig.contentContainerStyle}
                style={{ padding: 16 }}
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
                renderItem={({ item }) => (
                    <AlbumCard
                        album={item}
                        width={gridConfig.tileWidth}
                        height={gridConfig.tileHeight}
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
