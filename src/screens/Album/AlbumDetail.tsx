import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/src/context/AlbumsContext";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { useProfile } from "@/src/context/ProfileContext";
import useFabStyles from "@/src/hooks/useFabStyles";
import { PendingMedia, useMedia } from "@/src/hooks/useMedia";
import AlbumDeletionAlert from "@/src/screens/Album/components/AlbumDeletionAlert";
import GalleryTile from "@/src/screens/Album/components/GalleryTile";
import PendingGalleryTile from "@/src/screens/Album/components/PendingGalleryTile";
import { Media } from "@/src/types/Media";
import { validateAssets } from "@/src/utils/mediaHelper";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQuery } from "convex/react";
import { } from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as Orientation from 'expo-screen-orientation';
import { Images } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Platform, Share, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import AlbumSettingsSheet from "./components/AlbumSettingsSheet";

const GAP = 2;

export function AlbumScreen() {

    // Layout
    const [orientation, setOrientation] = useState<Orientation.Orientation>(Orientation.Orientation.PORTRAIT_UP);
    const { width } = useWindowDimensions();
    const { colors } = useAppTheme();
    const { position, button, iconSize } = useFabStyles();

    // Orientation Subscription
    useEffect(() => {
        const subscription = Orientation.addOrientationChangeListener((event) => {
            setOrientation(event.orientationInfo.orientation);
        });

        Orientation.getOrientationAsync().then(setOrientation);

        return () => {
            Orientation.removeOrientationChangeListener(subscription);
        };
    }, []);

    // Grid Layout
    const gridConfig = useMemo(() => {
        const isTablet = Platform.OS === 'ios'
            ? width >= 768  // iPad minimum width
            : width >= 600; // Android tablet threshold

        const isPortrait = orientation === Orientation.Orientation.PORTRAIT_UP ||
            orientation === Orientation.Orientation.PORTRAIT_DOWN;

        let numColumns: number;

        if (isTablet) {
            numColumns = isPortrait ? 6 : 8;
        } else {
            numColumns = isPortrait ? 3 : 5;
        }

        const itemSize = (width - (GAP * (numColumns - 1))) / numColumns;

        return {
            itemSize,
            numColumns,
            gap: GAP,
        };
    }, [width, orientation]);

    // Data
    const { profileId } = useProfile();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbum } = useAlbums();
    const album = getAlbum(albumId);
    const { media, pendingMedia, uploadMedia, removePendingMedia } = useMedia(albumId);

    // Refs
    const settingsModalRef = useRef<BottomSheetModal>(null);

    // States
    const [isCreatingInvite, setIsCreatingInvite] = useState(false);
    const [isLeavingAlbum, setIsLeavingAlbum] = useState(false);
    const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);
    const [isCancelingDeletion, setIsCancelingDeletion] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Convex
    const inviteCode = useQuery(api.inviteCodes.getInviteCode, { albumId }) ?? undefined;
    const leaveAlbum = useMutation(api.albumMembers.leaveAlbum);
    const deleteAlbum = useMutation(api.albums.deleteAlbum);
    const cancelDeletion = useMutation(api.albums.cancelAlbumDeletion);

    const albumCover = media.find(m => m._id === album?.thumbnail) ?? null;

    // Combine pending media with actual media for optimistic UI
    type DisplayItem =
        | { type: 'media'; data: Media; index: number }
        | { type: 'pending'; data: PendingMedia };

    const displayItems: DisplayItem[] = useMemo(() => {
        const items: DisplayItem[] = [];
        const processedAssetIds = new Set<string>();

        // Add pending media first (newest at top, sorted by timestamp descending)
        const sortedPending = [...pendingMedia].sort((a, b) => b.timestamp - a.timestamp);
        sortedPending.forEach(pending => {
            items.push({ type: 'pending', data: pending });
            processedAssetIds.add(pending.assetId);
        });

        // Add actual media (already sorted by Convex query in descending order)
        // Skip any that have a pending counterpart (shouldn't happen after cleanup effect)
        media.forEach((m, idx) => {
            if (!processedAssetIds.has(m.assetId)) {
                items.push({ type: 'media', data: m, index: idx });
            }
        });

        return items;
    }, [media, pendingMedia]);

    const handleMediaRetry = useCallback(async (mediaId: Id<'media'>) => {
        try {
            const item = media.find(m => m._id === mediaId);
            if (!item) throw new Error("Media not found");

            throw new Error("Not implemented");
        } catch (e) {
            console.error("Failed to retry media upload: ", e);
            Alert.alert("Failed Upload", "Failed to retry the upload. Please try again.");
        }
    }, [albumId, media]);

    const handleSettingsPress = useCallback(() => {
        settingsModalRef.current?.present();
    }, [settingsModalRef]);

    const handleInviteMembers = useCallback(async () => {
        if (!album || isCreatingInvite) return;

        setIsCreatingInvite(true);
        try {
            if (!inviteCode) throw new Error("Invite wasn't created for this album");

            await Share.share({
                title: `You're invited to "${album.title}" on ShutterSpace!`,
                message: `Join my album "${album.title}" https://shutterspace.app/invite/${inviteCode}!`,
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
        setIsDeletingAlbum(true);
        try {
            await deleteAlbum({ albumId });
            settingsModalRef.current?.dismiss();
        } catch (e) {
            console.error("Failed to delete album: ", e);
        } finally {
            setIsDeletingAlbum(false);
        }
    }, []);

    const handleCancelDeletion = useCallback(async () => {
        setIsCancelingDeletion(true);
        try {
            await cancelDeletion({ albumId });
            Alert.alert(
                'Album Restored',
                'Your album has been successfully restored and will not be deleted.',
                [{ text: 'OK' }]
            );
        } catch (e) {
            console.error("Failed to cancel deletion: ", e);
            Alert.alert(
                'Error',
                'Failed to restore the album. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsCancelingDeletion(false);
        }
    }, [albumId, cancelDeletion]);

    const handleMediaUpload = useCallback(async () => {
        try {
            const picker = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                allowsMultipleSelection: true,
                exif: true,
                videoMaxDuration: 60,
            });

            if (picker.canceled || !picker.assets || picker.assets.length === 0) return;
            const { valid, invalid } = await validateAssets(picker.assets);

            if (invalid.length > 0) {
                console.warn("Invalid assets: ", invalid.length);
                Alert.alert("Invalid assets", `${invalid.length} assets were invalid. Please try again.`);
            }

            await uploadMedia(valid);
        } catch (e) {
            console.error("Failed to upload media: ", e);
            Alert.alert("Error", "Some photos failed to upload. Please try again.");
        }
    }, [albumId]);

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
        const allMediaIds = displayItems
            .filter(item => item.type === 'media')
            .map(item => item.data._id);

        const allSelected = allMediaIds.length > 0 && allMediaIds.every(id => selectedItems.has(id));

        if (allSelected) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(allMediaIds));
        }
    }, [displayItems, selectedItems]);

    const renderItem = useCallback(({ item }: { item: DisplayItem }) => {
        if (item.type === 'pending') {
            return (
                <PendingGalleryTile
                    pendingMedia={item.data}
                    itemSize={gridConfig.itemSize}
                />
            );
        }

        const media = item.data;
        const isSelected = selectedItems.has(media._id);

        return (
            <GalleryTile
                media={media}
                itemSize={gridConfig.itemSize}
                onPress={() => handleTilePress(media._id, item.index)}
                onLongPress={() => handleLongPress(media._id)}
                onRetry={(mediaId) => {
                    Alert.alert("Upload Failed", "This asset failed to upload. Would you like to retry?", [
                        { text: "Retry", onPress: () => handleMediaRetry(mediaId) },
                        { text: "Delete", style: 'destructive', onPress: () => { } },
                        { text: "Cancel", style: 'cancel' },
                    ]);
                }}
                onReady={() => {
                    removePendingMedia(media.assetId);
                }}
                selectionMode={selectionMode}
                isSelected={isSelected}
            />
        );
    }, [displayItems, removePendingMedia, gridConfig.itemSize, selectionMode, selectedItems, handleTilePress, handleLongPress]);

    if (!album) return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
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
        <View style={{ flex: 1, backgroundColor: colors.background }}>

            {/* Header */}
            <Stack.Screen options={{
                headerTitle: selectionMode ? `${selectedItems.size} selected` : album.title,
                headerLeft: selectionMode ? () => (
                    <TouchableOpacity onPress={handleCancelSelection}>
                        <Text style={{ fontSize: 17, color: colors.text }}>Cancel</Text>
                    </TouchableOpacity>
                ) : undefined,
                headerRight: () => (
                    selectionMode ? (
                        <TouchableOpacity onPress={handleSelectAll}>
                            <Text style={{ fontSize: 17, color: colors.text }}>Select All</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleSettingsPress}>
                            <Ionicons name="ellipsis-horizontal" size={24} />
                        </TouchableOpacity>
                    )
                )
            }} />

            {/* Deletion Alert */}
            {album.isDeleted && (
                <AlbumDeletionAlert
                    isHost={album.hostId === profileId}
                    deletionDate={album.deletionScheduledAt ? new Date(album.deletionScheduledAt).toLocaleDateString() : "N/A"}
                    isCancelingDeletion={isCancelingDeletion}
                    handleCancelDeletion={handleCancelDeletion}
                />
            )}

            {/* Media Grid */}
            <FlatList
                data={displayItems}
                initialNumToRender={20}
                maxToRenderPerBatch={displayItems.length}
                keyExtractor={(item: DisplayItem) =>
                    item.type === 'pending' ? item.data.assetId : item.data.assetId
                }
                key={gridConfig.numColumns.toString()}
                numColumns={gridConfig.numColumns}
                columnWrapperStyle={{ gap: GAP }}
                contentContainerStyle={{ padding: 0 }}
                removeClippedSubviews={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Images size={48} color="#ccc" style={{ margin: 16 }} />

                        <Text style={styles.emptyTitle}>Ready to share memories?</Text>
                        <Text style={styles.emptySubtitle}>Tap the + button to add your first photo or video to this album</Text>
                    </View>
                }
                renderItem={renderItem}
            />

            {/* Floating Action Button */}
            {!selectionMode && (
                <View style={position}>
                    <TouchableOpacity
                        style={button}
                        onPress={handleMediaUpload}
                    >
                        <Ionicons name="add" size={iconSize} color="white" />
                    </TouchableOpacity>
                </View>
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
                                        onPress: () => {
                                            Alert.alert("Delete", "Feature coming soon!");
                                            handleCancelSelection();
                                        }
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
                mediaCount={media.length + pendingMedia.length}
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

    // Modal Styles
    modalContent: {
        padding: 20
    },
    infoSection: {
        // backgroundColor: '#F9F9F9',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 24,
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    settingsOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
    },
    dangerOption: {
        borderWidth: 1,
        borderColor: '#FFE5E5',
    },
    settingsOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#535252FF',
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
