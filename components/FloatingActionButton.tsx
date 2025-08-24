import { useTheme } from "@/context/ThemeContext";
import { Check, Plus } from "lucide-react-native";
import { StyleSheet, TouchableOpacity } from "react-native";

type FloatingActionButtonIcon = 'plus' | 'check';

interface FloatingActionButtonProps {
    icon: FloatingActionButtonIcon;
    onPress: () => void;
    disabled?: boolean;
}

const renderIcon = (icon: FloatingActionButtonIcon) => {
    switch (icon) {
        case 'plus':
            return <Plus size={24} color="white" />
        case 'check':
            return <Check size={24} color="white" />
    }
}

export default function FloatingActionButton({ icon, onPress, disabled }: FloatingActionButtonProps) {
    const { theme } = useTheme();
    return (
        <TouchableOpacity onPress={onPress} style={[styles.container, disabled && styles.disabled,
        { backgroundColor: theme.colors.primary }]}>
            {renderIcon(icon)}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        width: 60,
        height: 60,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        right: 20,
        bottom: 50,
    },

    disabled: {
        opacity: 0.5,
    }
})