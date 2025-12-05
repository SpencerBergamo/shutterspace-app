import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

function AlbumCover({ albumId }: { albumId: Id<'albums'> }) {
    const albumCover = useQuery(api.media.getAlbumCoverMedia, { albumId });
    const getAlbumThumbnail = useAction(api.albums.getAlbumCover);

    const [uri, setUri] = useState<string | undefined | null>(undefined);

    useEffect(() => {
        (async () => {
            try {
                if (albumCover) {
                    const url = await getAlbumThumbnail({ albumId, identifier: albumCover.identifier });
                    setUri(url);
                }
            } catch (e) {
                console.error("Error requesting album cover: ", e);
                setUri(null);
            }
        })();
    }, [albumCover, albumId]);

    if (uri === null) {
        return (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60%', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="image-outline" size={40} color="grey" />
            </View>
        );
    };

    return (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60%' }}>
            {uri === undefined ? (
                <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="grey" />
                </View>
            ) : (
                <View style={{ width: '100%', height: '100%' }}>
                    <Image
                        source={{ uri }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.6)']}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100%' }}
                    />
                </View>
            )}
        </View>
    );
}

export default function InviteScreen() {

    // Layout & Params
    const { code } = useLocalSearchParams<{ code: string }>();
    const { isAuthenticated } = useConvexAuth();

    // Convex
    const invitation = useQuery(api.inviteCodes.openInvite, code ? { code } : "skip");

    const acceptInvite = useMutation(api.inviteCodes.acceptInvite);

    const albumCover = invitation?.cover;

    // States
    const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);

    const accept = useCallback(async () => {
        if (isAuthenticated && invitation) {
            setIsAcceptingInvite(true);
            try {
                await acceptInvite({ code });
                router.replace('/');
            } catch (e) {
                Alert.alert("Failed", "Something went wrong, please try again.");
            } finally {
                setIsAcceptingInvite(false);
            }
        } else if (!isAuthenticated && invitation) {
            router.replace('/sign-up');
        }

    }, [isAuthenticated, invitation, code, acceptInvite]);

    const formatDate = (date: number) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const decline = () => {
        Alert.alert(
            "Decline Invite",
            "Are you sure you want to decline this invitation?",
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Decline',
                    style: 'destructive',
                    onPress: () => {

                    }
                },
            ],
        );
    };

    if (!invitation) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                headerTitle: invitation?.title ?? 'Loading...',
            }} />

            {albumCover && <AlbumCover albumId={invitation.albumId} />}

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Spacer to push content below cover image */}
                {albumCover && <View style={{ height: 320 }} />}

                {/* Content Card */}
                <View style={[
                    styles.contentCard,
                    albumCover && {
                        borderTopLeftRadius: 32,
                        borderTopRightRadius: 32,
                    }
                ]}>
                    {/* Sender Section */}
                    <View style={styles.senderSection}>
                        <View style={styles.senderAvatar}>
                            <Text style={styles.avatarText}>
                                {invitation?.sender.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.senderInfo}>
                            <Text style={styles.senderLabel}>You're invited by</Text>
                            <Text style={styles.senderName}>{invitation?.sender}</Text>
                        </View>
                    </View>

                    {/* Album Title */}
                    <Text style={styles.albumTitle}>{invitation?.title}</Text>

                    {/* Album Details */}
                    <View style={styles.detailsContainer}>
                        <View style={styles.detailItem}>
                            <Ionicons name="calendar-outline" size={20} color="#09ADA9" />
                            <Text style={styles.detailValue}>
                                {formatDate(invitation?.created)}
                            </Text>
                            <Text style={styles.detailLabel}>Created</Text>
                        </View>
                        <View style={styles.detailDivider} />
                        <View style={styles.detailItem}>
                            <Ionicons name="people-outline" size={20} color="#09ADA9" />
                            <Text style={styles.detailValue}>{invitation?.memberCount}</Text>
                            <Text style={styles.detailLabel}>Members</Text>
                        </View>
                        <View style={styles.detailDivider} />
                        <View style={styles.detailItem}>
                            <Ionicons name="images-outline" size={20} color="#09ADA9" />
                            <Text style={styles.detailValue}>{invitation?.mediaCount}</Text>
                            <Text style={styles.detailLabel}>Photos</Text>
                        </View>
                    </View>

                    {/* Description Section */}
                    {invitation?.description && (
                        <View style={styles.descriptionSection}>
                            <Text style={styles.sectionTitle}>About this album</Text>
                            <Text style={styles.descriptionText}>{invitation.description}</Text>
                        </View>
                    )}

                    {/* Personal Message Section */}
                    {invitation.message && (
                        <View style={styles.messageSection}>
                            <Text style={styles.sectionTitle}>Message from {invitation.sender}</Text>
                            <View style={styles.messageBox}>
                                <Text style={styles.messageText}>{invitation.message}</Text>
                            </View>
                        </View>
                    )}

                    {/* What You Can Do */}
                    <View style={styles.permissionsSection}>
                        <Text style={styles.sectionTitle}>As a member, you can</Text>
                        <View style={styles.permissionItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#09ADA9" />
                            <Text style={styles.permissionText}>View all photos and videos</Text>
                        </View>
                        <View style={styles.permissionItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#09ADA9" />
                            <Text style={styles.permissionText}>Add your own memories</Text>
                        </View>
                        <View style={styles.permissionItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#09ADA9" />
                            <Text style={styles.permissionText}>Download shared content</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <BlurView intensity={80} tint="light" style={[styles.actionContainer, { paddingBottom: 50 }]}>
                <TouchableOpacity
                    style={styles.declineButton}
                    onPress={decline}
                    disabled={isAcceptingInvite}
                >
                    <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.acceptButton, isAcceptingInvite && styles.acceptButtonDisabled]}
                    onPress={accept}
                    disabled={isAcceptingInvite}
                >
                    {isAcceptingInvite ? (
                        <Text style={styles.acceptButtonText}>Joining...</Text>
                    ) : (
                        <>
                            <Ionicons name="heart" size={20} color="white" />
                            <Text style={styles.acceptButtonText}>{isAuthenticated ? 'Accept Invitation' : 'Sign in to accept'}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    thumbnailContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '45%',
    },
    thumbnailImage: {
        height: '100%',
        width: '100%',
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
    },
    contentCard: {
        backgroundColor: 'white',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 24,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    senderSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    senderAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#09ADA9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 3,
        borderColor: 'white',
    },
    avatarText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    senderInfo: {
        flex: 1,
    },
    senderLabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 2,
    },
    senderName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },

    albumTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 24,
        lineHeight: 38,
    },
    detailsContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    detailItem: {
        alignItems: 'center',
        flex: 1,
    },
    detailValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginTop: 8,
    },
    detailLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    detailDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E0E0E0',
    },
    descriptionSection: {
        marginBottom: 24,
    },
    messageSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
    },
    messageBox: {
        backgroundColor: '#F0F9F8',
        borderLeftWidth: 3,
        borderLeftColor: '#09ADA9',
        borderRadius: 12,
        padding: 16,
    },
    messageText: {
        fontSize: 15,
        color: '#1a1a1a',
        lineHeight: 22,
        fontStyle: 'italic',
    },
    permissionsSection: {
        marginBottom: 24,
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    permissionText: {
        fontSize: 15,
        color: '#1a1a1a',
        marginLeft: 12,
    },
    actionContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingTop: 16,
        gap: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E0E0E0',
    },
    declineButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#f8f9fa',
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    acceptButton: {
        flex: 2,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#09ADA9',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: '#09ADA9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    acceptButtonDisabled: {
        opacity: 0.7,
    },
    acceptButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
})