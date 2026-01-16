import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import FloatingActionButton from "@/src/components/FloatingActionButton";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { useMedia } from "@/src/hooks/useMedia";
import GalleryTile from "@/src/screens/Album/components/GalleryTile";
import { Media } from "@/src/types/Media";
import { validateAssets } from "@/src/utils/mediaHelper";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useAction, useQuery } from "convex/react";
import { } from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as Orientation from 'expo-screen-orientation';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { NotFoundScreen } from "../Home";

const GAP = 2;

export function AlbumScreen() {
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();

    // Layout
    const [debouncedOrientation, setDebouncedOrientation] = useState<Orientation.Orientation>(Orientation.Orientation.PORTRAIT_UP);
    const { width } = useWindowDimensions();
    const { colors } = useAppTheme();

    // Data
    const album = useQuery(api.albums.queryAlbum, { albumId });
    const { media, pendingMedia, uploadMedia, removePendingMedia } = useMedia(albumId);
    const memberships = useQuery(api.albumMembers.getMemberships, albumId ? { albumId } : "skip");
    const deleteMedia = useAction(api.media.deleteMedia);

    // Refs
    const lastConfigRef = useRef<{ itemSize: number, numColumns: number, gap: number } | null>(null);
    const orientationTimeoutRef = useRef<NodeJS.Timeout>(null);

    // States
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<Id<'media'>>>(new Set());

    // Orientation Subscription
    useEffect(() => {
        const subscription = Orientation.addOrientationChangeListener((event) => {
            clearTimeout(orientationTimeoutRef.current as NodeJS.Timeout);
            orientationTimeoutRef.current = setTimeout(() => {
                setDebouncedOrientation(event.orientationInfo.orientation);
            }, 100);

        });

        Orientation.getOrientationAsync().then((init) => {
            setDebouncedOrientation(init);
        });

        return () => {
            Orientation.removeOrientationChangeListener(subscription);
            clearTimeout(orientationTimeoutRef.current as NodeJS.Timeout);
        };
    }, []);

    // --------------------------------
    // Media Map
    // --------------------------------
    const mediaMap: Map<Id<'media'>, Media> = useMemo(
        () => {
            if (!media) return new Map<Id<'media'>, Media>();
            const map = new Map();
            for (const m of media) {
                map.set(m._id, m);
            }
            return map;
        },
        [media]
    );

    const mediaIds = useMemo(() => Array.from(mediaMap.keys()), [mediaMap]);

    // ------------------------------
    // Grid Layout
    // ------------------------------
    const gridConfig = useMemo(() => {
        const isPortrait = debouncedOrientation === Orientation.Orientation.PORTRAIT_UP ||
            debouncedOrientation === Orientation.Orientation.PORTRAIT_DOWN;

        const numColumns = isPortrait ? 3 : 5;

        // Calculate item size accounting for gaps between items only (not edges)
        const totalGapWidth = GAP * (numColumns - 1);
        const itemSize = Math.ceil((width - totalGapWidth) / numColumns);

        const newConfig = { itemSize, numColumns, gap: GAP };
        if (
            !lastConfigRef.current ||
            lastConfigRef.current.itemSize !== newConfig.itemSize ||
            lastConfigRef.current.numColumns !== newConfig.numColumns
        ) {
            console.log(`${width}`, newConfig);
            lastConfigRef.current = newConfig;
        }

        return newConfig;
    }, [debouncedOrientation]);

    const handleMediaRetry = useCallback(async (mediaId: Id<'media'>) => {
        try {
            const item = media?.find(m => m._id === mediaId);
            if (!item) throw new Error("Media not found");

            throw new Error("Not implemented");
        } catch (e) {
            console.error("Failed to retry media upload: ", e);
            Alert.alert("Failed Upload", "Failed to retry the upload. Please try again.");
        }
    }, [albumId, media]);

    const handleDeleteMediaSelection = useCallback(async () => {
        try {
            for (const item of selectedItems) {
                await deleteMedia({ albumId, mediaId: item });
            }
        } catch (e) {
            console.error("Failed to delete media selection: ", e);
            Alert.alert("Failed to delete media selection", "Failed to delete the media selection. Please try again.");
        }
    }, [selectedItems, albumId, deleteMedia]);

    const handleSettingsPress = useCallback(() => {
        // settingsModalRef.current?.present();
        router.push(`album/${albumId}/settings`);
    }, []);

    const handleMediaUpload = useCallback(async (camera: boolean = false) => {
        try {
            let result: ImagePicker.ImagePickerResult;

            if (camera) {
                await ImagePicker.requestCameraPermissionsAsync();

                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images', 'videos'],
                    allowsMultipleSelection: true,
                    exif: true,
                    videoMaxDuration: 60,
                });
            } else {
                await ImagePicker.requestMediaLibraryPermissionsAsync();

                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images', 'videos'],
                    allowsMultipleSelection: true,
                    exif: true,
                    videoMaxDuration: 60,
                });
            }

            if (!result || result.canceled || !result.assets || result.assets.length === 0) return;
            const { valid, invalid } = await validateAssets(result.assets);

            if (invalid.length > 0) {
                console.warn("Invalid assets: ", invalid.length);
                Alert.alert("Invalid assets", `${invalid.length} assets were invalid. Please try again.`);
            }

            await uploadMedia(valid);
        } catch (e) {
            console.error("Failed to upload media: ", e);
            Alert.alert("Error", "Some photos failed to upload. Please try again.");
        }
    }, [uploadMedia]);

    const handleLongPress = useCallback((mediaId: Id<'media'>) => {
        setSelectionMode(true);
        setSelectedItems(new Set([mediaId]));
    }, []);

    const handleTilePress = useCallback((mediaId: Id<'media'>, index: number) => {
        if (selectionMode) {
            setSelectedItems(prev => {
                const next = new Set(prev);
                if (next.has(mediaId)) {
                    next.delete(mediaId);
                } else {
                    next.add(mediaId);
                }
                return next;
            });
        } else {
            router.push({
                pathname: '../viewer/[index]',
                params: { albumId: albumId, index: index.toString() },
            });
        }
    }, [selectionMode, albumId]);

    const handleCancelSelection = useCallback(() => {
        setSelectionMode(false);
        setSelectedItems(new Set());
    }, []);

    const handleSelectAll = useCallback(() => {
        const allMediaIds = media?.map(item => item._id);

        const allSelected = allMediaIds && allMediaIds.length > 0 && allMediaIds.every(id => selectedItems.has(id));

        if (allSelected) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(allMediaIds));
        }
    }, [media, selectedItems]);

    // Create a Map for O(1) placeholder lookups instead of O(n) .find()
    const placeholderMap = useMemo(() => {
        const map = new Map<string, string>();
        pendingMedia.forEach(p => map.set(p.assetId, p.uri));
        return map;
    }, [pendingMedia]);

    const renderItem = useCallback(({ mediaId, index }: { mediaId: Id<'media'>, index: number }) => {
        const isSelected = selectedItems.has(mediaId);
        const placeholder = placeholderMap.get(mediaId);

        const displayMedia = mediaMap.get(mediaId);
        if (!displayMedia) return null;

        return (
            <GalleryTile
                media={displayMedia}
                placeholder={placeholder}
                itemSize={gridConfig.itemSize}
                onPress={() => handleTilePress(mediaId, index)}
                onLongPress={() => { }}
                onRetry={handleMediaRetry}
                onReady={() => removePendingMedia(displayMedia.assetId)}
                selectionMode={selectionMode}
                isSelected={isSelected}
            />
        )
    }, [gridConfig.itemSize, gridConfig.numColumns, selectionMode, selectedItems, handleTilePress, handleMediaRetry, removePendingMedia, handleLongPress, placeholderMap]);

    const headerLeft = useCallback(() => {
        if (!selectionMode) return null;

        return (
            <TouchableOpacity onPress={handleCancelSelection}>
                <Text style={{ fontSize: 17, color: colors.text }}>Cancel</Text>
            </TouchableOpacity>
        )
    }, [selectionMode, handleCancelSelection, colors.text]);

    const headerRight = useCallback(() => {

        return selectionMode ? (
            <TouchableOpacity onPress={handleSelectAll}>
                <Text style={{ fontSize: 17, color: colors.text }}>Select All</Text>
            </TouchableOpacity>

        ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                    style={[styles.headerRightButton, { borderColor: colors.border }]}
                    onPress={() => router.push(`album/${albumId}/members`)}
                >
                    <Text style={[styles.headerRightButtonText, { color: colors.text }]}>{memberships?.length}</Text>
                    <Ionicons name="people-outline" size={18} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.headerRightButton, { borderColor: colors.border }]}
                    onPress={handleSettingsPress}
                >
                    <Ionicons name="ellipsis-horizontal" size={18} color={colors.text} />
                </TouchableOpacity>
            </View>
        );
    }, [selectionMode, handleSelectAll, handleSettingsPress, colors, albumId, memberships?.length]);

    if (album === undefined || media === undefined) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.text} />
            </View>
        )
    }

    if (!album) return <NotFoundScreen />;

    if (album.isDeleted) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <Stack.Screen options={{
                    headerTitle: album.title,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="chevron-back" size={28} color={colors.text} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => null,
                }} />
                <View style={[styles.deletedContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.deletedCard, { borderColor: colors.border }]}>
                        <Ionicons name="trash-outline" size={64} color={colors.text} style={{ opacity: 0.3 }} />
                        <Text style={[styles.deletedTitle, { color: colors.text }]}>Album Deleted</Text>
                        <Text style={[styles.deletedMessage, { color: colors.text }]}>
                            This album has been deleted and is no longer available.
                        </Text>
                        <TouchableOpacity
                            style={[styles.deletedButton, { backgroundColor: colors.primary }]}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.deletedButtonText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>

            {/* Header */}
            <Stack.Screen getId={({ params }) => params?.albumId} options={{
                headerTitle: selectionMode ? `${selectedItems.size} selected` : album.title,
                headerLeft,
                headerRight,
            }} />

            <FlashList
                key={`grid-${gridConfig.numColumns}`}
                data={mediaIds}
                keyExtractor={(item: Id<'media'>) => item}
                getItemType={() => 'media'}
                estimatedItemSize={gridConfig.itemSize}
                numColumns={gridConfig.numColumns}
                contentContainerStyle={{ paddingTop: GAP }}
                renderItem={({ item: mediaId }) => renderItem({ mediaId, index: mediaIds.indexOf(mediaId) })}
            />

            {/* Floating Action Button */}
            {!selectionMode && (
                <FloatingActionButton
                    selectIcon="add"
                    items={[
                        {
                            selectIcon: "image-outline",
                            label: "Add Photos",
                            onPress: handleMediaUpload,
                        },
                        {
                            selectIcon: "camera-outline",
                            label: "Take Photo",
                            onPress: () => handleMediaUpload(true),
                        },
                        {
                            selectIcon: "share-outline",
                            label: "Invite Friends",
                            onPress: () => {
                                router.push('friends');
                            }
                        },
                    ]}
                />
            )}

            {/* Selection Action Bar */}
            {selectionMode && (
                <View style={styles.selectionBar}>
                    <TouchableOpacity
                        style={styles.selectionButton}
                        onPress={() => {
                            Alert.alert("Share", "Feature coming soon!");
                        }}
                    >
                        <Ionicons name="share-outline" size={24} color={colors.text} />
                        <Text style={styles.selectionButtonText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.selectionButton}
                        onPress={() => {
                            Alert.alert("Download", "Feature coming soon!");
                        }}
                    >
                        <Ionicons name="download-outline" size={24} color={colors.text} />
                        <Text style={styles.selectionButtonText}>Download</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.selectionButton}
                        onPress={() => {
                            Alert.alert(
                                "Delete",
                                `Are you sure you want to delete ${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''}?`,
                                [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                        text: "Delete",
                                        style: "destructive",
                                        onPress: handleDeleteMediaSelection,
                                    }
                                ]
                            );
                        }}
                    >
                        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                        <Text style={[styles.selectionButtonText, { color: '#FF3B30' }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* <AlbumSettingsSheet
                ref={settingsModalRef}
                album={album}
                mediaCount={media?.length ?? 0 + pendingMedia.length}
                lastMedia={albumCover}
                handleInviteMembers={handleInviteMembers}
                handleLeaveAlbum={handleLeaveAlbum}
                handleDeleteAlbum={handleDeleteAlbum}
                isCreatingInvite={isCreatingInvite}
                isLeavingAlbum={isLeavingAlbum}
                isDeletingAlbum={isDeletingAlbum}
            /> */}
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

    // Upload Header Styles
    uploadHeader: {
        backgroundColor: '#F0F8FF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        overflow: 'hidden',
    },
    uploadHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 16,
    },
    uploadHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },

    headerRightButton: {
        padding: 8,
        borderWidth: 1,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    headerRightButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },

    // Selection Styles
    selectionBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        paddingVertical: 12,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    },
    selectionButton: {
        alignItems: 'center',
        gap: 4,
    },
    selectionButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },

    // Deleted Album Styles
    deletedContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 24,
    },
    deletedCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 32,
        alignItems: 'center',
        gap: 16,
        maxWidth: 400,
        width: '100%',
    },
    deletedTitle: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    deletedMessage: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.7,
        lineHeight: 22,
    },
    deletedButton: {
        marginTop: 8,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    deletedButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
