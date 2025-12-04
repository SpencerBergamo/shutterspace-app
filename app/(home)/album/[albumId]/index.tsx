import AlbumDeletionAlert from "@/components/albums/AlbumDeletionAlert";
import AlbumInfoCard from "@/components/albums/AlbumInfoCard";
import GalleryTile from "@/components/media/GalleryTile";
import { MAX_WIDTH } from "@/constants/styles";
import { useAlbums } from "@/context/AlbumsContext";
import { useAppTheme } from "@/context/AppThemeContext";
import { useProfile } from "@/context/ProfileContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import useFabStyles from "@/hooks/useFabStyles";
import { useMedia } from "@/hooks/useMedia";
import { Media } from "@/types/Media";
import { formatAlbumData } from "@/utils/formatters";
import { validateAssets } from "@/utils/mediaHelper";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Images } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Dimensions, FlatList, Share, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const GAP = 1;

export default function AlbumScreen() {

    // Layout
    const { width } = useWindowDimensions();

    const { colors } = useAppTheme();
    const { position, button, iconSize } = useFabStyles();
    const itemSize: number = useMemo(() => {
        return (SCREEN_WIDTH - (GAP * 2)) / NUM_COLUMNS;
    }, [width]);

    // Data
    const { profileId } = useProfile();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { getAlbum } = useAlbums();
    const album = getAlbum(albumId);
    const { media, uploadMedia, inFlightUploads, removeInFlightUpload, } = useMedia(albumId);

    // Refs
    const flatListRef = useRef<FlatList>(null);
    const settingsModalRef = useRef<BottomSheetModal>(null);

    // States
    const [isCreatingInvite, setIsCreatingInvite] = useState(false);
    const [isLeavingAlbum, setIsLeavingAlbum] = useState(false);
    const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);
    const [isCancelingDeletion, setIsCancelingDeletion] = useState(false);

    // Convex
    const inviteCode = useQuery(api.inviteCodes.getInviteCode, { albumId }) ?? undefined;
    const leaveAlbum = useMutation(api.albumMembers.leaveAlbum);
    const deleteAlbum = useMutation(api.albums.deleteAlbum);
    const cancelDeletion = useMutation(api.albums.cancelAlbumDeletion);

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

            const { invalid, valid } = validateAssets(picker.assets);

            if (invalid.length > 0) {
                console.warn("Invalid assets: ", invalid.length);
            }

            await uploadMedia(valid);
        } catch (e) {
            console.error("Failed to upload media: ", e);
            Alert.alert("Error", "Some photos failed to upload. Please try again.");
        }
    }, [albumId]);

    const renderMedia = useCallback(({ item, index }: { item: Media, index: number }) => {
        const inFlightUri: string | undefined = inFlightUploads[item.assetId] ?? undefined;
        if (inFlightUri) console.log("inFlight: ", index, item.filename);

        return (
            <GalleryTile
                media={item}
                itemSize={itemSize}
                placeholder={inFlightUri}
                onPress={() => {
                    router.push({
                        pathname: '../viewer/[mediaId]',
                        params: { mediaId: albumId, index: index.toString() },
                    })
                }}
                onLongPress={() => { }}
                onRetry={(mediaId) => {
                    Alert.alert("Upload Failed", "This asset failed to upload. Would you like to retry?", [
                        { text: "Retry", onPress: () => handleMediaRetry(mediaId) },
                        { text: "Delete", style: 'destructive', onPress: () => { } },
                        { text: "Cancel", style: 'cancel' },
                    ]);
                }}
                onReady={() => {
                    removeInFlightUpload(item.assetId);
                }}
            />
        );

    }, [media, inFlightUploads, removeInFlightUpload]);

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
                headerTitle: album.title,
                headerRight: () => (
                    <TouchableOpacity onPress={handleSettingsPress}>
                        <Ionicons name="ellipsis-horizontal" size={24} />
                    </TouchableOpacity>
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
                ref={flatListRef}
                data={media}
                initialNumToRender={20}
                maxToRenderPerBatch={media.length}
                keyExtractor={(item: Media) => item._id}
                numColumns={NUM_COLUMNS}
                columnWrapperStyle={{ gap: GAP }}
                contentContainerStyle={{ padding: 0 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Images size={48} color="#ccc" style={{ margin: 16 }} />

                        <Text style={styles.emptyTitle}>Ready to share memories?</Text>
                        <Text style={styles.emptySubtitle}>Tap the + button to add your first photo or video to this album</Text>
                    </View>
                }
                renderItem={renderMedia}
            />

            {/* Floating Action Button */}
            <View style={position}>
                <TouchableOpacity
                    style={button}
                    onPress={handleMediaUpload}
                >
                    <Ionicons name="add" size={iconSize} color="white" />
                </TouchableOpacity>
            </View>

            {/* Settings Modal */}
            <BottomSheetModal
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
                    {/* Album Header with Thumbnail */}
                    {width < MAX_WIDTH && (<AlbumInfoCard
                        album={album}
                        cover={media.find(m => m._id === album.thumbnail)}
                    />)}

                    {/* Album Info */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={18} color="#666" />
                            <Text style={styles.infoText}>Created {formatAlbumData(album._creationTime)}</Text>
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

                    {/* Quick Actions Section */}
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

                    {/* Manage Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Manage</Text>

                        <TouchableOpacity
                            style={styles.settingsOption}
                            onPress={() => {
                                settingsModalRef.current?.dismiss();
                                // Navigate to album settings
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
                                // Navigate to download options
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

                    {/* Danger Zone */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Danger Zone</Text>

                        {/* Show Leave or Delete based on user role */}
                        {album.hostId !== profileId ? ( // Replace with actual user ID check
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
                                    <Text style={styles.optionSubtitle}>Permanently delete this album</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Bottom spacing */}
                    <View style={{ height: 32 }} />
                </BottomSheetScrollView>
            </BottomSheetModal>
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
        alignItems: 'center',
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
});
