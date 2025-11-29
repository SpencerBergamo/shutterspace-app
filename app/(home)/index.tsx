import AlbumCard from "@/components/albums/AlbumCover";
import HomeScreenHeader from "@/components/HomeScreenHeader";
import { useAlbums } from '@/context/AlbumsContext';
import useAppStyles from "@/hooks/useAppStyles";
import useFabStyles from "@/hooks/useFabStyles";
import getGridLayout from "@/utils/getGridLyout";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { useMemo } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

export default function HomeScreen() {
    const { colorScheme } = useAppStyles();
    const { position, button, iconSize } = useFabStyles();
    const { width } = useWindowDimensions();
    const { albums } = useAlbums();

    const gridConfig = useMemo(() => getGridLayout({ width, columns: 2, gap: 16, aspectRatio: 1 }), [width]);

    return (
        <View style={[styles.container, { backgroundColor: colorScheme.background }]}>
            <HomeScreenHeader />

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
                        <View style={[styles.emptyCard, { backgroundColor: colorScheme.background, borderColor: colorScheme.border }]}>
                            <Text style={[styles.emptyTitle, { color: colorScheme.text }]}>
                                Welcome to Shutterspace!
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: colorScheme.text }]}>
                                You don't have any albums yet.
                            </Text>
                            <Text style={[styles.emptyDescription, { color: colorScheme.text }]}>
                                Create your first album to start sharing photos with friends and family.
                            </Text>
                            <View style={[styles.ctaContainer, { backgroundColor: colorScheme.background }]}>
                                <Plus size={20} color={colorScheme.primary} />
                                <Text style={[styles.ctaText, { color: colorScheme.primary }]}>
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
                    <Ionicons name="add" size={iconSize} color={colorScheme.surface} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
