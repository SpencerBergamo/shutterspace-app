import { api } from "@/convex/_generated/api";
import { InviteContent } from "@/types/Invites";
import { Ionicons } from "@expo/vector-icons";
import { useAction, useConvexAuth } from "convex/react";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function InviteScreen() {
    const insets = useSafeAreaInsets();
    const { code } = useLocalSearchParams<{ code: string }>();
    const { isAuthenticated } = useConvexAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
    const [invite, setInvite] = useState<InviteContent | null>(null);

    const openInvite = useAction(api.inviteCodes.openInvite);

    useEffect(() => {
        (async () => {
            const invite = await openInvite({ code });
            setIsLoading(false);
            setInvite(invite);
        })();
    }, [isAuthenticated, code]);

    const acceptInvite = useCallback(async () => {
        setIsAcceptingInvite(true);
    }, [isAuthenticated]);

    const declineInvite = () => {
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

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        )
    };

    if (!invite) {
        router.replace('/');
        return null;
    }

    return (
        <View style={styles.container}>

            {invite.coverUrl && <View style={styles.thumbnailContainer}>
                <Image
                    source={{ uri: invite.coverUrl }}
                    style={styles.thumbnailImage}
                    contentFit="cover"
                />

                <LinearGradient
                    colors={['transparent', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.6)']}
                    style={styles.gradient}
                />
            </View>}

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{}}
                showsVerticalScrollIndicator={false}
            >

                {/* spacer to push card down */}
                <View style={{ height: invite.coverUrl ? 0 : 300 }} />

                {/* Content Card */}
                <View style={[
                    styles.contentCard,
                    invite.coverUrl && {
                        borderTopLeftRadius: 32,
                        borderTopRightRadius: 32,
                    }
                ]}>
                    {/* Sender Section */}
                    <View style={styles.senderSection}>
                        <View style={styles.senderAvatar}>
                            <Text style={styles.avatarText}>
                                {invite.sender.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.senderInfo}>
                            <Text style={styles.senderLabel}>You're invited by</Text>
                            <Text style={styles.senderName}></Text>
                        </View>
                    </View>
                </View>

                {/* Album Title */}
                <Text style={styles.albumTitle}>{invite.title}</Text>

                {/* Album Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={20} color="#09ADA9" />
                        <Text style={styles.detailValue}></Text>
                        <Text style={styles.detailLabel}>Created</Text>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailItem}>
                        <Ionicons name="images-outline" size={20} color="#09ADA9" />
                        <Text style={styles.detailValue}></Text>
                        <Text style={styles.detailLabel}>Created</Text>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailItem}>
                        <Ionicons name="images-outline" size={20} color="#09ADA9" />
                        <Text style={styles.detailValue}></Text>
                        <Text style={styles.detailLabel}>Created</Text>
                    </View>
                </View>

                {/* Description Section */}
                {invite.description && (
                    <View style={styles.descriptionSection}>
                        <Text style={styles.sectionTitle}>About this album</Text>
                        <Text style={styles.descriptionText}>{invite.description}</Text>
                    </View>
                )}

                {/* Personal Message Section */}
                {invite.message && (
                    <View style={styles.messageSection}>
                        <Text style={styles.sectionTitle}>Message from {invite.sender}</Text>
                        <View style={styles.messageBox}>
                            <Text style={styles.messageText}>{invite.message}</Text>
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
                    {/* <View style={styles.permissionItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#09ADA9" />
                        <Text style={styles.permissionText}>Comment and react</Text>
                    </View> */}
                    <View style={styles.permissionItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#09ADA9" />
                        <Text style={styles.permissionText}>Download shared content</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <BlurView intensity={80} tint="light" style={[styles.actionContainer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={styles.declineButton}
                    onPress={declineInvite}
                    disabled={isAcceptingInvite}
                >
                    <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.acceptButton, isAcceptingInvite && styles.acceptButtonDisabled]}
                    onPress={acceptInvite}
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
        marginHorizontal: 24,
        paddingTop: 24,
        minHeight: '100%',
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