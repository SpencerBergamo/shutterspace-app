import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export function AlbumQRCodeScreen() {
    const { colors } = useAppTheme();
    const { albumId } = useLocalSearchParams<{ albumId: Id<'albums'> }>();

    const album = useQuery(api.albums.queryAlbum, { albumId });
    const inviteCode = useQuery(api.inviteCodes.getInviteCode, { albumId });
    const [copied, setCopied] = useState(false);

    const shareUrl = inviteCode ? `https://shutterspace.app/invite/${inviteCode}` : '';

    const handleCopyLink = async () => {
        if (!shareUrl) return;

        try {
            await Clipboard.setStringAsync(shareUrl);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
        }
    };

    const handleShareLink = async () => {
        if (!shareUrl) return;

        try {
            await Haptics.selectionAsync();
            await Share.share({
                title: 'Join my album on ShutterSpace!',
                message: `Join my album on ShutterSpace: ${shareUrl}`,
                url: shareUrl,
            });
        } catch (error) {
            console.error('Failed to share link:', error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                headerTitle: album?.title ?? 'Share Album'
            }} />

            {!inviteCode ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.caption }]}>
                        Loading invite code...
                    </Text>
                </View>
            ) : (
                <View style={styles.content}>
                    {/* QR Code Section */}
                    <View style={[styles.qrContainer, { borderColor: colors.border }]}>
                        <View style={styles.qrCodeWrapper}>
                            <QRCode
                                value={shareUrl}
                                size={200}
                                backgroundColor="white"
                                color={colors.text}
                            />
                        </View>
                        <Text style={[styles.qrLabel, { color: colors.caption }]}>
                            Scan to join this album
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <Pressable
                            disabled={!shareUrl}
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={handleShareLink}
                        >
                            <Ionicons name="share-social" size={20} color="white" />
                            <Text style={styles.actionButtonText}>Share Link</Text>
                        </Pressable>

                        <Pressable
                            disabled={copied}
                            style={[styles.actionButton, styles.secondaryButton, { backgroundColor: colors.grey3, borderColor: colors.border }]}
                            onPress={handleCopyLink}
                        >
                            <Ionicons
                                name={copied ? "checkmark-circle" : "copy-outline"}
                                size={20}
                                color={copied ? colors.primary : colors.text}
                            />
                            <Text style={[styles.secondaryButtonText, { color: copied ? colors.primary : colors.text }]}>
                                {copied ? 'Copied!' : 'Copy Link'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
        gap: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    qrContainer: {
        alignItems: 'center',
        padding: 32,
        borderRadius: 16,
        borderWidth: 1,
        gap: 16,
    },
    qrCodeWrapper: {
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    qrLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    actions: {
        gap: 12,
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
