import Thumbnail from "@/components/Thumbnail";
import { useProfile } from "@/context/ProfileContext";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/hooks/useAlbums";
import { useMedia } from "@/hooks/useMedia";
import { Media } from "@/types/Media";
import { getGridConfig } from "@/utils/getGridConfig";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Image, Info } from "lucide-react-native";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

export default function AlbumScreen() {
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { profile } = useProfile();
    const { columns, gap, width, height } = getGridConfig({});

    const { getAlbumById } = useAlbums();
    const album = getAlbumById(albumId);
    const { media, loadMore, canLoadMore, handleMediaSelection } = useMedia(albumId);

    function handleMediaPress(media: Media) {
        if ('status' in media) return;

        // Open Modal instead of screen
    }

    const renderTile = useCallback(({ item, index }: { item: Media, index: number }) => (
        <Pressable onPress={() => handleMediaPress(item)}>
            <Thumbnail media={item} size={width} />
        </Pressable>
    ), [width, height, handleMediaPress]);

    const canLoadMoreFooter = useCallback(() => {
        if (!canLoadMore) return null;

        return (
            <View style={{}}>
                <ActivityIndicator size="large" color="black" />
            </View>
        );
    }, [canLoadMore, loadMore]);

    return (
        <View>
            <Stack.Screen options={{
                headerTitle: 'Album Details',
                headerRight: () => (
                    <Pressable onPress={() => router.push(`/album/${albumId}/settings`)}>
                        <Info size={24} color="black" />
                    </Pressable>
                )
            }} />

            {media.length === 0 && (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIconContainer}>
                            <Image size={48} color="black" />
                        </View>
                        <View style={styles.emptyTextContainer}>
                            <Text style={styles.emptyTitle}>Ready to capture memories?</Text>
                            <Text style={styles.emptySubtitle}>Tap the + button to add your first photo or video to this album</Text>
                        </View>
                    </View>
                </View>
            )}

            <FlatList
                data={media}
                keyExtractor={(item) => item.filename}
                numColumns={columns}
                columnWrapperStyle={{ gap: gap }}
                contentContainerStyle={{ gap: gap }}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={canLoadMoreFooter}
                renderItem={renderTile} />

            {/* <FloatingButton onPress={handleMediaSelection} /> */}

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    footer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    emptyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#E5E5E5',
        maxWidth: 320,
        width: '100%',
    },
    emptyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#F0FDFD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    emptyTextContainer: {
        flex: 1,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666666',
        lineHeight: 20,
    },
});