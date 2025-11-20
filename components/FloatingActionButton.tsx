import useAppStyles from "@/hooks/useAppStyles";
import { useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from "react-native-reanimated";

interface DialItem {
    render: () => React.ReactNode;
    onPress: () => void;
}

interface FloatingActionButtonProps {
    render: () => React.ReactNode;
    onPress?: () => void;
    dialItems?: DialItem[];
    disabled?: boolean;
}

interface DialButtonProps {
    item: DialItem;
    targetX: number;
    targetY: number;
    isOpen: boolean;
    theme: any;
    onPress: () => void;
}

function DialButton({ item, targetX, targetY, isOpen, theme, onPress }: DialButtonProps) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(0);

    useEffect(() => {
        if (isOpen) {
            translateX.value = withSpring(targetX, { damping: 15, stiffness: 150 });
            translateY.value = withSpring(targetY, { damping: 15, stiffness: 150 });
            scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        } else {
            translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
            translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
            scale.value = withSpring(0, { damping: 15, stiffness: 150 });
        }
    }, [isOpen, targetX, targetY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ]
    }));

    return (
        <Animated.View
            style={[
                styles.dialItem,
                { backgroundColor: theme.colors.primary },
                animatedStyle
            ]}
        >
            <TouchableOpacity onPress={onPress} style={styles.dialTouchable}>
                {item.render()}
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function FloatingActionButton({
    render,
    onPress,
    dialItems,
    disabled
}: FloatingActionButtonProps) {
    const theme = useTheme();
    const appStyles = useAppStyles();
    const [isOpen, setIsOpen] = useState(false);
    const overlayOpacity = useSharedValue(0);

    useEffect(() => {
        overlayOpacity.value = withTiming(isOpen ? 1 : 0, { duration: 200 });
    }, [isOpen]);

    const handleMainPress = () => {
        if (dialItems && dialItems.length > 0) {
            setIsOpen(!isOpen);
        } else if (onPress) {
            onPress();
        }
    };

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value
    }));

    const renderDials = () => {
        if (!dialItems || dialItems.length === 0) return null;

        const radius = 120;
        const startAngle = 90;
        const endAngle = 135;
        const angleRange = endAngle - startAngle;
        const numItems = dialItems.length;
        const spacing = angleRange / (numItems + 1);

        return dialItems.map((item, index) => {
            const angle = startAngle + spacing * (index + 1);
            const radians = (angle * Math.PI) / 180;
            const targetX = -radius * Math.cos(radians);
            const targetY = -radius * Math.sin(radians);

            return (
                <DialButton
                    key={index}
                    item={item}
                    targetX={targetX}
                    targetY={targetY}
                    isOpen={isOpen}
                    theme={theme}
                    onPress={() => {
                        item.onPress();
                        setIsOpen(false);
                    }}
                />
            );
        });
    };

    return (
        <>
            {isOpen && (
                <Animated.View style={[styles.overlay, overlayStyle]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setIsOpen(false)}
                    />
                </Animated.View>
            )}
            <View style={styles.wrapper}>
                {renderDials()}
                <TouchableOpacity
                    onPress={handleMainPress}
                    disabled={disabled}
                    style={[
                        styles.mainButton,
                        disabled && styles.disabled,
                        { backgroundColor: appStyles.colorScheme.primary }
                    ]}
                >
                    {render()}
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    wrapper: {
        position: 'absolute',
        right: 20,
        bottom: 50
    },
    mainButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center'
    },
    dialItem: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute'
    },
    dialTouchable: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    disabled: {
        opacity: 0.5
    }
});
