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
import { useCallback, useMemo, useRef } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

export default function AlbumScreen() {
    const { width } = useWindowDimensions();
    const { theme } = useTheme();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbumById } = useAlbums();

    const gridConfig = useMemo(() => getGridLayout({ width, columns: 3, gap: 2, aspectRatio: 1 }), [width]);
    const album = getAlbumById(albumId);

    const signatureCache = useRef(new Map<string, { uri: string; expiresAt: number }>());
    const { media, uploadImage, getSignedURL } = useMedia(albumId);

    const preSignURLs = useCallback(async (mediaItems: DbMedia[]) => {
        const currentTime = Date.now();
        const ttl = 1000 * 60 * 60 * 24; // Time to live for24 hours

        const itemsToSign = mediaItems.filter(item => {
            const cached = signatureCache.current.get(item._id);
            return !cached || cached.expiresAt < currentTime;
        });

        if (itemsToSign.length === 0) return;

        const signingPromises = itemsToSign.map(async (item) => {
            try {
                const signedURL = await getSignedURL(item);
                signatureCache.current.set(item._id, {
                    uri: signedURL,
                    expiresAt: currentTime + ttl,
                });
            } catch (e) {
                console.error('Failed to sign URL for ', item._id, e);
            }
        });

        await Promise.all(signingPromises);
    }, [getSignedURL]);


    useMemo(() => {
        if (media.length > 0) {
            preSignURLs(media.slice(0, 100));
        }
    }, [media, preSignURLs]);

    const getSignedUrlForItem = useCallback((item: DbMedia) => {
        const cached = signatureCache.current.get(item._id);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.uri;
        }

        preSignURLs([item]);
        return null;
    }, [preSignURLs]);


    if (!album) return null;

    const renderMediaList = useMemo(() => (
        <FlatList
            data={media}
            keyExtractor={(item) => item._id}
            numColumns={gridConfig.numColumns}
            columnWrapperStyle={gridConfig.columnWrapperStyle}
            contentContainerStyle={gridConfig.contentContainerStyle}
            onEndReached={() => {
                const currentLength = media.length;
                const newItems = media.slice(currentLength, currentLength + 30);
                preSignURLs(newItems);
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={canLoadMoreFooter}
            renderItem={({ item }) => (
                <View style={{ flex: 1, backgroundColor: '#9C9C9CFF' }}>
                    <Image
                        source={{ uri: getSignedUrlForItem(item) }} />
                </View>
            )} />
    ), [{}, gridConfig]);

    const canLoadMoreFooter = () => {
        if (!false) return null;

        return (
            <View style={{ marginVertical: 16, width: '100%', height: 150, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="black" />
            </View>
        );
    };

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

            {media.length > 0 ? renderMediaList : (
                <View style={styles.emptyContainer}>

                    <Images size={48} color="#ccc" style={{ margin: 16 }} />

                    <Text style={styles.emptyTitle}>Ready to share memories?</Text>
                    <Text style={styles.emptySubtitle}>Tap the + button to add your first photo or video to this album</Text>
                </View>
            )}

            <FloatingActionButton icon="plus" onPress={uploadImage} />

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