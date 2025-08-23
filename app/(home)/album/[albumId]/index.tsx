import Thumbnail from "@/components/Thumbnail";
import { useProfile } from "@/context/ProfileContext";
import { useTheme } from "@/context/ThemeContext";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/hooks/useAlbums";
import { useMedia } from "@/hooks/useMedia";
import { Media } from "@/types/Media";
import getGridLayout from "@/utils/getGridLyout";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { CircleEllipsis, Images, Plus } from "lucide-react-native";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

export default function AlbumScreen() {
    const { getAlbumById } = useAlbums();
    const { profile } = useProfile();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { theme } = useTheme();
    const gridConfig = getGridLayout();

    const album = getAlbumById(albumId);

    const { media, loadMore, canLoadMore, handleMediaSelection } = useMedia(albumId);

    function handleMediaPress(media: Media) {
        if ('status' in media) return;

        // Open Modal instead of screen
    }

    const renderTile = useCallback(({ item, index }: { item: Media, index: number }) => (
        <Pressable onPress={() => handleMediaPress(item)}>
            <Thumbnail media={item} size={gridConfig.tileWidth} />
        </Pressable>
    ), [gridConfig.tileWidth, handleMediaPress]);

    const canLoadMoreFooter = useCallback(() => {
        if (!canLoadMore) return null;

        return (
            <View style={{}}>
                <ActivityIndicator size="large" color="black" />
            </View>
        );
    }, [canLoadMore, loadMore]);

    if (!album) return null;

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Stack.Screen options={{
                headerTitle: album.title,
                headerRight: () => (
                    <Pressable onPress={() => router.push(`/album/${albumId}/settings`)}>
                        <CircleEllipsis size={24} color="black" />
                    </Pressable>
                )
            }} />

            {media.length === 0 ? (
                <View style={styles.emptyContainer}>

                    <Images size={48} color="#ccc" style={{ margin: 16 }} />

                    <Text style={styles.emptyTitle}>Ready to share memories?</Text>
                    <Text style={styles.emptySubtitle}>Tap the + button to add your first photo or video to this album</Text>
                </View>

            ) : (
                <FlatList
                    data={media}
                    keyExtractor={(item) => item.filename}
                    numColumns={gridConfig.numColumns}
                    columnWrapperStyle={gridConfig.columnWrapperStyle}
                    contentContainerStyle={gridConfig.contentContainerStyle}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={canLoadMoreFooter}
                    renderItem={renderTile} />
            )}

            <Pressable onPress={() => { }} style={theme.styles.fab} >
                <Plus size={24} color={theme.colors.secondary} />
            </Pressable>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Empty Container Styles
    emptyContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        margin: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 48,
        borderWidth: 2,
        borderColor: '#E5E5E5',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666666',
        lineHeight: 20,
        textAlign: 'center',
    },

    footer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});