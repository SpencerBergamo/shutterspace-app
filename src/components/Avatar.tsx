import * as Haptics from 'expo-haptics';
import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useAppTheme } from "../context/AppThemeContext";

interface AvatarProps {
    nickname: string;
    avatarKey?: string;
    ssoAvatarUrl?: string;
    localUri?: string;
    size?: number;
    onPress?: () => void;
}

export default function Avatar({
    nickname,
    avatarKey,
    ssoAvatarUrl,
    localUri,
    size = 40,
    onPress,
}: AvatarProps) {
    const { colors } = useAppTheme();

    async function handlePress() {
        if (onPress) {
            await Haptics.selectionAsync();
            onPress();
        }
    }

    const containerStyle = {
        width: size,
        height: size,
        backgroundColor: colors.secondary + '60',
        borderColor: colors.border,
    };

    const imageStyle = {
        width: size,
        height: size,
    };

    return (
        <TouchableOpacity onPress={handlePress} style={[styles.container, containerStyle]}>
            {ssoAvatarUrl ? (
                <Image
                    source={{ uri: ssoAvatarUrl }}
                    style={imageStyle}
                    contentFit="cover"
                />
            ) : avatarKey ? (
                <Image
                    source={{ uri: `https://avatar.shutterspace.app/${avatarKey}` }}
                    style={imageStyle}
                    contentFit="cover"
                />
            ) : localUri ? (
                <Image
                    source={{ uri: localUri }}
                    style={imageStyle}
                    contentFit="cover"
                />
            ) : (
                <Text style={styles.initial}>{nickname.charAt(0)}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
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
