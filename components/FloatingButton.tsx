import { useTheme } from "@/context/ThemeContext";
import * as Haptics from 'expo-haptics';
import { ArrowRight, Camera, Check, Image, Plus } from "lucide-react-native";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";


type IconType = 'plus' | 'arrow' | 'camera' | 'image' | 'submit';

interface FloatingButtonProps {
    isLoading?: boolean;
    isEnabled?: boolean;
    iconType: IconType;
    onPress: () => void;
}

export default function FloatingButton({
    isLoading = false,
    isEnabled = true,
    iconType,
    onPress,
}: FloatingButtonProps) {
    const { theme } = useTheme();

    const primaryColor = theme.colors.primary;
    const iconSize = 24;

    // TODO: add animation later
    // const scaleAnim = useSharedValue(1);
    // const animatedStyle = useAnimatedStyle(() => {
    //     return {
    //         transform: [{ scale: scaleAnim.value }],
    //     }
    // });
    // const handleAnimation = useCallback(() => {
    //     scaleAnim.value = withTiming(0.85, {
    //         duration: 100,
    //         easing: Easing.inOut(Easing.ease),
    //     }, () => {
    //         scaleAnim.value = withTiming(1, {
    //             duration: 100,
    //             easing: Easing.inOut(Easing.ease),
    //         });
    //     });
    // }, [scaleAnim]);

    const handlePress = useCallback(() => {
        if (!isEnabled) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        onPress();
    }, [isEnabled, onPress]);

    const renderIcon = (type?: IconType) => {

        switch (type ?? iconType) {
            case 'plus':
                return <Plus size={iconSize} color='white' />
            case 'arrow':
                return <ArrowRight size={iconSize} color='white' />
            case 'camera':
                return <Camera size={iconSize} color='white' />
            case 'image':
                return <Image size={iconSize} color='white' />
            case 'submit':
                return <Check size={iconSize} color='white' />
            default:
                return <Plus size={iconSize} color='white' />

        }
    }

    return (
        <View style={styles.container}>
            <View style={[styles.button, {
                backgroundColor: isEnabled ? primaryColor : 'grey',
            }]}>
                <Pressable onPress={handlePress}>
                    {isLoading ? <ActivityIndicator size='small' color='white' /> : renderIcon()}
                </Pressable>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 20,
        bottom: 50,
    },

    button: {
        width: 56,
        height: 56,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },

    disabled: {
        opacity: 0.5,
    },
});