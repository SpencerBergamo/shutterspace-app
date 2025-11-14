import AlbumCard from "@/components/albums/AlbumCard";
import FloatingActionButton from "@/components/FloatingActionButton";
import HomeScreenHeader from "@/components/HomeScreenHeader";
import { useTheme } from "@/context/ThemeContext";
import { useAlbums } from "@/hooks/useAlbums";
import getGridLayout from "@/utils/getGridLyout";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { useMemo } from "react";
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from "react-native";

export default function HomeScreen() {
    const { width } = useWindowDimensions();
    const { theme } = useTheme();
    const { albums } = useAlbums();

    const gridConfig = useMemo(() => getGridLayout({ width, columns: 2, gap: 16, aspectRatio: 1 }), [width]);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <HomeScreenHeader />
            <FlatList
                data={albums}
                keyExtractor={(item) => item._id}
                numColumns={gridConfig.numColumns}
                columnWrapperStyle={gridConfig.columnWrapperStyle}
                contentContainerStyle={gridConfig.contentContainerStyle}
                style={{ paddingHorizontal: 16 }}
                scrollEnabled={albums.length > 0}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                                Welcome to Shutterspace!
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: theme.colors.caption }]}>
                                You don't have any albums yet.
                            </Text>
                            <Text style={[styles.emptyDescription, { color: theme.colors.caption }]}>
                                Create your first album to start sharing photos with friends and family.
                            </Text>
                            <View style={[styles.ctaContainer, { backgroundColor: theme.colors.background }]}>
                                <Plus size={20} color={theme.colors.primary} />
                                <Text style={[styles.ctaText, { color: theme.colors.primary }]}>
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
                        height={gridConfig.tileHeight} />
                )}
            />

            <FloatingActionButton
                render={() => <Plus size={24} color="white" />}
                onPress={() => router.push('/new-album')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        paddingTop: 12,
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
