import { BarcodeBounds } from "expo-camera";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export default function ScannerGuardrails({ bounds }: { bounds: BarcodeBounds | null }) {
    const boxX = useSharedValue(0);
    const boxY = useSharedValue(0);
    const boxWidth = useSharedValue(0);
    const boxHeight = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (bounds) {
            const config = { duration: 150, easing: Easing.out(Easing.quad) };
            boxX.value = withTiming(bounds.origin.x, config);
            boxY.value = withTiming(bounds.origin.y, config);
            boxWidth.value = withTiming(bounds.size.width, config);
            boxHeight.value = withTiming(bounds.size.height, config);
            opacity.value = withTiming(1, { duration: 100 });
        } else {
            opacity.value = withTiming(0, { duration: 150 });
        }

    }, [bounds]);

    const animatedBoxStyle = useAnimatedStyle(() => ({
        top: boxY.value,
        left: boxX.value,
        width: boxWidth.value,
        height: boxHeight.value,
        opacity: opacity.value,
        transform: [{ scale: withTiming(opacity.value === 1 ? 1 : 0.95) }],
    }));

    return (
        <Animated.View style={[styles.box, animatedBoxStyle]} pointerEvents="none">
            <View style={[styles.bracket, styles.topLeft]} />
            <View style={[styles.bracket, styles.topRight]} />
            <View style={[styles.bracket, styles.bottomLeft]} />
            <View style={[styles.bracket, styles.bottomRight]} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    box: { position: 'absolute' },
    bracket: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderColor: '#FFD60A',
        borderWidth: 3,
    },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10 },
})