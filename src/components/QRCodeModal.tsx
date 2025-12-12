import { useAppTheme } from "@/src/context/AppThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

interface QRCodeModalProps {
    visible: boolean;
    onClose: () => void;
    value: string;
    displayValue?: string;
    title?: string;
    description?: string;
    showCopyButton?: boolean;
}

export default function QRCodeModal({
    visible,
    onClose,
    value,
    displayValue,
    title = "QR Code",
    description,
    showCopyButton = true,
}: QRCodeModalProps) {
    const { colors } = useAppTheme();

    const duration = 250;
    const fadeDuration = 150;
    const ease = Easing.inOut(Easing.ease);
    const [currentIcon, setCurrentIcon] = useState<'copy' | 'check'>('copy');

    const copyIconOpacity = useSharedValue(1);
    const copyIconScale = useSharedValue(1);
    const checkIconOpacity = useSharedValue(0);
    const checkIconScale = useSharedValue(0);

    // Content animation for smooth entrance
    const contentOpacity = useSharedValue(0);
    const contentTranslateY = useSharedValue(20);

    useEffect(() => {
        if (visible) {
            // Delay content animation to allow rotation to complete
            contentOpacity.value = withDelay(150, withTiming(1, { duration: 300, easing: ease }));
            contentTranslateY.value = withDelay(150, withTiming(0, { duration: 300, easing: ease }));
        } else {
            contentOpacity.value = 0;
            contentTranslateY.value = 20;
            // Reset icon animations when modal closes
            copyIconOpacity.value = 1;
            copyIconScale.value = 1;
            checkIconOpacity.value = 0;
            checkIconScale.value = 0;
            setCurrentIcon('copy');
        }
    }, [visible]);

    const contentAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: contentOpacity.value,
            transform: [{ translateY: contentTranslateY.value }],
        };
    });

    const copyAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: copyIconOpacity.value,
            transform: [{ scale: copyIconScale.value }],
        };
    });

    const checkAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: checkIconOpacity.value,
            transform: [{ scale: checkIconScale.value }],
        };
    });

    const animateIcon = useCallback(async () => {
        if (currentIcon === 'check') return;

        // hide copy icon
        copyIconOpacity.value = withTiming(0, {
            duration: fadeDuration,
            easing: ease,
        });
        copyIconScale.value = withTiming(0.8, {
            duration: fadeDuration,
            easing: ease,
        })

        setCurrentIcon('check');

        await new Promise(resolve => setTimeout(resolve, fadeDuration / 2));

        // show check icon
        checkIconOpacity.value = withTiming(1, {
            duration: duration,
            easing: ease,
        });
        checkIconScale.value = withTiming(1, {
            duration: duration,
            easing: Easing.out(Easing.back(2)),
        });
    }, [currentIcon, copyIconScale, copyIconOpacity, checkIconScale, checkIconOpacity]);

    const handleCopyLink = async () => {
        try {
            await Clipboard.setStringAsync(value);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            await animateIcon();
        } catch (e) {
            console.error("failed to copy link", e);
            Alert.alert("Error", "Failed to copy link. Please try again.");
        }
    };

    const handleShareLink = async () => {
        try {
            await Share.share({
                title: 'Join me on Shutterspace!',
                message: value,
                url: value,
            });
        } catch (e) {
            console.error("failed to share link", e);
            Alert.alert("Error", "Failed to share link. Please try again.");
        }
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Animated.View
                    style={[styles.modalContainer, { backgroundColor: colors.background }, contentAnimatedStyle]}
                >
                    <Pressable
                        style={styles.content}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                            {description && (
                                <Text style={[styles.description, { color: colors.caption }]}>
                                    {description}
                                </Text>
                            )}
                        </View>

                        {/* QR Code */}
                        <View style={[styles.qrCodeContainer, { borderColor: colors.border }]}>
                            <QRCode
                                value={value}
                                size={200}
                                backgroundColor="white"
                            />
                        </View>


                        {displayValue && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: 236 }}>

                                <TextInput
                                    value={value}
                                    editable={false}
                                    style={{
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                        color: colors.text,
                                        borderWidth: 1,
                                        borderRadius: 8,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        fontSize: 14,
                                        flexShrink: 1,
                                    }}
                                />

                                <TouchableOpacity onPress={handleCopyLink}>
                                    {currentIcon === 'copy' ? (
                                        <Animated.View style={copyAnimatedStyle}>
                                            <Ionicons name="copy-outline" size={24} color={colors.text} />
                                        </Animated.View>
                                    ) : (
                                        <Animated.View style={checkAnimatedStyle}>
                                            <Ionicons name="checkmark" size={24} color={colors.text} />
                                        </Animated.View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Copy Button */}
                        {showCopyButton && (
                            <TouchableOpacity
                                style={[styles.copyButton, { backgroundColor: colors.primary }]}
                                onPress={handleShareLink}
                            >
                                <Text style={styles.copyButtonText}>{"Share Link"}</Text>
                            </TouchableOpacity>
                        )}

                        {/* Close Button */}
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: colors.grey2 }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignContent: 'center',
    },
    modalContainer: {
        borderRadius: 24,
        width: '100%',
        height: 'auto',
        maxWidth: 400,
        maxHeight: 700,
        paddingVertical: 32,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    content: {
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center',
    },
    header: {
        flexDirection: 'column',
        gap: 6,
        alignItems: 'center',
        maxWidth: 200,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
    },

    // QR Code Container
    qrCodeContainer: {
        padding: 16,
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: 'white',
    },

    // Copy Button
    copyButton: {
        width: 236,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    copyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    // Close Button
    closeButton: {
        width: 236,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
