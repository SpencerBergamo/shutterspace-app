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
    const { themeStyles } = useTheme();
    const scaleAnim = useSharedValue(1);
    const fab = themeStyles.components.floatingActionButton;
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scaleAnim.value }],
        }
    });

    const renderIcon = (type?: IconType) => {

        switch (type ?? iconType) {
            case 'plus':
                return <Plus size={fab.iconSize} color={fab.iconColor} />
            case 'arrow':
                return <ArrowRight size={fab.iconSize} color={fab.iconColor} />
            case 'camera':
                return <Camera size={fab.iconSize} color={fab.iconColor} />
            case 'image':
                return <Image size={fab.iconSize} color={fab.iconColor} />
            default:
                return <Plus size={fab.iconSize} color={fab.iconColor} />

        }
    }


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


    return (
        <View style={styles.container}>

            {/* Menu */}
            {mode === 'menu' && openMenu && (
                <View style={styles.menuContainer}>
                    {menuItems?.map((item, index) => (
                        <Pressable key={index} style={[styles.menuItem, {
                            backgroundColor: fab.backgroundColor,
                            borderRadius: fab.borderRadius,
                            width: fab.width,
                            height: fab.height,
                        }]} onPress={item.onPress}>
                            {renderIcon(item.iconType)}
                        </Pressable>
                    ))}
                </View>
            )}


            {/* Main FAB */}
            <Animated.View style={[styles.fab, animatedStyle, {
                backgroundColor: fab.backgroundColor,
                borderRadius: fab.borderRadius,
                width: fab.width,
                height: fab.height,
            }, !isEnabled && styles.disabled]}>
                <Pressable style={styles.pressable} onPress={handlePress}>
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

    fab: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabled: {
        opacity: 0.5,
    },


    pressable: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    menuContainer: {
        marginBottom: 16,
        gap: 12,
    },
    menuItem: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});