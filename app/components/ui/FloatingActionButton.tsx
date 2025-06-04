import { LucideIcon, Plus } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

interface FABProps {
    onPress: () => void;
    icon?: LucideIcon;
    style?: ViewStyle;
    id: string;
}

export default function FloatingActionButton({
    onPress,
    icon: Icon = Plus,
    style,
    id
}: FABProps) {
    return (
        <Animated.View
            sharedTransitionTag={id}
            style={[styles.fab, style]}>
            <TouchableOpacity
                style={styles.button}
                onPress={onPress}>
                <Icon size={24} color="#fff" />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    button: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
