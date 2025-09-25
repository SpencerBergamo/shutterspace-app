import FloatingActionButton from "@/components/FloatingActionButton";
import { useProfile } from "@/context/ProfileContext";
import { useSignedUrls } from "@/context/SignedUrlsContext";
import { useTheme } from "@/context/ThemeContext";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/hooks/useAlbums";
import { useMedia } from "@/hooks/useMedia";
import { DbMedia } from "@/types/Media";
import getGridLayout from "@/utils/getGridLyout";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { CircleEllipsis, CloudAlert, Images, Play } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

interface MediaTileProps {
    albumId: Id<'albums'>;
    media: DbMedia;
    width: number;
    height: number;
}

function MediaTile({ media, albumId, width, height }: MediaTileProps) {
    const { profileId } = useProfile();
    const { requestSignedEntry } = useSignedUrls();

    const type = media.identifier.type;
    const cloudflareId = type === 'image' ? media.identifier.imageId : media.identifier.videoUid;

    const [uri, setUri] = useState<string | undefined>(undefined);
    const [imageError, setImageError] = useState<boolean>(false);

    useEffect(() => {
        const signed = async () => {
            const cached = await requestSignedEntry({ albumId, profileId, mediaId: media._id, cloudflareId, type });
            if (cached) {
                if (type === 'video') {
                    setUri(`${process.env.CLOUDFLARE_STREAMS_BASE_URL}/thumbnails/thumbnail.jpg?token=${cached.value}`);
                } else if (type === 'image') {
                    setUri(cached.value);
                } else {
                    setImageError(true);
                }

                setImageError(false);
            } else {
                setUri(undefined);
                setImageError(true);
            }
        }

        signed();
    }, [media, uri, requestSignedEntry]);

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
            />

            {!uri && <View style={[styles.stackContainer, styles.mediaLoadingIndicator]}>
                <ActivityIndicator size="small" color="white" />
            </View>}

            {type === 'video' && <View style={[styles.stackContainer, styles.videoOverlay]}>
                <Play size={24} color="white" />
            </View>}
        </View>
    );
}

export default function AlbumScreen() {
    const { width } = useWindowDimensions();
    const { theme } = useTheme();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbumById } = useAlbums();
    const album = getAlbumById(albumId);
    const { media, selectAndUpload, inFlightUploads } = useMedia(albumId);

    const gridConfig = useMemo(() => getGridLayout({ width, columns: 3, gap: 2, aspectRatio: 1 }), [width]);
    const [showHeader] = useState<boolean>(false);
    const animatedHeaderHeight = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (inFlightUploads.length > 0) {
            const toValue = showHeader ? 0 : 70;
            Animated.timing(animatedHeaderHeight, {
                toValue,
                duration: 300,
                useNativeDriver: false,
            }).start();
        } else {
            animatedHeaderHeight.setValue(0);
        }
    }, [inFlightUploads, showHeader]);

    const renderHeader = useCallback(() => {
        const anyFailed = inFlightUploads.some(upload => upload.status === 'error');
        return (
            <Animated.View style={{ flex: 1, height: animatedHeaderHeight }}>
                <View style={{ flex: 1, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                    {anyFailed ? (
                        <View>
                            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 12 }} />
                            <Text>Uploading {inFlightUploads.length} photos...</Text>
                        </View>
                    ) : (
                        <View></View>
                    )}
                </View>
            </Animated.View>
        );
    }, [inFlightUploads, theme]);

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
            <FlatList
                data={media}
                keyExtractor={(item) => item._id}
                numColumns={gridConfig.numColumns}
                columnWrapperStyle={gridConfig.columnWrapperStyle}
                contentContainerStyle={gridConfig.contentContainerStyle}
                style={{ padding: 2 }}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Images size={48} color="#ccc" style={{ margin: 16 }} />

                        <Text style={styles.emptyTitle}>Ready to share memories?</Text>
                        <Text style={styles.emptySubtitle}>Tap the + button to add your first photo or video to this album</Text>
                    </View>
                }

                renderItem={({ item }) => <MediaTile
                    albumId={albumId}
                    media={item}
                    width={gridConfig.tileWidth}
                    height={gridConfig.tileHeight}
                />}
            />

            <FloatingActionButton icon="plus" onPress={selectAndUpload} />
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
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 4,
    },

    stackContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },

    mediaLoadingIndicator: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    videoOverlay: {
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: 12,
    },
});