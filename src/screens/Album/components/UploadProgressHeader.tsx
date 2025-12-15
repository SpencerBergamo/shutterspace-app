import { useAppTheme } from '@/src/context/AppThemeContext';
import { PendingMedia } from '@/src/hooks/useMedia';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface UploadProgressHeaderProps {
    pendingMedia: PendingMedia[];
    onRetryAll: () => void;
    onClearFailed: () => void;
}

export default function UploadProgressHeader({ pendingMedia, onRetryAll, onClearFailed }: UploadProgressHeaderProps) {
    const { colors } = useAppTheme();

    const iconOpacity = useSharedValue(0.4);
    const iconScale = useSharedValue(1);
    const containerHeight = useSharedValue(0);
    const containerOpacity = useSharedValue(0);

    const uploadingCount = pendingMedia.filter(p => p.status === 'uploading').length;
    const errorCount = pendingMedia.filter(p => p.status === 'error').length;
    const hasErrors = errorCount > 0;
    const isVisible = pendingMedia.length > 0;

    // Handle visibility animation
    useEffect(() => {
        if (isVisible) {
            containerOpacity.value = withTiming(1, { duration: 200 });
            containerHeight.value = withSpring(hasErrors ? 92 : 49, {
                damping: 20,
                stiffness: 300,
            });
        } else {
            // Fade out first, then collapse height
            containerOpacity.value = withTiming(0, { duration: 150 });
            containerHeight.value = withTiming(0, {
                duration: 200,
                easing: Easing.inOut(Easing.ease),
            });
        }
    }, [isVisible, hasErrors]);

    // Handle icon animations
    useEffect(() => {
        if (isVisible && !hasErrors) {
            // Pulsing opacity animation
            iconOpacity.value = withRepeat(
                withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );

            // Gentle scale animation
            iconScale.value = withRepeat(
                withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        } else {
            // Reset animations when there's an error or not visible
            iconOpacity.value = 1;
            iconScale.value = 1;
        }
    }, [isVisible, hasErrors]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        height: containerHeight.value,
        opacity: containerOpacity.value,
    }));

    const animatedIconStyle = useAnimatedStyle(() => ({
        opacity: iconOpacity.value,
        transform: [{ scale: iconScale.value }],
    }));

    if (hasErrors) {
        return (
            <Animated.View style={[styles.container, styles.errorContainer, animatedContainerStyle]}>
                <Animated.View style={styles.content}>
                    <Ionicons name="alert-circle-outline" size={20} color="#FF3B30" strokeWidth={2.5} />
                    <Text style={styles.errorText}>
                        {errorCount} {errorCount === 1 ? 'upload' : 'uploads'} failed
                    </Text>
                </Animated.View>
                <Animated.View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onRetryAll}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="refresh-outline" size={16} color={colors.primary} strokeWidth={2.5} />
                        <Text style={styles.actionButtonText}>Retry All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onClearFailed}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close-outline" size={16} color="#666" strokeWidth={2.5} />
                        <Text style={[styles.actionButtonText, { color: '#666' }]}>Dismiss</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[styles.container, animatedContainerStyle]}>
            <Animated.View style={styles.content}>
                <Animated.View style={animatedIconStyle}>
                    <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} strokeWidth={2.5} />
                </Animated.View>
                <Text style={styles.text}>
                    Uploading {uploadingCount} {uploadingCount === 1 ? 'item' : 'items'}...
                </Text>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        overflow: 'hidden',
    },
    errorContainer: {
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    text: {
        fontSize: 15,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FF3B30',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'white',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
});
