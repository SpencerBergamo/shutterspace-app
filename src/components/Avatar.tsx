import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useAppTheme } from "../context/AppThemeContext";

interface AvatarProps {
    nickname: string;
    avatarKey?: string;
    ssoAvatarUrl?: string;
    localUri?: string;
    size?: number;
    onPress?: () => void;
    onLongPress?: () => void;
}

export default function Avatar({
    nickname,
    avatarKey,
    ssoAvatarUrl,
    localUri,
    size = 40,
    onPress,
    onLongPress,
}: AvatarProps) {
    const { colors } = useAppTheme();

    const [imageError, setImageError] = useState(false);

    async function handlePress() {
        if (onPress) {
            await Haptics.selectionAsync();
            onPress();
        }
    }

    const containerStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.secondary + '60',
        borderColor: colors.border,
    };

    const avatarUrl = ssoAvatarUrl || (avatarKey ? `https://avatar.shutterspace.app/${avatarKey}` : null) || localUri;

    return (
        <TouchableOpacity onPress={handlePress} onLongPress={onLongPress} style={[styles.container, containerStyle]}>
            {avatarUrl || !imageError ? (
                <Image
                    key={avatarUrl}
                    source={{ uri: avatarUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode='cover'
                    onError={(error) => {
                        console.error('Avatar image failed to load:', error);
                        setImageError(true);
                    }}
                />
            ) : (
                <Text style={styles.initial}>{nickname.charAt(0)}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    initial: {
        fontSize: 18,
        fontWeight: '600',
    },
});
