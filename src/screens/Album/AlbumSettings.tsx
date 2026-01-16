import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { formatAlbumDate } from "@/src/utils/formatters";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAction, useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export function AlbumSettingsScreen() {
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();
    const { colors } = useAppTheme();
    const profile = useQuery(api.profile.getUserProfile);
    const album = useQuery(api.albums.queryAlbum, { albumId });
    if (!profile || !album) return null;

    const leaveAlbum = useMutation(api.albumMembers.leaveAlbum);
    const deleteAlbum = useAction(api.albums.deleteAlbum);

    const [isLeavingAlbum, setIsLeavingAlbum] = useState(false);
    const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);

    const handleLeaveAlbum = useCallback(async () => {
        if (!album || album.isDeleted) return;
        setIsLeavingAlbum(true);

        try {
            await leaveAlbum({ albumId });
        } catch (e) {
            console.error("Failed to leave album: ", e);
            Alert.alert("Error", "Failed to leave album. Please try again.");
        } finally {
            router.back();
            setIsLeavingAlbum(false);
        }
    }, []);

    const handleDeleteAlbum = useCallback(async () => {
        if (!album || album.isDeleted) return;
        setIsDeletingAlbum(true);

        try {
            await deleteAlbum({ albumId });
        } catch (e) {
            console.error("Failed to delete album: ", e);
            Alert.alert("Error", "Failed to delete album. Please try again.");
        } finally {
            router.back();
            setIsDeletingAlbum(false);
        }
    }, []);

    return (
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>

            {/* Album Info Section */}
            <View style={styles.albumInfoSection}>
                <View style={styles.albumHeader}>
                    <View style={styles.albumHeaderText}>
                        <Text style={[styles.albumTitle, { color: colors.text }]}>{album.title}</Text>
                        <Text style={[styles.albumCreated, { color: colors.caption }]}>
                            Created {formatAlbumDate(album._creationTime)}
                        </Text>
                    </View>

                    <Pressable style={styles.editButton} onPress={() => router.push(`/album/${album._id}/edit`)}>
                        <Ionicons name="pencil" size={20} color={colors.text} />
                    </Pressable>
                </View>

                {album.description ? (
                    <View style={[styles.descriptionContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.descriptionText, { color: colors.text }]}>
                            {album.description}
                        </Text>
                    </View>
                ) : (
                    <Pressable
                        style={[styles.addDescriptionButton, { borderColor: colors.border }]}
                        onPress={() => router.push(`/album/${album._id}/edit`)}
                    >
                        <Ionicons name="add-circle-outline" size={20} color={colors.caption} />
                        <Text style={[styles.addDescriptionText, { color: colors.caption }]}>Add description</Text>
                    </Pressable>
                )}

            </View>

            {/* Quick Actions Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.caption }]}>Quick Actions</Text>

                <Pressable
                    style={styles.settingsOption}
                    onPress={() => router.push(`/album/${album._id}/members`)}
                >
                    <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="people" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.optionContent}>
                        <Text style={[styles.optionTitle, { color: colors.text }]}>View Members</Text>
                        <Text style={[styles.optionSubtitle, { color: colors.caption }]}>See who's in this album</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.border} />
                </Pressable>
            </View>

            {/* Danger Zone Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Danger Zone</Text>

                {album.hostId !== profile._id ? (
                    <Pressable
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
                    </Pressable>
                ) : (
                    <Pressable
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
                    </Pressable>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    albumInfoSection: {
        marginBottom: 24,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    albumHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    albumHeaderText: {
        flex: 1,
        marginRight: 12,
    },
    albumTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
        lineHeight: 30,
    },
    albumCreated: {
        fontSize: 13,
        fontWeight: '500',
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    descriptionContainer: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 22,
    },
    addDescriptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    addDescriptionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
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
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    optionContent: { flex: 1 },
    optionSubtitle: {
        fontSize: 13,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dangerOption: {
        borderWidth: 1,
        borderColor: '#FFE5E5',
    },
});
