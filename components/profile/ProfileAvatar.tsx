import { useTheme } from "@/context/ThemeContext";
import { Image } from "expo-image";
import { ColorValue, StyleSheet, Text, TouchableOpacity } from "react-native";


interface ProfileAvatarProps {
    avatarUrl?: string;
    nickname: string;
    size: number;
    color?: ColorValue;
    onPress?: () => void;
}

export default function ProfileAvatar({ avatarUrl, nickname, size, onPress }: ProfileAvatarProps) {
    const { themeStyles } = useTheme();
    return (
        <TouchableOpacity onPress={onPress} style={[styles.container, {
            width: size,
            height: size,
            backgroundColor: themeStyles.colors.accent,
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
        borderRadius: 16,
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