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
                message: `Join my album "${album.title}" on ShutterSpace!`,
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

            {/* Settings Modal */}
            {/* <BottomSheetModal
                ref={settingsModalRef}
                snapPoints={['85%']}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: colors.background }}
                backdropComponent={(props) => (
                    <BottomSheetBackdrop
                        {...props}
                        disappearsOnIndex={-1}
                        appearsOnIndex={0}
                        pressBehavior="close"
                        onPress={() => settingsModalRef.current?.dismiss()}
                    />
                )}
            >
                <BottomSheetScrollView
                    contentContainerStyle={[styles.modalContent, {}]}
                    showsVerticalScrollIndicator={false}
                >
                    
                    <AlbumInfoCard
                        title={album.title}
                        cover={albumCover}
                        mediaCount={media.length + pendingMedia.length}
                    />

                    
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={18} color="#666" />
                            <Text style={styles.infoText}>Created {formatAlbumDate(album._creationTime)}</Text>
                        </View>
                        {album.description && (
                            <View style={styles.infoRow}>
                                <Ionicons name="document-text-outline" size={18} color="#666" />
                                <Text style={styles.infoText} numberOfLines={2}>{album.description}</Text>
                            </View>
                        )}
                        {album.dateRange && (
                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={18} color="#666" />
                                <Text style={styles.infoText}>
                                    {new Date(album.dateRange.start).toLocaleDateString()}
                                    {album.dateRange.end && ` - ${new Date(album.dateRange.end).toLocaleDateString()}`}
                                </Text>
                            </View>
                        )}
                        {album.location && (
                            <View style={styles.infoRow}>
                                <Ionicons name="location-outline" size={18} color="#666" />
                                <Text style={styles.infoText} numberOfLines={1}>
                                    {album.location.name || album.location.address || 'Location set'}
                                </Text>
                            </View>
                        )}
                    </View>

                    
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>

                        <TouchableOpacity
                            style={styles.settingsOption}
                            onPress={async () => {
                                settingsModalRef.current?.dismiss();

                                setTimeout(() => {
                                    router.push({
                                        pathname: './[albumId]/edit',
                                        params: { albumId: albumId },
                                    });
                                }, 200);
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#E8F5FF' }]}>
                                <Ionicons name="pencil" size={20} color="#0066CC" />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionTitle}>Edit Album</Text>
                                <Text style={styles.optionSubtitle}>Change title, description, and settings</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.settingsOption}
                            onPress={handleInviteMembers}
                            disabled={isCreatingInvite}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#FFF4E5' }]}>
                                <Ionicons name="person-add" size={20} color="#FF9500" />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionTitle}>
                                    {isCreatingInvite ? 'Creating invite...' : 'Invite Members'}
                                </Text>
                                <Text style={styles.optionSubtitle}>Share an invite link</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.settingsOption}
                            onPress={() => {
                                settingsModalRef.current?.dismiss();
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#F0E6FF' }]}>
                                <Ionicons name="people" size={20} color="#8E44AD" />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionTitle}>View Members</Text>
                                <Text style={styles.optionSubtitle}>See who's in this album</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                        </TouchableOpacity>
                    </View>

                    
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Manage</Text>

                        <TouchableOpacity
                            style={styles.settingsOption}
                            onPress={() => {
                                settingsModalRef.current?.dismiss();
                                setTimeout(() => {
                                    Alert.alert("Album Settings", "Where you will be able to change the album settings, including privacy, notifications, and more. Feature Coming Soon!");
                                }, 200);
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#F5F5F5' }]}>
                                <Ionicons name="settings" size={20} color="#8E8E93" />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionTitle}>Album Settings</Text>
                                <Text style={styles.optionSubtitle}>Privacy, notifications, and more</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.settingsOption}
                            onPress={() => {
                                settingsModalRef.current?.dismiss();
                                setTimeout(() => {
                                    Alert.alert("Download All", "Feature Coming Soon!");
                                }, 200);
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#E5F6FF' }]}>
                                <Ionicons name="download" size={20} color="#007AFF" />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionTitle}>Download All</Text>
                                <Text style={styles.optionSubtitle}>Save all photos to your device</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                        </TouchableOpacity>
                    </View>

                    
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Danger Zone</Text>

                        {album.hostId !== profileId ? (
                            <TouchableOpacity
                                style={[styles.settingsOption, styles.dangerOption]}
                                onPress={() => {
                                    Alert.alert(
                                        'Leave Album',
                                        'Are you sure you want to leave this album? You won\'t be able to access it unless you\'re invited again.',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Leave',
                                                style: 'destructive',
                                                onPress: handleLeaveAlbum,
                                            },
                                        ]
                                    );
                                }}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: '#FFE5E5' }]}>
                                    <Ionicons name="exit-outline" size={20} color="#FF3B30" />
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={[styles.optionTitle, { color: '#FF3B30' }]}>
                                        {isLeavingAlbum ? 'Leaving Album...' : 'Leave Album'}
                                    </Text>
                                    <Text style={styles.optionSubtitle}>Remove yourself from this album</Text>
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.settingsOption, styles.dangerOption]}
                                onPress={() => {
                                    Alert.alert(
                                        'Delete Album',
                                        'Are you sure you want to delete this album? This action cannot be undone and all photos will be removed.',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Delete',
                                                style: 'destructive',
                                                onPress: handleDeleteAlbum,
                                            },
                                        ]
                                    );
                                }}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: '#FFE5E5' }]}>
                                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={[styles.optionTitle, { color: '#FF3B30' }]}>
                                        {isDeletingAlbum ? 'Deleting Album...' : 'Delete Album'}
                                    </Text>
                                    <Text style={styles.optionSubtitle}>Delete this album and all its contents</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    
                    <View style={{ height: 32 }} />
                </BottomSheetScrollView>
            </BottomSheetModal> */}
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
