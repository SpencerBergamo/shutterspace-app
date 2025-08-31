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
import { useSignedUrls } from "@/context/SignedUrlsContext";
import { useTheme } from "@/context/ThemeContext";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/hooks/useAlbums";
import { useMedia } from "@/hooks/useMedia";
import { DbMedia, OptimisticMedia } from "@/types/Media";
import getGridLayout from "@/utils/getGridLyout";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { CircleEllipsis, CloudAlert, Images } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

interface MediaTileProps {
    media: DbMedia;
    renderImageURL: (media: DbMedia) => Promise<string | undefined>;
    width: number;
    height: number;
}

function MediaTile({ media, renderImageURL, width, height }: MediaTileProps) {
    const { getSignedUrl } = useSignedUrls();

    const type = media.asset.type;
    const mediaId = type === 'image' ? media.asset.imageId : media.asset.videoUid;

    const [uri, setUri] = useState<string | undefined>(undefined);
    const [imageError, setImageError] = useState<boolean>(false);

    useEffect(() => {
        const signed = getSignedUrl(mediaId);
        if (signed) {
            setUri(signed);
            setImageError(false);
        }
    }, [media._id, renderImageURL, uri]);

    const loadImage = useCallback(async () => {
        console.log("Loading Image: ", media._id);
        try {

            const signed = await renderImageURL(media);
            if (signed) {
                setUri(signed);
                setImageError(false);
            }
        } catch (e) {
            console.error("Error loading image: ", e);
            setImageError(true);
        }
    }, []);

    if (imageError) return (
        <View style={[styles.mediaTile, { width, height }]}>
            <CloudAlert size={24} color="red" />
        </View>
    );

    return (
        <View style={[styles.mediaTile, { width, height }]}>
            <Image
                source={{ uri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy="memory-disk"
                onError={loadImage}
            />

            {!uri && <ActivityIndicator size="small" color="white" />}
        </View>
    );
}

function OptimisticMediaTile({ media, width, height }: { media: OptimisticMedia, width: number; height: number }) {

    return (
        <View style={[styles.mediaTile, { width, height }]}>
            <Image
                source={{ uri: media.file.uri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
            />

            {media.status === 'pending' && <ActivityIndicator size="small" color="white" />}
        </View>
    );
}

export default function AlbumScreen() {
    const { width } = useWindowDimensions();
    const { theme } = useTheme();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbumById } = useAlbums();
    const album = getAlbumById(albumId);
    const { media, uploadMedia, renderImageURL } = useMedia(albumId);

    const gridConfig = useMemo(() => getGridLayout({ width, columns: 3, gap: 2, aspectRatio: 1 }), [width]);

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
                    renderItem={({ item }) => {
                        if ('file' in item) {
                            return <OptimisticMediaTile
                                media={item}
                                width={gridConfig.tileWidth}
                                height={gridConfig.tileHeight}
                            />
                        }

                        return <MediaTile
                            media={item}
                            renderImageURL={renderImageURL}
                            width={gridConfig.tileWidth}
                            height={gridConfig.tileHeight}
                        />
                    }}

                />
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

    // Media Tile Styles
    mediaTile: {
        justifyContent: 'center',
        alignItems: 'center',
    }
});