import { useTheme } from "@/context/ThemeContext";
import { Pressable, StyleSheet } from "react-native";


interface ButtonProps {
    onPress: () => void;
    icon: React.ReactNode;
    iconColor?: string;
}

export default function BackButton({ onPress, icon, iconColor = '#333333' }: ButtonProps) {
    const { theme } = useTheme();

    return (
        <Pressable style={styles.container} onPress={onPress}>
            {icon}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E9ECEF',
        alignItems: 'center',
        justifyContent: 'center',
    },
})