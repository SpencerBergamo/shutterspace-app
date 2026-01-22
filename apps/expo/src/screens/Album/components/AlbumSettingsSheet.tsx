import { api } from "@shutterspace/backend/convex/_generated/api";
import { MAX_WIDTH } from "@/src/constants/styles";
import { useAppTheme } from "@/src/context/AppThemeContext";
import useSignedUrls from "@/src/hooks/useSignedUrls";
import { Album } from "@/src/types/Album";
import { Media } from "@/src/types/Media";
import { formatAlbumDate } from "@/src/utils/formatters";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";


interface AlbumSettingsSheetProps {
    ref: React.RefObject<BottomSheetModal | null>;
    album: Album;
    mediaCount: number;
    lastMedia: Media | null;
    handleInviteMembers: () => void;
    handleLeaveAlbum: () => void;
    handleDeleteAlbum: () => void;
    isCreatingInvite: boolean;
    isLeavingAlbum: boolean;
    isDeletingAlbum: boolean;
}

export default function AlbumSettingsSheet({
    ref,
    album,
    mediaCount,
    lastMedia,
    handleInviteMembers,
    handleLeaveAlbum,
    handleDeleteAlbum,
    isCreatingInvite,
    isLeavingAlbum,
    isDeletingAlbum,
}: AlbumSettingsSheetProps) {
    const { colors } = useAppTheme();
    const profile = useQuery(api.profile.getUserProfile);
    if (!profile) return null;

    const { width } = useWindowDimensions();

    const { requesting, thumbnail: albumCover } = useSignedUrls({ media: lastMedia ?? undefined });

    const handleActionPress = (func: () => void) => {
        ref.current?.dismiss();
        setTimeout(() => {
            func();
        }, 200);
    }

    return (
        <BottomSheetModal
            ref={ref}
            snapPoints={['85%']}
            enablePanDownToClose
            backgroundStyle={{ backgroundColor: colors.background }}
            backdropComponent={(props) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    pressBehavior="close"
                    onPress={() => ref.current?.dismiss()}
                />
            )}
        >
            <BottomSheetScrollView
                contentContainerStyle={[styles.modalContent, {}]}
                showsVerticalScrollIndicator={false}
            >
                {/* Album Header with Thumbnail */}
                {lastMedia === null || albumCover === null || width > MAX_WIDTH ? (
                    <View
                        style={[styles.emptyCoverContainer, { borderColor: colors.grey2 }]}
                    >
                        <Text style={[styles.albumCoverTitle, { color: colors.text }]}>
                            {album.title}
                        </Text>

                        <View style={[styles.albumCoverStats, { backgroundColor: colors.grey1 }]}>
                            <Ionicons name="images" size={14} color="white" />
                            <Text style={[styles.statText, { color: 'white' }]}>
                                {mediaCount}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.albumCoverContainer}>
                        {requesting && (
                            <View style={styles.albumCoverLoading}>
                                <ActivityIndicator size="small" color="grey" />
                            </View>
                        )}

                        <Image
                            source={{ uri: albumCover, cacheKey: lastMedia?._id }}
                            style={styles.albumCoverImage}
                            contentFit="cover"
                            cachePolicy={'memory-disk'}
                        />

                        <View style={styles.albumCoverOverlay}>
                            <Text style={[styles.albumCoverTitle, { color: 'white' }]} numberOfLines={2}>
                                {album.title}
                            </Text>

                            <View style={styles.statBadge}>
                                <Ionicons name="images" size={14} color="white" />
                                <Text style={[styles.statText, { color: 'white' }]}>{mediaCount}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Album Info */}
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

                {/* Quick Actions Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <TouchableOpacity
                        style={styles.settingsOption}
                        onPress={() => handleActionPress(() => router.push({
                            pathname: './[albumId]/edit',
                            params: { albumId: album._id },
                        }))}
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

                    {/* <TouchableOpacity
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
                        <Ionicons name="share-outline" size={20} color="#C7C7CC" />
                    </TouchableOpacity> */}

                    <TouchableOpacity
                        style={styles.settingsOption}
                        onPress={() => handleActionPress(() => router.push(`album/${album._id}/members`))}
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

                    {/* <TouchableOpacity
                        style={styles.settingsOption}
                        onPress={() => {
                            ref.current?.dismiss();
                        }}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#F5F5F5' }]}>
                            <Ionicons name="lock-closed" size={20} color="#8E8E93" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Pause Album</Text>
                            <Text style={styles.optionSubtitle}>Prevent members from adding new photos and new members</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity> */}
                </View>

                {/* Manage Section */}
                {/* <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Manage</Text>

                    <TouchableOpacity
                        disabled
                        style={styles.settingsOption}
                        onPress={() => { }}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#F5F5F5' }]}>
                            <Ionicons name="settings" size={20} color="#8E8E93" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Album Settings</Text>
                            <Text style={styles.optionSubtitle}>Privacy, notifications, and more</Text>
                        </View>
                        <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: '600' }}>COMING SOON</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        disabled
                        style={styles.settingsOption}
                        onPress={() => { }}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#E5F6FF' }]}>
                            <Ionicons name="download" size={20} color="#007AFF" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>Download All</Text>
                            <Text style={styles.optionSubtitle}>Save all photos to your device</Text>
                        </View>
                        <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: '600' }}>COMING SOON</Text>
                    </TouchableOpacity>
                </View> */}

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Danger Zone</Text>

                    {album.hostId !== profile._id ? (
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
                                            onPress: () => handleActionPress(handleLeaveAlbum),
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
                                            onPress: () => handleActionPress(handleDeleteAlbum),
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

                {/* Bottom spacing */}
                <View style={{ height: 32 }} />
            </BottomSheetScrollView>
        </BottomSheetModal>
    )
}

const styles = StyleSheet.create({

    emptyCoverContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 8,
    },
    albumCoverContainer: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
    },
    albumCoverLoading: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    albumCoverImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    albumCoverOverlay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 16,
    },
    albumCoverTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    albumCoverStats: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
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
        fontSize: 13,
        fontWeight: '600',
    },


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
})