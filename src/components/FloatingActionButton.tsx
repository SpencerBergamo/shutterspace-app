import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { useCallback } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../context/AppThemeContext";

interface FloatingActionButtonProps {
    selectIcon: SelectIcon;
    items?: FloatingActionButtonItemProps[];
    onPress?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
}

export type FloatingActionButtonItemProps = {
    selectIcon: SelectIcon;
    label: string;
    onPress: () => void;
}

export type SelectIcon =
    | 'add'
    | 'checkmark'
    | 'share-outline'
    | 'qr-code-outline'
    | 'image-outline'
    | 'camera-outline'
    | 'create-outline'
    | 'people-outline'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);
const ITEM_HEIGHT = 48;
const ITEM_GAP = 8;

const FloatingActionButtonItem = ({ selectIcon, label, onPress, index, isExpanded, onItemPress }: FloatingActionButtonItemProps & { index: number, isExpanded: SharedValue<number>, onItemPress: () => void }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const distance = (index + 1) * (ITEM_HEIGHT + ITEM_GAP);
        const translateY = isExpanded.value ? -distance : 0;

        const delay = index * 20;

        return {
            transform: [
                {
                    translateY: withDelay(delay, withSpring(translateY, {
                        damping: 15,
                        stiffness: 150,
                    }))
                },
                {
                    scale: withDelay(delay, withSpring(isExpanded.value ? 1 : 0, {
                        damping: 15,
                        stiffness: 150,
                    }))
                }
            ],
            opacity: withDelay(delay, withTiming(isExpanded.value ? 1 : 0, { duration: 150 }))
        }
    });

    return (
        <View style={{ position: 'absolute' }}>
            <AnimatedPressable style={[styles.itemContainer, animatedStyle]} onPress={onItemPress}>
                <Ionicons name={selectIcon} size={18} color="#333" />
                <Text style={styles.itemLabel}>{label}</Text>
            </AnimatedPressable>
        </View>
    )
}

export default function FloatingActionButton({ selectIcon, items, onPress, disabled = false, isLoading = false }: FloatingActionButtonProps) {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();

    const isExpanded = useSharedValue(0);

    const iconStyle = useAnimatedStyle(() => {
        const rotate = `${isExpanded.value * 45}deg`;

        return {
            transform: [
                { rotate: withSpring(rotate, { damping: 15, stiffness: 150 }) },
            ]
        }
    });

    const handleMainPress = useCallback(() => {
        if (disabled || isLoading) return;
        Haptics.selectionAsync();
        if (!onPress) {
            isExpanded.value = isExpanded.value ? 0 : 1;
        } else {
            onPress();
        }
    }, [onPress, isExpanded, disabled, isLoading]);

    const handleItemPress = useCallback(async (item: FloatingActionButtonItemProps) => {
        Haptics.selectionAsync();
        isExpanded.value = 0;
        setTimeout(() => {
            item.onPress();
        }, 200);
    }, [isExpanded]);

    return (
        <View style={[styles.position, { bottom: insets.bottom + 20 }]}>
            {items && items.map((item, index) => (
                <FloatingActionButtonItem
                    key={index}
                    index={index}
                    isExpanded={isExpanded}
                    onItemPress={() => handleItemPress(item)}
                    {...item} />
            ))}
            <AnimatedPressable 
                style={[styles.button, { 
                    backgroundColor: disabled ? '#ccc' : colors.primary,
                    opacity: disabled ? 0.6 : 1,
                }]} 
                onPress={handleMainPress}
                disabled={disabled || isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <AnimatedIcon name={selectIcon ?? "add"} size={24} color="white" style={iconStyle} />
                )}
            </AnimatedPressable>
        </View>
    )
}

const styles = StyleSheet.create({
    position: {
        position: 'absolute',
        alignItems: 'flex-end',
        right: 30,
    },
    itemContainer: {
        backgroundColor: 'white',
        borderRadius: 999,
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignSelf: 'flex-end',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    itemLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    button: {
        width: 56,
        height: 56,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
})
