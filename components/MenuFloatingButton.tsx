import { Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';


export default function MenuFloatingButton() {
    const [isOpen, setIsOpen] = useState(false);
    const rotateAnim = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotateAnim.value * 135}deg` }],
        }
    });

    const handlePress = useCallback(() => {
        setIsOpen(!isOpen);
        rotateAnim.value = withTiming(rotateAnim.value === 0 ? 1 : 0, {
            duration: 300,
            easing: Easing.inOut(Easing.ease),
        });
    }, [isOpen]);


    return (
        <Pressable style={styles.container} onPress={handlePress}>
            <Animated.View style={animatedStyle}>
                <Plus size={24} color='white' />
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 20,
        bottom: 60,
        backgroundColor: 'teal',
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

