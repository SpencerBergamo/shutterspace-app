import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import FloatingActionButton from "@/src/components/FloatingActionButton";
import { useAlbums } from "@/src/context/AlbumsContext";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { useMedia } from "@/src/hooks/useMedia";
import GalleryTile from "@/src/screens/Album/components/GalleryTile";
import { validateAssets } from "@/src/utils/mediaHelper";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useAction, useMutation, useQuery } from "convex/react";
import { } from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as Orientation from 'expo-screen-orientation';
import { Images } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, Share, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { NotFoundScreen } from "../Home";
import AlbumSettingsSheet from "./components/AlbumSettingsSheet";

const GAP = 2;

export function AlbumScreen() {
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbum } = useAlbums();
    const album = getAlbum(albumId);
    const { media, pendingMedia, uploadMedia, removePendingMedia } = useMedia(albumId);
    const memberships = useQuery(api.albumMembers.getMemberships, albumId ? { albumId } : "skip");

    // Layout
    const [debouncedOrientation, setDebouncedOrientation] = useState<Orientation.Orientation>(Orientation.Orientation.PORTRAIT_UP);
    const { width } = useWindowDimensions();
    const { colors } = useAppTheme();

    // Refs
    const settingsModalRef = useRef<BottomSheetModal>(null);
    const lastConfigRef = useRef<{ itemSize: number, numColumns: number, gap: number } | null>(null);
    const orientationTimeoutRef = useRef<NodeJS.Timeout>(null);

    // States
    const [isCreatingInvite, setIsCreatingInvite] = useState(false);
    const [isLeavingAlbum, setIsLeavingAlbum] = useState(false);
    const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<Id<'media'>>>(new Set());

    // Convex
    const inviteCode = useQuery(api.inviteCodes.getInviteCode, { albumId }) ?? undefined;
    const leaveAlbum = useMutation(api.albumMembers.leaveAlbum);
    const deleteAlbum = useAction(api.albums.deleteAlbum);
    const deleteMedia = useAction(api.media.deleteMedia);

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

    // ------------------------------
    // Grid Layout
    // ------------------------------
    const gridConfig = useMemo(() => {
        const isPortrait = debouncedOrientation === Orientation.Orientation.PORTRAIT_UP ||
            debouncedOrientation === Orientation.Orientation.PORTRAIT_DOWN;

        const numColumns = isPortrait ? 3 : 5;

        // Calculate item size accounting for gaps between items only (not edges)
        const totalGapWidth = GAP * (numColumns - 1);
        const itemSize = (width - totalGapWidth) / numColumns;

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

    const mediaIds = useMemo(() => media?.map(m => m._id) ?? [], [media]);

    const albumCover = useMemo(() =>
        media?.find(m => m._id === album?.thumbnail) ?? null,
        [media, album?.thumbnail]
    );

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
        settingsModalRef.current?.present();
    }, []);

    const handleInviteMembers = useCallback(async () => {
        if (!album || isCreatingInvite) return;

        setIsCreatingInvite(true);
        try {
            if (!inviteCode) throw new Error("Invite wasn't created for this album");

            await Share.share({
                title: `You're invited to "${album.title}" on ShutterSpace!`,
                message: `https://shutterspace.app/invite/${inviteCode}`,
                url: `https://shutterspace.app/invite/${inviteCode}`,

            });
        } catch (e) {
            console.error("Failed to get the invite code", e);
            Alert.alert('Error', 'Failed to create invite link. Please try again.');
        } finally {
            setIsCreatingInvite(false);
        }
    }, [album, inviteCode, isCreatingInvite]);

    const handleLeaveAlbum = useCallback(async () => {
        setIsLeavingAlbum(true);
        try {
            await leaveAlbum({ albumId });
            settingsModalRef.current?.dismiss();
            router.back();
        } catch (e) {
            console.error("Failed to leave album: ", e);
        } finally {
            setIsLeavingAlbum(false);
        }
    }, [albumId]);

    const handleDeleteAlbum = useCallback(async () => {
        if (!album || album.isDeleted) return;

        try {
            setIsDeletingAlbum(true);
            settingsModalRef.current?.dismiss();
            await deleteAlbum({ albumId });
            router.back();
        } catch (e) {
            console.error("Failed to delete album: ", e);
            Alert.alert("Error", "Failed to delete album. Please try again.");
        } finally {
            setIsDeletingAlbum(false);
        }
    }, [albumId, deleteAlbum, settingsModalRef]);

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

        const displayMedia = media?.find(m => m._id === mediaId);
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

    if (!album || album.isDeleted) return <NotFoundScreen />

    const headerLeft = useMemo(() => selectionMode ? () => (
        <TouchableOpacity onPress={handleCancelSelection}>
            <Text style={{ fontSize: 17, color: colors.text }}>Cancel</Text>
        </TouchableOpacity>
    ) : undefined, [selectionMode, handleCancelSelection, colors.text]);

    const headerRight = useMemo(() => () => (
        selectionMode ? (
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
        )
    ), [selectionMode, handleSelectAll, handleSettingsPress, colors, albumId, memberships?.length]);

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
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Images size={48} color="#ccc" style={{ margin: 16 }} />

                        <Text style={styles.emptyTitle}>Ready to share memories?</Text>
                        <Text style={styles.emptySubtitle}>Tap the + button to add your first photo or video to this album</Text>
                    </View>
                }
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

            <AlbumSettingsSheet
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
            />
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
});
