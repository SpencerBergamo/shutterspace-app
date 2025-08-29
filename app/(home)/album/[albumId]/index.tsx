/**
 * @title Album Screen
 * @description This React Component is the main screen for an album. This screen is dynamic
 * to the selected album.
 * 
 * 
 * 
 * 
 */

import FloatingActionButton from "@/components/FloatingActionButton";
import { useTheme } from "@/context/ThemeContext";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/hooks/useAlbums";
import { useMedia } from "@/hooks/useMedia";
import { DbMedia } from "@/types/Media";
import getGridLayout from "@/utils/getGridLyout";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { CircleEllipsis, Images } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

export default function AlbumScreen() {
    const { width } = useWindowDimensions();
    const { theme } = useTheme();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbumById } = useAlbums();

    const gridConfig = useMemo(() => getGridLayout({ width, columns: 3, gap: 2, aspectRatio: 1 }), [width]);
    const album = getAlbumById(albumId);

    const { media, uploadMedia, signedUrls, getType, renderSignature } = useMedia(albumId);

    if (!album) return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Stack.Screen options={{
                headerTitle: 'Album Not Found',
            }} />

            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>
                    This album may have been deleted or is not available.
                </Text>
            </View>
        </View>
    );

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

            {media.length > 0 ? (
                <FlatList
                    data={media}
                    keyExtractor={(item) => item._id}
                    numColumns={gridConfig.numColumns}
                    columnWrapperStyle={gridConfig.columnWrapperStyle}
                    contentContainerStyle={gridConfig.contentContainerStyle}
                    renderItem={({ item }) => (
                        <MediaTile media={item} renderSignature={renderSignature} />
                    )} />
            ) : (
                <View style={styles.emptyContainer}>

                    <Images size={48} color="#ccc" style={{ margin: 16 }} />

                    <Text style={styles.emptyTitle}>Ready to share memories?</Text>
                    <Text style={styles.emptySubtitle}>Tap the + button to add your first photo or video to this album</Text>
                </View>
            )}

            <FloatingActionButton icon="plus" onPress={uploadMedia} />

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

function MediaTile({ media, renderSignature }: { media: DbMedia, renderSignature: (media: DbMedia) => Promise<string | undefined> }) {
    const [uri, setUri] = useState<string | undefined>(undefined);

    useEffect(() => {
        (async () => {
            const signed = await renderSignature(media);
            setUri(signed);
        })();
    }, []);

    return (
        <View>
            {uri ? (
                <Image
                    source={{ uri }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                />
            ) : (
                <ActivityIndicator size="small" color="black" />
            )}
        </View>
    );


}