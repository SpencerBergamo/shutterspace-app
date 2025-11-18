import FloatingActionButton from "@/components/FloatingActionButton";
import MediaTile from "@/components/media/mediaTile";
import { useProfile } from "@/context/ProfileContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAlbums } from "@/hooks/useAlbums";
import { useMedia } from "@/hooks/useMedia";
import getGridLayout from "@/utils/getGridLyout";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useAction, useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Images, Plus } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Share, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

export default function AlbumScreen() {

    // Layout
    const { theme } = useTheme();
    const { width } = useWindowDimensions();
    const gridConfig = useMemo(() => getGridLayout({ width, columns: 3, gap: 2, aspectRatio: 1 }), [width]);

    // Data
    const { profileId } = useProfile();
    const { getAlbumById } = useAlbums();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const album = getAlbumById(albumId);
    const { media, selectAndUploadAssets, inFlightUploads, removeInFlightUpload, } = useMedia(albumId);
    ``
    // Refs
    const flatListRef = useRef<FlatList>(null);
    const settingsModalRef = useRef<BottomSheetModal>(null);

    // States
    const [isCreatingInvite, setIsCreatingInvite] = useState(false);
    const [isLeavingAlbum, setIsLeavingAlbum] = useState(false);
    const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);

    // Convex
    const createInvite = useAction(api.inviteCodes.createInvite);
    const inviteCode = useQuery(api.inviteCodes.getInviteCode, { albumId });
    const leaveAlbum = useMutation(api.albumMembers.leaveAlbum);
    const deleteAlbum = useMutation(api.albums.deleteAlbum);

    const handleSettingsPress = useCallback(() => {
        settingsModalRef.current?.present();
    }, [settingsModalRef]);

    const handleInviteMembers = useCallback(async () => {
        if (!album || isCreatingInvite) return;

        setIsCreatingInvite(true);
        try {
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
    }, [album, createInvite, isCreatingInvite]);

    const handleViewMembers = useCallback(() => {
        settingsModalRef.current?.dismiss();
    }, []);

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

    const formattedDate = useMemo(() => {
        if (!album) return '';
        return new Date(album._creationTime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }, [album]);

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

    if (album.isDeleted) return (
        <View
            style={{ flex: 1, backgroundColor: theme.colors.background }}
        >
            <Stack.Screen options={{
                headerTitle: album.title,
            }} />

            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                {album.hostId === profileId ? (
                    <View style={{ flexDirection: 'column' }}>

                    </View>
                ) : (
                    <View></View>
                )}
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>

            {/* Header */}
            <Stack.Screen options={{
                headerTitle: album.title,
                headerRight: () => (
                    <TouchableOpacity onPress={handleSettingsPress}>
                        <Ionicons name="ellipsis-horizontal" size={24} />
                    </TouchableOpacity>
                )
            }} />

            {/* Media Grid */}
            <FlatList
                ref={flatListRef}
                data={media}
                keyExtractor={(item) => item._id}
                numColumns={gridConfig.numColumns}
                columnWrapperStyle={gridConfig.columnWrapperStyle}
                contentContainerStyle={gridConfig.contentContainerStyle}
                style={{ padding: 2 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Images size={48} color="#ccc" style={{ margin: 16 }} />

                        <Text style={styles.emptyTitle}>Ready to share memories?</Text>
                        <Text style={styles.emptySubtitle}>Tap the + button to add your first photo or video to this album</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const inFlightURI = inFlightUploads[item.assetId];

                    return (
                        <MediaTile
                            media={item}
                            onPress={() => {
                                router.push({
                                    pathname: '../viewer/[mediaId]',
                                    params: { mediaId: item._id, albumId: albumId },
                                });
                            }}
                            onLongPress={() => { }}
                            onReady={() => {
                                removeInFlightUpload(item._id);
                            }}
                            onError={() => { }}
                            inFlightURI={inFlightURI}
                        />
                    );
                }}
            />

            {/* Floating Action Button */}
            <FloatingActionButton
                render={() => <Plus size={24} color="white" />}
                onPress={selectAndUploadAssets}
            />

            {/* Settings Modal */}
            <BottomSheetModal
                ref={settingsModalRef}
                snapPoints={['85%']}
                enablePanDownToClose
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
                    contentContainerStyle={styles.modalContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Album Header with Thumbnail */}
                    <View style={styles.modalHeader}>
                        {album.thumbnail ? (
                            <Image
                                source={{ uri: 'placeholder' }} // You'll need to fetch the actual image URL
                                style={styles.thumbnailImage}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={styles.thumbnailPlaceholder}>
                                <Images size={48} color="#999999" />
                            </View>
                        )}
                        <View style={styles.thumbnailOverlay}>
                            <Text style={styles.overlayTitle} numberOfLines={2}>{album.title}</Text>
                            <View style={styles.overlayStats}>
                                <View style={styles.statBadge}>
                                    <Ionicons name="images" size={14} color="white" />
                                    <Text style={styles.statText}>{media.length}</Text>
                                </View>
                                <View style={styles.statBadge}>
                                    <Ionicons name="people" size={14} color="white" />
                                    <Text style={styles.statText}>1</Text>
                                </View>

                            </View>
                        </View>
                    </View>

                    {/* Album Info */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Ionicons name="calendar-outline" size={18} color="#666" />
                            <Text style={styles.infoText}>Created {formattedDate}</Text>
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
                            onPress={handleViewMembers}
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
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    modalHeader: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    thumbnailPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    thumbnailOverlay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    overlayTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    overlayStats: {
        flexDirection: 'row',
        gap: 12,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    infoSection: {
        backgroundColor: '#F9F9F9',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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