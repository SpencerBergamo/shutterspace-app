import { useAppTheme } from "@/src/context/AppThemeContext";
import { Image } from "expo-image";
import { ColorValue, StyleSheet, Text, TouchableOpacity } from "react-native";


interface AvatarProps {
    avatarUrl?: string;
    nickname: string;
    size: number;
    borderRadius?: number;
    color?: ColorValue;
    onPress?: () => void;
}

export default function Avatar({ avatarUrl, nickname, size, borderRadius, onPress }: AvatarProps) {
    const { colors } = useAppTheme();

    return (
        <TouchableOpacity onPress={onPress} style={[styles.container, {
            width: size,
            height: size,
            backgroundColor: colors.secondary + '60',
            borderRadius: borderRadius || 16,
        }]}>
            {avatarUrl && avatarUrl !== '' ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
                <Text style={styles.nickname}>{nickname.charAt(0)}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
    },
    nickname: {
        fontSize: 18,
        fontWeight: '600',
    },
});