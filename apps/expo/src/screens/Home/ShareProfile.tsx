import { api } from "@shutterspace/backend/convex/_generated/api";
import { useAppTheme } from "@/src/context/AppThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useAction, useQuery } from "convex/react";
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Stack } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export function ShareProfileScreen() {
    const { colors } = useAppTheme();
    const profile = useQuery(api.profile.getUserProfile);
    const createShareCode = useAction(api.shareCodes.createShareCode);

    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [copied, setCopied] = useState(false);
    const qrRef = useRef<any>(null);

    const logo = profile?.avatarKey ? `https://avatar.shutterspace.app/${profile.avatarKey}` : undefined;

    const shareUrl = profile?.shareCode
        ? `https://shutterspace.app/shareId/${profile.shareCode}`
        : '';

    const handleGenerateCode = async () => {
        if (isGeneratingCode) return;

        setIsGeneratingCode(true);
        try {
            await createShareCode({});
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to generate share code:', error);
            Alert.alert('Error', 'Failed to generate share code. Please try again.');
        } finally {
            setIsGeneratingCode(false);
        }
    };

    const handleCopyLink = async () => {
        if (!shareUrl) return;

        try {
            await Clipboard.setStringAsync(shareUrl);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
            Alert.alert('Error', 'Failed to copy link. Please try again.');
        }
    };

    const handleShareLink = async () => {
        if (!shareUrl) return;

        try {
            await Haptics.selectionAsync();
            await Share.share({
                title: 'Join me on ShutterSpace!',
                message: `Check out my profile on ShutterSpace: ${shareUrl}`,
                url: shareUrl,
            });
        } catch (error) {
            console.error('Failed to share link:', error);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <Stack.Screen options={{
                headerTitle: 'Share Profile',
            }} />

            {profile?.shareCode ? (
                <View style={styles.contentContainer}>
                    {/* QR Code Section */}
                    <View style={[styles.qrContainer, { borderColor: colors.border }]}>
                        <View style={styles.qrCodeWrapper}>
                            <QRCode
                                value={shareUrl}
                                size={200}
                                backgroundColor="white"
                                color={colors.text}
                                getRef={(ref) => (qrRef.current = ref)}
                                logo={logo ? { uri: logo } : undefined}
                                logoSize={40}
                                logoBackgroundColor="white"
                            />
                        </View>
                        <Text style={[styles.qrLabel, { color: colors.caption }]}>
                            Scan to add me on ShutterSpace
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
            ) : (
                <View style={styles.noCodeContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="qr-code" size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.noCodeTitle, { color: colors.text }]}>
                        Generate Your Share Code
                    </Text>
                    <Text style={[styles.noCodeDescription, { color: colors.caption }]}>
                        Create a unique QR code and link to share your profile with friends
                    </Text>
                    <Pressable
                        style={[styles.generateButton, { backgroundColor: colors.primary }]}
                        onPress={handleGenerateCode}
                        disabled={isGeneratingCode}
                    >
                        {isGeneratingCode ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <Ionicons name="add-circle" size={20} color="white" />
                                <Text style={styles.generateButtonText}>Generate Code</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            )}


        </View>
    );
}

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        padding: 20,
        gap: 20,
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
    codeContainer: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        gap: 8,
    },
    codeLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    code: {
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 4,
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
    noCodeContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 20,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noCodeTitle: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    noCodeDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 320,
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 8,
    },
    generateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
