import { useTheme } from "@/context/ThemeContext";
import * as Haptics from 'expo-haptics';
import { ArrowRight, Camera, Image, Plus } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";


type IconType = 'plus' | 'arrow' | 'camera' | 'image';
type MenuItem = {
    iconType: IconType;
    label: string;
    onPress: () => void;
}

interface FloatingButtonProps {
    isEnabled?: boolean;
    iconType: IconType;
    mode?: 'default' | 'menu';
    openMenu?: boolean;
    onOpenMenu?: () => void;
    menuItems?: MenuItem[];
    onPress: () => void;
}

export default function FloatingButton({
    isEnabled = true,
    iconType,
    mode = 'default',
    openMenu = false,
    onOpenMenu,
    menuItems,
    onPress,
}: FloatingButtonProps) {
    const { theme } = useTheme();
    const scaleAnim = useSharedValue(1);

    const primaryColor = theme.colors.primary;
    const iconSize = 24;

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scaleAnim.value }],
        }
    });

    const handlePress = useCallback(() => {
        if (!isEnabled) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        scaleAnim.value = withTiming(0.85, {
            duration: 100,
            easing: Easing.inOut(Easing.ease),
        }, () => {
            scaleAnim.value = withTiming(1, {
                duration: 100,
                easing: Easing.inOut(Easing.ease),
            });
        });

        if (mode === 'menu') {
            onOpenMenu?.();
        } else {
            onPress();
        }

    }, [isEnabled]);

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
            default:
                return <Plus size={iconSize} color='white' />

        }
    }

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.button, animatedStyle, {
                backgroundColor: primaryColor,
            }]}>
                <Pressable onPress={handlePress}>
                    {renderIcon()}
                </Pressable>
            </Animated.View>
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